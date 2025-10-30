import { Sport, SportActivity, SportDetails, SportMetadata } from '@/src/entities/sport/model/sport';

/**
 * Interface que representa el modelo de sport tal como se almacena en Firebase
 */
export interface SportFirebase {
  // SportDetails (campos planos en Firebase)
  name: string;
  description: string;
  icon?: string;
  image?: string;
  category?: string;
  
  // SportMetadata (campos planos en Firebase)
  createdAt?: any; // Timestamp de Firebase u otros formatos
  updatedAt?: any; // Timestamp de Firebase u otros formatos
  createdBy?: string;
  
  // SportActivity (campos planos en Firebase)
  spotsCount?: number;
  usersCount?: number;
  popularity?: number;
}

/**
 * Mapper para convertir datos entre el modelo de la aplicación (Sport) 
 * y el modelo de Firebase (SportFirebase)
 * 
 * Responsabilidad: SOLO transformación de datos
 * - De Firebase a Modelo de dominio
 * - De Modelo de dominio a Firebase
 */
export class SportMapper {
  
  /**
   * Convierte datos de Firebase a modelo de dominio Sport
   * @param id - ID del deporte
   * @param firebaseData - Datos en formato Firebase
   * @returns Sport - Deporte en formato de dominio
   */
  static fromFirebase(id: string, firebaseData: SportFirebase): Sport {
    const details: SportDetails = {
      name: firebaseData.name,
      description: firebaseData.description || '',
      icon: firebaseData.icon,
      image: firebaseData.image,
      category: firebaseData.category,
    };

    const metadata: SportMetadata = {
      createdAt: parseTimestamp(firebaseData.createdAt) || new Date(),
      updatedAt: parseTimestamp(firebaseData.updatedAt) || new Date(),
      createdBy: firebaseData.createdBy || 'system',
    };

    const activity: SportActivity = {
      spotsCount: firebaseData.spotsCount || 0,
      usersCount: firebaseData.usersCount || 0,
      popularity: firebaseData.popularity || 0,
    };

    return {
      id,
      details,
      metadata,
      activity,
    };
  }

  /**
   * Convierte modelo de dominio Sport a formato Firebase
   * @param sport - Deporte en formato de dominio
   * @returns SportFirebase - Deporte en formato Firebase
   */
  static toFirebase(sport: Sport): SportFirebase {
    return {
      name: sport.details.name,
      description: sport.details.description,
      icon: sport.details.icon,
      image: sport.details.image,
      category: sport.details.category,
      createdAt: sport.metadata.createdAt,
      updatedAt: sport.metadata.updatedAt,
      createdBy: sport.metadata.createdBy,
      spotsCount: sport.activity?.spotsCount || 0,
      usersCount: sport.activity?.usersCount || 0,
      popularity: sport.activity?.popularity || 0,
    };
  }

  /**
   * Convierte datos parciales de Sport a formato Firebase (para actualizaciones)
   * @param sportData - Datos parciales para actualizar
   * @returns Partial<SportFirebase> - Datos en formato Firebase
   */
  static partialToFirebase(sportData: Partial<Sport>): Partial<SportFirebase> {
    const firebaseUpdate: Partial<SportFirebase> = {};

    // Mapear SportDetails si existe
    if (sportData.details) {
      const details = sportData.details;
      if (details.name !== undefined) firebaseUpdate.name = details.name;
      if (details.description !== undefined) firebaseUpdate.description = details.description;
      if (details.icon !== undefined) firebaseUpdate.icon = details.icon;
      if (details.image !== undefined) firebaseUpdate.image = details.image;
      if (details.category !== undefined) firebaseUpdate.category = details.category;
    }

    // Mapear metadata si existe
    if (sportData.metadata) {
      if (sportData.metadata.createdAt !== undefined) {
        firebaseUpdate.createdAt = sportData.metadata.createdAt;
      }
      if (sportData.metadata.updatedAt !== undefined) {
        firebaseUpdate.updatedAt = sportData.metadata.updatedAt;
      }
      if (sportData.metadata.createdBy !== undefined) {
        firebaseUpdate.createdBy = sportData.metadata.createdBy;
      }
    }

    // Mapear activity si existe
    if (sportData.activity) {
      const activity = sportData.activity;
      if (activity.spotsCount !== undefined) {
        firebaseUpdate.spotsCount = activity.spotsCount;
      }
      if (activity.usersCount !== undefined) {
        firebaseUpdate.usersCount = activity.usersCount;
      }
      if (activity.popularity !== undefined) {
        firebaseUpdate.popularity = activity.popularity;
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