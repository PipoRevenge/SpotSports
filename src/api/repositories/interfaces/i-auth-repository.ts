export interface IAuthRepository {
  login(email: string, password: string): Promise<string>;
  register(email: string, password: string): Promise<string>;
  logout(): Promise<void>;
  checkAuth(): Promise<boolean>;
  onAuthStateChanged(callback: (userId: string | null) => void): () => void;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
}