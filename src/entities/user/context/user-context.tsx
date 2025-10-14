import { authRepository, userRepository } from '@/src/api/repositories';
import { User } from '@/src/entities/user/model/user';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = authRepository.onAuthStateChanged(async (userId) => {
      try {
        if (userId) {
          setIsAuthenticated(true);
          
          // Load user data from Firestore with retry logic
          let userData = null;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts && !userData) {
            try {
              attempts++;
              userData = await userRepository.getUserById(userId);
              
              if (userData) {
                setUser(userData);
                // Navigate to main app after successful authentication and data load
                router.replace('/home-tabs/my-feed');
                break;
              }
            } catch (userError) {
             
              
              if (attempts < maxAttempts) {
                // Wait 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                // If all attempts failed, navigate to auth to complete registration
                console.error("Failed" , userError);
                setUser(null);
                router.replace('/auth/authentication');
              }
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          router.replace('/auth/authentication');
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setIsAuthenticated(false);
        setUser(null);
        router.replace('/auth/authentication');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isAuthenticated,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};