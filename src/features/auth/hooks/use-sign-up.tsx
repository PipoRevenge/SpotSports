import { authRepository, userRepository } from '@/src/api';
import { useUser } from '@/src/context/user-context';
import { UserDetails } from '@/src/types/user';
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
  const { setIsLoading: setGlobalLoading } = useUser();

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
        throw new Error('Username is already taken. Please choose a different one.');
      }

      // Step 2: Register user with Firebase Auth
      const userId = await authRepository.register(email, password);

      // Step 3: Prepare user data
      const userData: Partial<UserDetails> = {
        email,
        userName,
        fullName: fullName || undefined,
        bio: bio || undefined,
        birthDate: birthDate?.toISOString(),
      };

      // Step 4: Upload profile photo if provided
      let photoURL: string | undefined;
      if (photo) {
        try {
          photoURL = await userRepository.uploadProfilePhoto(userId, photo);
          userData.photoURL = photoURL;
        } catch (photoError) {
          console.warn('Failed to upload profile photo:', photoError);
          // Continue without photo - it's not critical for account creation
        }
      }

      // Step 5: Create user profile in Firestore
      const userCreated = await userRepository.createUser(userId, userData);
      
      if (!userCreated) {
        throw new Error('Failed to create user profile');
      }

      // Navigation will be handled by the UserContext when auth state changes
      
    } catch (err: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      // Provide more specific error messages based on Firebase error codes
      if (err?.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already registered.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
