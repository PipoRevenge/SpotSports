import { SavedSpot, SpotCategory } from '@/src/entities/user/model/spot-collection';
import { User, UserDetails } from '@/src/entities/user/model/user';

/**
 * Interfaz del repositorio de usuarios
 * 
 * Estructura de datos en Firestore:
 * - users/{userId} - Documento principal del usuario
 * - users/{userId}/followers/{followerId} - Subcollection de seguidores
 * - users/{userId}/following/{followedId} - Subcollection de seguidos
 * - users/{userId}/saved_spots/{savedSpotId} - Subcollection de spots guardados
 * - users/{userId}/favoriteSports/{sportId} - Subcollection de deportes favoritos
 */
export interface IUserRepository {
  createUser(userId: string, userData: Partial<UserDetails>): Promise<boolean>;
  getUserById(userId: string): Promise<User>;
  updateUserProfile(userId: string, userData: Partial<User>): Promise<User>;
  uploadProfilePhoto(userId: string, photoUri: string): Promise<string>;
  
  // Métodos de saved_spots (subcolección)
  getUserSavedSpots(userId: string, category?: SpotCategory): Promise<SavedSpot[]>;
  addSpotToCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void>;
  removeSpotFromCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void>;
  getSpotCategories(userId: string, spotId: string): Promise<SpotCategory[]>;
  updateSpotCategories(userId: string, spotId: string, categories: SpotCategory[]): Promise<void>;
  
  // Métodos de deportes favoritos (subcolección favoriteSports)
  getUserFavoriteSports(userId: string): Promise<string[]>;
  addFavoriteSport(userId: string, sportId: string): Promise<void>;
  removeFavoriteSport(userId: string, sportId: string): Promise<void>;

  /**
   * Relationship methods
   * 
   * Estructura:
   * - users/{userId}/followers/{followerId} con { createdAt: timestamp }
   * - users/{userId}/following/{followedId} con { createdAt: timestamp }
   */
  followUser(userId: string, targetUserId: string): Promise<void>;
  unfollowUser(userId: string, targetUserId: string): Promise<void>;
  isFollowing(followerId: string, followedId: string): Promise<boolean>;
  getFollowers(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }>;
  getFollowing(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }>;
  
  checkUserNameExists(userName: string, excludeUserId?: string): Promise<boolean>;
  getUserByUserName(userName: string): Promise<User | null>;
  getAllUsers(options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }>;
}