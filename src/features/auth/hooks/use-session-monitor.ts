import { authRepository } from '@/src/api/repositories';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { clearSession, getSession, getSessionTimeRemaining, saveSession } from '../storage/token-storage';

/**
 * Hook to monitor session validity and handle token refresh
 * - Validates session on app resume/focus
 * - Refreshes token when near expiration (< 5 minutes)
 * - Clears invalid sessions and logs out
 */
export const useSessionMonitor = () => {
  const { setUser, isAuthenticated } = useUser();
  const { showError } = useAppAlert();
  const appState = useRef(AppState.currentState);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Handle invalid or expired session
   */
  const handleInvalidSession = useCallback(async (showAlert: boolean = true) => {
    try {
      await authRepository.logout();
      await clearSession();
      setUser(null);
      
      // Only show alert if explicitly requested (when session actually expired)
      if (showAlert) {
        showError('Your session has expired. Please sign in again.', 'Session Expired');
      }
    } catch (error) {
      console.error('Error handling invalid session:', error);
    }
  }, [setUser, showError]);

  /**
   * Check session validity and refresh if needed
   */
  const checkAndRefreshSession = useCallback(async () => {
    try {
      if (!isAuthenticated) return;

      const session = await getSession();
      
      if (!session) {
        // No session found but useUser thinks we are authenticated.
        // This might be due to a race condition or lost storage.
        // Try to recover by saving the current session data if auth.currentUser exists.
        console.log('No session found during check. Attempting to recover session...');
        
        try {
          const sessionData = await authRepository.getSessionData();
          if (sessionData) {
              await saveSession(sessionData);
              console.log('Session recovered and saved successfully.');
              return; // Recovery successful, stop here for this check
          }
        } catch (recoverError) {
             console.error('Failed to recover session:', recoverError);
        }

        console.log('Could not recover session. Proceeding with logout.');
        return;
      }

      const timeRemaining = await getSessionTimeRemaining();
      const FIVE_MINUTES = 5 * 60 * 1000;

      // Session expired - show alert
      if (timeRemaining <= 0) {
        console.log('Session expired, logging out');
        await handleInvalidSession(true); // Show alert for expired session
        return;
      }

      // Token expires in less than 5 minutes, refresh it
      if (timeRemaining < FIVE_MINUTES) {
        console.log(`Token expiring in ${Math.floor(timeRemaining / 1000)}s, refreshing...`);
        
        try {
          const newToken = await authRepository.refreshToken();
          
          if (newToken) {
            // Get updated session data and save
            const sessionData = await authRepository.getSessionData();
            if (sessionData) {
              await saveSession(sessionData);
              console.log('Token refreshed successfully');
            }
          } else {
            console.error('Failed to refresh token');
            await handleInvalidSession(true); // Show alert for refresh failure
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          await handleInvalidSession(true); // Show alert for error
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }, [isAuthenticated, handleInvalidSession]);

  /**
   * Handle app state changes (foreground/background)
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    // App became active (foreground)
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App resumed, checking session...');
      await checkAndRefreshSession();
    }

    appState.current = nextAppState;
  }, [checkAndRefreshSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Wait a bit before first check to allow session to be saved after registration
    const initialCheckTimeout = setTimeout(() => {
      checkAndRefreshSession();
    }, 1000); // Wait 1 second

    // Set up periodic session check (every 2 minutes)
    refreshIntervalRef.current = setInterval(() => {
      checkAndRefreshSession();
    }, 2 * 60 * 1000);

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      clearTimeout(initialCheckTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      subscription.remove();
    };
  }, [isAuthenticated, checkAndRefreshSession, handleAppStateChange]);

  return {
    checkAndRefreshSession,
  };
};

