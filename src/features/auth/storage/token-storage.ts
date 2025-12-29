import * as SecureStore from 'expo-secure-store';

// SecureStore keys must be alphanumeric, '.', '-', '_'
const SESSION_KEY = 'sp_session_data';

/**
 * Session data stored securely
 */
export interface SessionData {
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Save complete session data to secure store
 */
export const saveSession = async (session: SessionData): Promise<void> => {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store session securely:', error);
    throw new Error('Unable to save session');
  }
};

/**
 * Get stored session data
 */
export const getSession = async (): Promise<SessionData | null> => {
  try {
    const sessionJson = await SecureStore.getItemAsync(SESSION_KEY);
    if (!sessionJson) return null;
    
    const session = JSON.parse(sessionJson) as SessionData;
    return session;
  } catch (error) {
    console.error('Failed to read session:', error);
    return null;
  }
};

/**
 * Clear all session data
 */
export const clearSession = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

/**
 * Check if stored session is still valid (not expired)
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const session = await getSession();
    if (!session) return false;
    
    const now = Date.now();
    return session.expiresAt > now;
  } catch (error) {
    console.error('Failed to validate session:', error);
    return false;
  }
};

/**
 * Get time remaining until session expires (in milliseconds)
 */
export const getSessionTimeRemaining = async (): Promise<number> => {
  try {
    const session = await getSession();
    if (!session) return 0;
    
    const now = Date.now();
    return Math.max(0, session.expiresAt - now);
  } catch (error) {
    console.error('Failed to get session time remaining:', error);
    return 0;
  }
};

// ===== DEPRECATED - Kept for backward compatibility =====
// These will be removed in a future version

/**
 * @deprecated Use saveSession instead
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  console.warn('saveAuthToken is deprecated. Use saveSession instead.');
  try {
    await SecureStore.setItemAsync('sp_auth_token', token);
  } catch (error) {
    console.error('Failed to store auth token securely:', error);
  }
};

/**
 * @deprecated Use getSession instead
 */
export const getAuthToken = async (): Promise<string | null> => {
  console.warn('getAuthToken is deprecated. Use getSession instead.');
  try {
    return await SecureStore.getItemAsync('sp_auth_token');
  } catch (error) {
    console.error('Failed to read auth token:', error);
    return null;
  }
};

/**
 * @deprecated Use clearSession instead
 */
export const clearAuthToken = async (): Promise<void> => {
  console.warn('clearAuthToken is deprecated. Use clearSession instead.');
  try {
    await SecureStore.deleteItemAsync('sp_auth_token');
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};
