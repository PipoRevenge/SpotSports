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
          
          // Load user data from Firestore
          try {
            const userData = await userRepository.getUserById(userId);
            setUser(userData);
            
            // Navigate to main app after successful authentication and data load
            router.replace('/home-tabs/my-feed');
          } catch (userError) {
            console.error('Error loading user data:', userError);
            // If user data doesn't exist, navigate to auth to complete registration
            setUser(null);
            router.replace('/auth/authentication');
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