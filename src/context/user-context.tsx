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
  subscribeToFollowEvents?: (listener: (payload: { targetUserId: string; followerId: string; isFollowing: boolean; }) => void) => () => void;
  emitFollowEvent?: (payload: { targetUserId: string; followerId: string; isFollowing: boolean; }) => void;
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

  const followListenersRef = React.useRef(new Set<(payload: { targetUserId: string; followerId: string; isFollowing: boolean; }) => void>());

  const subscribeToFollowEvents = (listener: (payload: { targetUserId: string; followerId: string; isFollowing: boolean; }) => void) => {
    followListenersRef.current.add(listener);
    return () => followListenersRef.current.delete(listener);
  };

  const emitFollowEvent = (payload: { targetUserId: string; followerId: string; isFollowing: boolean; }) => {
    // Update current user counters if needed
    setUser(prev => {
      if (!prev) return prev;
      if (prev.id === payload.followerId) {
        const updatedFollowing = Math.max(0, prev.activity.followingCount + (payload.isFollowing ? 1 : -1));
        return {
          ...prev,
          activity: {
            ...prev.activity,
            followingCount: updatedFollowing
          }
        } as User;
      }
      return prev;
    });

    // Notify all listeners
    followListenersRef.current.forEach((fn) => {
      try { fn(payload); } catch (e) { console.warn('Follow listener threw', e); }
    });
  };

  const value = {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isAuthenticated,
    subscribeToFollowEvents,
    emitFollowEvent
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