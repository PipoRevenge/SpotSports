import { User, UserActivity, UserDetails, UserMetadata } from '@/src/types/user';

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
  birthDate?: string;
  phoneNumber?: string;

  // Metadata (campos planos en Firebase)
  createdAt: Date;
  updatedAt: Date;

  // Verification status
  isVerified: boolean;

  // Activity (campos planos en Firebase)
  favoriteSports?: string[];
  favoriteSpots?: string[];
  reviewsCount?: number;
  commentsCount?: number;
  
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

      // Verification status
      isVerified: user.isVerified,

      // UserActivity -> campos planos (arrays simples)
      favoriteSports: user.activity?.favoriteSports || [],
      favoriteSpots: user.activity?.favoriteSpots || [],
      reviewsCount: user.activity?.reviewsCount || 0,
      commentsCount: user.activity?.commentsCount || 0,
      
      // Note: reviews y comments se manejan como subcolecciones separadas
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
      birthDate: firebaseUser.birthDate,
      phoneNumber: firebaseUser.phoneNumber,
    };

    const metadata: UserMetadata = {
      createdAt: firebaseUser.createdAt,
      updatedAt: firebaseUser.updatedAt,
    };

    const activity: UserActivity = {
      favoriteSports: firebaseUser.favoriteSports || [],
      favoriteSpots: firebaseUser.favoriteSpots || [],
      reviewsCount: firebaseUser.reviewsCount || 0,
      commentsCount: firebaseUser.commentsCount || 0,
      reviews: [], // Se cargan por separado desde subcolección
      comments: [], // Se cargan por separado desde subcolección
    };

    return {
      id: userId,
      userDetails,
      metadata,
      isVerified: firebaseUser.isVerified,
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
      birthDate: userData.birthDate || "",
      phoneNumber: userData.phoneNumber || "",

      // Metadata inicial
      createdAt: now,
      updatedAt: now,

      // Estado inicial
      isVerified: false,

      // Activity inicial
      favoriteSports: [],
      favoriteSpots: [],
      reviewsCount: 0,
      commentsCount: 0,
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
    }

    // Mapear verification status
    if (userData.isVerified !== undefined) {
      firebaseUpdate.isVerified = userData.isVerified;
    }

    // Mapear activity si existe
    if (userData.activity) {
      const activity = userData.activity;
      if (activity.favoriteSports !== undefined) {
        firebaseUpdate.favoriteSports = activity.favoriteSports;
      }
      if (activity.favoriteSpots !== undefined) {
        firebaseUpdate.favoriteSpots = activity.favoriteSpots;
      }
      if (activity.reviewsCount !== undefined) {
        firebaseUpdate.reviewsCount = activity.reviewsCount;
      }
      if (activity.commentsCount !== undefined) {
        firebaseUpdate.commentsCount = activity.commentsCount;
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