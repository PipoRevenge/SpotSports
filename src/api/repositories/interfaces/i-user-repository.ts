import { SavedSpot, SpotCategory } from '@/src/entities/user/model/spot-collection';
import { User, UserDetails } from '@/src/entities/user/model/user';

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
  
  // Métodos de deportes favoritos (mantener como array)
  getUserFavoriteSports(userId: string): Promise<string[]>;
  addFavoriteSport(userId: string, sportId: string): Promise<void>;
  removeFavoriteSport(userId: string, sportId: string): Promise<void>;
  
  checkUserNameExists(userName: string, excludeUserId?: string): Promise<boolean>;
}