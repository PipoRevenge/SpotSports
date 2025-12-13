import { authRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { clearAuthToken } from '@/src/features/auth/storage/token-storage';
import { useState } from 'react';

export const useSignOut = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { setUser, setIsLoading } = useUser();

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setIsLoading(true);
      
      await authRepository.logout();
      await clearAuthToken();
      
      // Clear user data
      setUser(null);
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, we clear the user locally.
      setUser(null);
      // DO NOT navigate here. Navigation should be handled by the app layer.
    } finally {
      setIsSigningOut(false);
      setIsLoading(false);
    }
  };

  return {
    signOut,
    isSigningOut,
  };
};
