import { authRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { saveAuthToken } from '@/src/features/auth/storage/token-storage';
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
  const { setIsLoading: setGlobalLoading } = useUser();

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      setIsLoading(true);
      setGlobalLoading(true);
      setError(null);

      await authRepository.login(email, password);
      const token = await authRepository.getIdToken();
      if (token) {
        await saveAuthToken(token);
      }
      
      // Navigation will be handled by the UserContext when auth state changes
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
