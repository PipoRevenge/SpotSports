import { authRepository, userRepository } from '@/src/api/repositories';
import { useNotification } from '@/src/context/notification-context';
import { useUser } from '@/src/entities/user/context/user-context';
import { UserDetails } from '@/src/entities/user/model/user';
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
  const { showError } = useNotification();

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


      // Step 4: Upload profile photo if provided
      let photoURL: string | undefined;
      if (photo) {
        try {
          photoURL = await userRepository.uploadProfilePhoto(userId, photo);
          
        } catch (photoError) {
          console.warn('Failed to upload profile photo:', photoError);
          // Continue without photo - it's not critical for account creation
        }
      }


      // Step 3: Prepare user data
      const userData: Partial<UserDetails> = {
        email,
        userName,
        fullName: fullName ,
        bio: bio ,
        photoURL: photoURL || "",
        birthDate: birthDate ,
      };

      
      // Step 5: Create user profile in Firestore
      const userCreated = await userRepository.createUser(userId, userData);
      
      if (!userCreated) {
        throw new Error('No se pudo crear el perfil de usuario');
      }


      
    } catch (err: any) {
      // Los errores ya vienen con mensajes apropiados desde los repositorios
      const errorMessage = err?.message || 'Error al crear la cuenta. Por favor, intenta nuevamente.';
      const errorTitle = 'Error al crear cuenta';
      
      setError(errorMessage);
      showError(errorMessage, errorTitle);
      console.error('Sign up error:', err);
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
