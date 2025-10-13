import { authRepository } from '@/src/api/repositories';
import { useUser } from '@/src/entities/user/context/user-context';
import { router } from 'expo-router';
import { useState } from 'react';

export const useSignOut = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { setUser, setIsLoading } = useUser();

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setIsLoading(true);
      
      await authRepository.logout();
      
      // Clear user data
      setUser(null);
      
      // Navigate to authentication screen
      router.replace('/auth/authentication');
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, we should still navigate to auth
      setUser(null);
      router.replace('/auth/authentication');
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
