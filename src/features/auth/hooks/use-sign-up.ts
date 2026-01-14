import { authRepository, userRepository } from '@/src/api/repositories';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { UserDetails } from '@/src/entities/user/model/user';
import { saveSession } from '@/src/features/auth/storage/token-storage';
import { useState } from 'react';

interface UseSignUpReturn {
  signUp: (
    email: string, 
    password: string, 
    userName: string, 
    photo?: string, 
    birthDate?: Date, 
    fullName?: string, 
    bio?: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useSignUp = (): UseSignUpReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsLoading: setGlobalLoading, setUser } = useUser();
  const { showError } = useAppAlert();

  const signUp = async (
    email: string, 
    password: string, 
    userName: string, 
    photo?: string, 
    birthDate?: Date, 
    fullName?: string, 
    bio?: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setGlobalLoading(true);
      setError(null);

      // Step 1: Check if username is available
      const isUserNameTaken = await userRepository.checkUserNameExists(userName);
      if (isUserNameTaken) {
        throw new Error('El nombre de usuario ya está en uso. Por favor, elige otro diferente.');
      }

      // Step 2: Register user with Firebase Auth
      const userId = await authRepository.register(email, password);

      // Wait for Auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Force token refresh to ensure claims are ready
      await authRepository.getIdToken(true);
      console.log('useSignUp: Auth state refreshed for user', userId);

      // Step 3: Upload profile photo if provided
      let photoURL: string | undefined;
      if (photo) {
        try {
          photoURL = await userRepository.uploadProfilePhoto(userId, photo);
        } catch (photoError) {
          console.warn('Failed to upload profile photo:', photoError);
          // Continue without photo - it's not critical for account creation
        }
      }

      // Step 4: Prepare user data
      const userData: Partial<UserDetails> = {
        email,
        userName,
        fullName: fullName,
        bio: bio,
        photoURL: photoURL || "",
        birthDate: birthDate,
      };
      
      // Step 5: Create user profile in Firestore (with retry for unauthenticated error)
      let userCreated = false;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (!userCreated && attempts < MAX_ATTEMPTS) {
        try {
            attempts++;
            userCreated = await userRepository.createUser(userId, userData);
        } catch (createError: any) {
            console.warn(`Attempt ${attempts} to create user profile failed:`, createError);
            
            // If unauthenticated (or first attempt generic failure), force refresh token and retry
            const isAuthError = createError?.message?.includes('unauthenticated') || createError?.code === 'unauthenticated';
            const isNetworkError = createError?.message?.includes('network');
            
            if (isAuthError || isNetworkError || attempts === 1) { // Always retry once on any error just in case
                if (attempts < MAX_ATTEMPTS) {
                    console.log('Refreshing token and retrying profile creation...');
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait a bit
                    await authRepository.getIdToken(true); // Force refresh
                    continue;
                }
            }
            throw createError;
        }
      }
      
      if (!userCreated) {
        throw new Error('No se pudo crear el perfil de usuario');
      }

      // Step 6: Wait for user document to be available
      // Note: users_completeProfile might have created/updated it, or onCreate trigger.
      // We increased attempts to tolerate cold starts.
      const documentExists = await authRepository.waitForUserDocument(userId, 10, 1000);
      
      if (!documentExists) {
        throw new Error('El perfil de usuario no está disponible. Por favor, intenta iniciar sesión.');
      }

      // Step 7: Load user data immediately and save to context
      try {
        const createdUser = await userRepository.getUserById(userId);
        setUser(createdUser);
        console.log('User data loaded and saved to context after registration');
      } catch (loadError) {
        console.warn('Could not load user data immediately after registration:', loadError);
        // Continue anyway - the auth state listener will load it
      }

      // Step 8: Get session data and save to secure store
      const sessionData = await authRepository.getSessionData();
      
      if (sessionData) {
        await saveSession(sessionData);
      } else {
        console.warn('Could not retrieve session data after registration');
      }


      
    } catch (err: any) {
      // Los errores ya vienen con mensajes apropiados desde los repositorios
      const errorMessage = err?.message || 'Error al crear la cuenta. Por favor, intenta nuevamente.';
      const errorTitle = 'Error al crear cuenta';
      
      setError(errorMessage);
      showError(errorMessage, errorTitle);
      console.error('Sign up error:', err);
      throw err;
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  return {
    signUp,
    isLoading,
    error,
  };
};
