import { authRepository, userRepository } from "@/src/api/repositories";
import { User } from "@/src/entities/user/model/user";
import {
  clearSession,
  getSession,
  getSessionTimeRemaining,
} from "@/src/features/auth/storage/token-storage";
import { resyncAllMeetupNotifications } from "@/src/features/notification/hooks/use-local-meetup-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isAuthenticated: boolean;
  subscribeToFollowEvents?: (
    listener: (payload: {
      targetUserId: string;
      followerId: string;
      isFollowing: boolean;
    }) => void
  ) => () => void;
  emitFollowEvent?: (payload: {
    targetUserId: string;
    followerId: string;
    isFollowing: boolean;
  }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await getSession();

        if (session) {
          const timeRemaining = await getSessionTimeRemaining();

          // If token expires in less than 5 minutes, refresh it
          if (timeRemaining < 5 * 60 * 1000 && timeRemaining > 0) {
            console.log("Token expiring soon, refreshing...");
            await authRepository.refreshToken();
          }

          // Session exists and is valid, try to load user
          if (timeRemaining > 0) {
            try {
              const userData = await userRepository.getUserById(session.userId);
              setUser(userData);
              setIsAuthenticated(true);
            } catch (error) {
              console.error("Failed to load user data from session:", error);
              // Clear invalid session
              await clearSession();
              setIsAuthenticated(false);
            }
          } else {
            // Session expired
            console.log("Session expired, clearing...");
            await clearSession();
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = authRepository.onAuthStateChanged(async (userId) => {
      try {
        if (userId) {
          setIsAuthenticated(true);

          // Wait for user document to be available (handles registration race condition)
          const documentExists = await authRepository.waitForUserDocument(
            userId,
            10,
            1000
          );

          if (!documentExists) {
            console.warn(
              "User document not found after waiting (possible cold start timeout)"
            );
            // Don't clear session here - might be a temporary issue
            // Let session monitor handle it if session is truly invalid
            setIsLoading(false);
            return;
          }

          // Load user data from Firestore
          try {
            const userData = await userRepository.getUserById(userId);
            setUser(userData);

            // Resync local meetup notifications on app startup
            resyncAllMeetupNotifications(userId).catch((e) =>
              console.debug("[UserContext] Failed to resync meetup notifications", e)
            );
          } catch (userError) {
            console.error("Failed loading userData", userError);
            // Don't clear session immediately - might be temporary network issue
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          await clearSession();
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        // Don't clear session on every error - let session monitor handle it
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const followListenersRef = React.useRef(
    new Set<
      (payload: {
        targetUserId: string;
        followerId: string;
        isFollowing: boolean;
      }) => void
    >()
  );

  const subscribeToFollowEvents = (
    listener: (payload: {
      targetUserId: string;
      followerId: string;
      isFollowing: boolean;
    }) => void
  ) => {
    followListenersRef.current.add(listener);
    return () => followListenersRef.current.delete(listener);
  };

  const emitFollowEvent = (payload: {
    targetUserId: string;
    followerId: string;
    isFollowing: boolean;
  }) => {
    // Update current user counters if needed
    setUser((prev) => {
      if (!prev) return prev;
      if (prev.id === payload.followerId) {
        const updatedFollowing = Math.max(
          0,
          prev.activity.followingCount + (payload.isFollowing ? 1 : -1)
        );
        return {
          ...prev,
          activity: {
            ...prev.activity,
            followingCount: updatedFollowing,
          },
        } as User;
      }
      return prev;
    });

    // Notify all listeners
    followListenersRef.current.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.warn("Follow listener threw", e);
      }
    });
  };

  const value = {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isAuthenticated,
    subscribeToFollowEvents,
    emitFollowEvent,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
