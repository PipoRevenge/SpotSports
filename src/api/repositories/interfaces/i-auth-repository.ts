/**
 * Session data returned by auth repository
 */
export interface AuthSessionData {
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<string>;
  register(email: string, password: string): Promise<string>;
  logout(): Promise<void>;
  checkAuth(): Promise<boolean>;
  onAuthStateChanged(callback: (userId: string | null) => void): () => void;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  
  /**
   * Get current session data including token and expiration
   */
  getSessionData(): Promise<AuthSessionData | null>;
  
  /**
   * Refresh the current user's token
   */
  refreshToken(): Promise<string | null>;
  
  /**
   * Get current authenticated user ID
   */
  getCurrentUserId(): string | null;
  
  /**
   * Wait for user document to be created in Firestore
   * @param userId - User ID to wait for
   * @param maxAttempts - Maximum number of retry attempts (default: 5)
   * @param delayMs - Delay between attempts in milliseconds (default: 500)
   * @returns true if document exists, false if timeout
   */
  waitForUserDocument(userId: string, maxAttempts?: number, delayMs?: number): Promise<boolean>;
}