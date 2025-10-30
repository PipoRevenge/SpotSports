import { Sport, SportActivity, SportDetails, SportMetadata } from '@/src/entities/sport/model/sport';
import { Timestamp } from 'firebase/firestore';

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
  createdAt?: any; // Puede venir como Timestamp de Firebase
  updatedAt?: any; // Puede venir como Timestamp de Firebase
  createdBy?: string;
  
  // SportActivity (campos planos en Firebase)
  spotsCount?: number;
  usersCount?: number;
  popularity?: number;
}

/**
 * Convierte datos de Firebase a modelo de dominio Sport
 */
export const toDomain = (id: string, firebaseData: SportFirebase): Sport => {
  const details: SportDetails = {
    name: firebaseData.name,
    description: firebaseData.description || '', // Ahora es requerido
    icon: firebaseData.icon,
    image: firebaseData.image,
    category: firebaseData.category,
  };

  const metadata: SportMetadata = {
    createdAt: firebaseData.createdAt 
      ? (firebaseData.createdAt instanceof Timestamp 
          ? firebaseData.createdAt.toDate() 
          : new Date(firebaseData.createdAt))
      : new Date(), // Fallback a fecha actual si no existe
    updatedAt: firebaseData.updatedAt 
      ? (firebaseData.updatedAt instanceof Timestamp 
          ? firebaseData.updatedAt.toDate() 
          : new Date(firebaseData.updatedAt))
      : new Date(), // Fallback a fecha actual si no existe
    createdBy: firebaseData.createdBy || 'system', // Fallback a 'system' si no existe
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
};

/**
 * Convierte modelo de dominio Sport a formato Firebase
 */
export const toFirestore = (sport: Sport): SportFirebase => {
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
};

/**
 * Convierte SportDetails a formato Firebase para creación
 */
export const detailsToFirestore = (details: SportDetails, createdBy: string = 'system'): SportFirebase => {
  const now = Timestamp.now();
  
  const result: SportFirebase = {
    name: details.name,
    description: details.description, // Ahora es requerido
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy,
    spotsCount: 0,
    usersCount: 0,
    popularity: 0,
  };

  // Solo agregar campos opcionales si tienen valor
  if (details.icon && details.icon.trim()) {
    result.icon = details.icon.trim();
  }
  
  if (details.image && details.image.trim()) {
    result.image = details.image.trim();
  }
  
  if (details.category && details.category.trim()) {
    result.category = details.category.trim();
  }

  return result;
};