import { User, UserDetails } from '@/src/entities/user/model/user';

export interface IUserRepository {
  createUser(userId: string, userData: Partial<UserDetails>): Promise<boolean>;
  getUserById(userId: string): Promise<User>;
  updateUserProfile(userId: string, userData: Partial<User>): Promise<User>;
  uploadProfilePhoto(userId: string, photoUri: string): Promise<string>;
  getUserFavoriteSpots(userId: string): Promise<string[]>;
  addFavoriteSpot(userId: string, spotId: string): Promise<void>;
  removeFavoriteSpot(userId: string, spotId: string): Promise<void>;
  getUserFavoriteSports(userId: string): Promise<string[]>;
  addFavoriteSport(userId: string, sportId: string): Promise<void>;
  removeFavoriteSport(userId: string, sportId: string): Promise<void>;
  checkUserNameExists(userName: string, excludeUserId?: string): Promise<boolean>;
}