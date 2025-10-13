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
  // Puede venir como Timestamp de Firebase, Date, número (ms) o string
  birthDate?: any;
  phoneNumber?: string;

  // Metadata (campos planos en Firebase)
  // Pueden venir como Timestamp de Firebase u otros formatos
  createdAt?: any;
  updatedAt?: any;
  isVerified: boolean;

  // Activity (campos planos en Firebase)
  reviewsCount?: number;
  commentsCount?: number;
  favoriteSpotsCount?: number;
  followersCount?: number;
  followingCount?: number;
  
  // Arrays complejos se almacenan como subcolecciones en Firebase,
  // no como campos directos del documento principal
  // reviews?: Review[]; // Se maneja en subcolección
  // comments?: CommentReview[]; // Se maneja en subcolección
}

/**
 * Mapper para convertir datos entre el modelo de la aplicación (User) 
 * y el modelo de Firebase (UserFirebase)
 */
export class UserMapper {
  
  /**
   * Convierte un modelo User de la aplicación a UserFirebase para almacenar en Firebase
   * @param user - Usuario en formato de la aplicación
   * @param userId - ID del usuario (se usa como document ID en Firebase)
   * @returns UserFirebase - Usuario en formato Firebase
   */
  static toFirebase(user: User, userId?: string): UserFirebase {
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

      // UserActivity -> campos planos (arrays simples)
      reviewsCount: user.activity.reviewsCount,
      commentsCount: user.activity.commentsCount,
      favoriteSpotsCount: user.activity.favoriteSpotsCount,
      followersCount: user.activity.followersCount,
      followingCount: user.activity.followingCount,

    };
  }

  /**
   * Convierte un modelo UserFirebase a User de la aplicación
   * @param firebaseUser - Usuario en formato Firebase
   * @param userId - ID del usuario
   * @returns User - Usuario en formato de la aplicación
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
   * Convierte datos parciales de UserDetails para crear un nuevo usuario en Firebase
   * @param userData - Datos parciales del usuario
   * @returns UserFirebase - Usuario completo para Firebase con valores por defecto
   */
  static createUserToFirebase(userData: Partial<UserDetails>): UserFirebase {
    const now = new Date();
    
    return {
      // UserDetails con valores por defecto
      email: userData.email || "",
      userName: userData.userName || "",
      photoURL: userData.photoURL || "",
      fullName: userData.fullName || "",
      bio: userData.bio || "",
      birthDate: userData.birthDate ? (userData.birthDate instanceof Date ? userData.birthDate : parseTimestamp(userData.birthDate)) : now,
      phoneNumber: userData.phoneNumber || "",

      // Metadata inicial
      createdAt: now,
      updatedAt: now,
      isVerified: false,

      // Activity inicial
      reviewsCount: 0,
      commentsCount: 0,
      favoriteSpotsCount: 0,
      followersCount: 0,
      followingCount: 0,
    };
  }

  /**
   * Convierte datos de actualización parciales a formato Firebase
   * @param userData - Datos parciales para actualizar
   * @returns Partial<UserFirebase> - Datos en formato Firebase para actualización
   */
  static updateDataToFirebase(userData: Partial<User>): Partial<UserFirebase> {
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

    // Siempre actualizar updatedAt
    firebaseUpdate.updatedAt = new Date();

    return firebaseUpdate;
  }

  /**
   * Valida que los datos requeridos estén presentes para crear un usuario
   * @param userData - Datos del usuario a validar
   * @returns boolean - true si los datos son válidos
   */
  static validateUserData(userData: Partial<UserDetails>): boolean {
    return !!(userData.email && userData.userName);
  }

  /**
   * Obtiene los campos que deben actualizarse en Firebase cuando se actualiza el perfil
   * @param currentUser - Usuario actual
   * @param updates - Actualizaciones a aplicar
   * @returns Partial<UserFirebase> - Solo los campos que han cambiado
   */
  static getChangedFields(currentUser: User, updates: Partial<User>): Partial<UserFirebase> {
    const changes: Partial<UserFirebase> = {};

    // Comparar userDetails
    if (updates.userDetails) {
      const current = currentUser.userDetails;
      const updated = updates.userDetails;

      if (updated.email && updated.email !== current.email) {
        changes.email = updated.email;
      }
      if (updated.userName && updated.userName !== current.userName) {
        changes.userName = updated.userName;
      }
      if (updated.photoURL !== current.photoURL) {
        changes.photoURL = updated.photoURL;
      }
      if (updated.fullName !== current.fullName) {
        changes.fullName = updated.fullName;
      }
      if (updated.bio !== current.bio) {
        changes.bio = updated.bio;
      }
      if (updated.birthDate !== current.birthDate) {
        changes.birthDate = updated.birthDate;
      }
      if (updated.phoneNumber !== current.phoneNumber) {
        changes.phoneNumber = updated.phoneNumber;
      }
    }

    // Siempre actualizar updatedAt si hay cambios
    if (Object.keys(changes).length > 0) {
      changes.updatedAt = new Date();
    }

    return changes;
  }
}

/**
 * Convierte varios formatos de timestamp a Date
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
      // fallthrough
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