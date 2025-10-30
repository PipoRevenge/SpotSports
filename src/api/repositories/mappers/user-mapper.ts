import { User, UserActivity, UserDetails, UserMetadata } from '@/src/entities/user/model/user';

/**
 * Interface que representa el modelo de usuario tal como se almacena en Firebase
 */
export interface UserFirebase {
  // User Details (campos planos en Firebase)
  email: string;
  userName: string;
  photoURL?: string;
  fullName?: string;
  bio?: string;
  birthDate?: any; // Timestamp de Firebase, Date, número (ms) o string
  phoneNumber?: string;

  // Metadata (campos planos en Firebase)
  createdAt?: any; // Timestamp de Firebase u otros formatos
  updatedAt?: any; // Timestamp de Firebase u otros formatos
  isVerified: boolean;

  // Activity (campos planos en Firebase)
  reviewsCount?: number;
  commentsCount?: number;
  favoriteSpotsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

/**
 * Mapper para convertir datos entre el modelo de la aplicación (User) 
 * y el modelo de Firebase (UserFirebase)
 * 
 * Responsabilidad: SOLO transformación de datos
 * - De Firebase a Modelo de dominio
 * - De Modelo de dominio a Firebase
 */
export class UserMapper {
  
  /**
   * Convierte datos de Firebase a modelo de dominio User
   * @param firebaseUser - Usuario en formato Firebase
   * @param userId - ID del usuario
   * @returns User - Usuario en formato de dominio
   */
  static fromFirebase(firebaseUser: UserFirebase, userId: string): User {
    const userDetails: UserDetails = {
      email: firebaseUser.email,
      userName: firebaseUser.userName,
      photoURL: firebaseUser.photoURL,
      fullName: firebaseUser.fullName,
      bio: firebaseUser.bio,
      birthDate: parseTimestamp(firebaseUser.birthDate) || new Date(),
      phoneNumber: firebaseUser.phoneNumber,
    };

    const metadata: UserMetadata = {
      createdAt: parseTimestamp(firebaseUser.createdAt) || new Date(),
      updatedAt: parseTimestamp(firebaseUser.updatedAt) || new Date(),
      isVerified: firebaseUser.isVerified || false,
    };

    const activity: UserActivity = {
      reviewsCount: firebaseUser.reviewsCount || 0,
      commentsCount: firebaseUser.commentsCount || 0,
      favoriteSpotsCount: firebaseUser.favoriteSpotsCount || 0,
      followersCount: firebaseUser.followersCount || 0,
      followingCount: firebaseUser.followingCount || 0,
    };

    return {
      id: userId,
      userDetails,
      metadata,
      activity,
    };
  }

  /**
   * Convierte modelo de dominio User a formato Firebase
   * @param user - Usuario en formato de dominio
   * @returns UserFirebase - Usuario en formato Firebase
   */
  static toFirebase(user: User): UserFirebase {
    return {
      // UserDetails -> campos planos
      email: user.userDetails.email,
      userName: user.userDetails.userName,
      photoURL: user.userDetails.photoURL,
      fullName: user.userDetails.fullName,
      bio: user.userDetails.bio,
      birthDate: user.userDetails.birthDate,
      phoneNumber: user.userDetails.phoneNumber,

      // UserMetadata -> campos planos
      createdAt: user.metadata.createdAt,
      updatedAt: user.metadata.updatedAt,
      isVerified: user.metadata.isVerified,

      // UserActivity -> campos planos
      reviewsCount: user.activity.reviewsCount,
      commentsCount: user.activity.commentsCount,
      favoriteSpotsCount: user.activity.favoriteSpotsCount,
      followersCount: user.activity.followersCount,
      followingCount: user.activity.followingCount,
    };
  }

  /**
   * Convierte datos parciales de User a formato Firebase (para actualizaciones)
   * @param userData - Datos parciales para actualizar
   * @returns Partial<UserFirebase> - Datos en formato Firebase
   */
  static partialToFirebase(userData: Partial<User>): Partial<UserFirebase> {
    const firebaseUpdate: Partial<UserFirebase> = {};

    // Mapear UserDetails si existe
    if (userData.userDetails) {
      const details = userData.userDetails;
      if (details.email !== undefined) firebaseUpdate.email = details.email;
      if (details.userName !== undefined) firebaseUpdate.userName = details.userName;
      if (details.photoURL !== undefined) firebaseUpdate.photoURL = details.photoURL;
      if (details.fullName !== undefined) firebaseUpdate.fullName = details.fullName;
      if (details.bio !== undefined) firebaseUpdate.bio = details.bio;
      if (details.birthDate !== undefined) firebaseUpdate.birthDate = details.birthDate;
      if (details.phoneNumber !== undefined) firebaseUpdate.phoneNumber = details.phoneNumber;
    }

    // Mapear metadata si existe
    if (userData.metadata) {
      if (userData.metadata.createdAt !== undefined) {
        firebaseUpdate.createdAt = userData.metadata.createdAt;
      }
      if (userData.metadata.updatedAt !== undefined) {
        firebaseUpdate.updatedAt = userData.metadata.updatedAt;
      }
      if (userData.metadata.isVerified !== undefined) {
        firebaseUpdate.isVerified = userData.metadata.isVerified;
      }
    }

    // Mapear activity si existe
    if (userData.activity) {
      const activity = userData.activity;
      if (activity.reviewsCount !== undefined) {
        firebaseUpdate.reviewsCount = activity.reviewsCount;
      }
      if (activity.commentsCount !== undefined) {
        firebaseUpdate.commentsCount = activity.commentsCount;
      }
      if (activity.favoriteSpotsCount !== undefined) {
        firebaseUpdate.favoriteSpotsCount = activity.favoriteSpotsCount;
      }
      if (activity.followersCount !== undefined) {
        firebaseUpdate.followersCount = activity.followersCount;
      }
      if (activity.followingCount !== undefined) {
        firebaseUpdate.followingCount = activity.followingCount;
      }
    }

    return firebaseUpdate;
  }
}

/**
 * Convierte varios formatos de timestamp a Date
 * Soporta: Date, number (ms), string, Firestore Timestamp, objeto {seconds, nanoseconds}
 */
function parseTimestamp(value: any): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  // Firestore Timestamp has toDate()
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return undefined;
    }
  }
  // Raw object like { seconds, nanos } or { seconds, nanoseconds }
  if (typeof value === 'object' && (value.seconds !== undefined || value.nanoseconds !== undefined || value.nanos !== undefined)) {
    const secs = Number(value.seconds || 0);
    const nanos = Number(value.nanoseconds ?? value.nanos ?? 0);
    return new Date(secs * 1000 + Math.floor(nanos / 1e6));
  }
  return undefined;
}