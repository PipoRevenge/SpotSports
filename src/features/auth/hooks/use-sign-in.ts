import { authRepository, userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { saveSession } from '@/src/features/auth/storage/token-storage';
import { useState } from 'react';

interface SignInResult {
  success: boolean;
  error?: string;
}

interface UseSignInReturn {
  signIn: (email: string, password: string) => Promise<SignInResult>;
  isLoading: boolean;
  error: string | null;
}

export const useSignIn = (): UseSignInReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsLoading: setGlobalLoading, setUser } = useUser();

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      setIsLoading(true);
      setGlobalLoading(true);
      setError(null);

      // Step 1: Authenticate with Firebase
      const userId = await authRepository.login(email, password);
      
      // Step 2: Load user data immediately and save to context
      // This ensures the user data is available right away in the app
      try {
        const userData = await userRepository.getUserById(userId);
        setUser(userData);
        console.log('User data loaded and saved to context after login');
      } catch (loadError) {
        console.warn('Could not load user data immediately after login:', loadError);
        // Continue anyway - the auth state listener will load it
      }

      // Step 3: Get session data (token + expiration + refresh token)
      const sessionData = await authRepository.getSessionData();
      
      // Step 4: Save session to secure store
      if (sessionData) {
        await saveSession(sessionData);
      } else {
        console.warn('Could not retrieve session data after login');
      }
      
      return { success: true };
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
      console.error('Sign in error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
    error,
  };
};
