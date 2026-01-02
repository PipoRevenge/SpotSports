import { Spot, SpotActivity, SpotDetails, SpotMetadata } from "@/src/entities/spot/model/spot";
import { GeoPoint as FirebaseGeoPoint } from "firebase/firestore";
import { parseLocation, parseTimestamp } from '../utils/firebase-parsers';

/**
 * Interface que representa el modelo de spot tal como se almacena en Firebase
 * Actualizado según firebase_structure_review_restructure.txt
 */
export interface SpotFirebase {
  // SpotDetails (campos planos en Firebase)
  name: string;
  description: string;
  availableSports: string[];
  // gallery - Lista de URLs de imágenes/videos en Storage
  gallery: string[];
  // GeoPoint de Firebase o objeto plano {lat, lng}
  location: FirebaseGeoPoint | { lat: number; lng: number } | { latitude: number; longitude: number };
  geohash: string;
  overallRating: number;
  
  // ContactInfo (campos separados en Firebase)
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;

  // SpotMetadata (campos planos en Firebase)
  isVerified: boolean;
  isActive: boolean;
  createdAt?: any; // Timestamp de Firebase u otros formatos
  updatedAt?: any; // Timestamp de Firebase u otros formatos
  createdBy: string; // ID del usuario como string

  // SpotActivity (campos planos en Firebase)
  reviewsCount: number;
  visitsCount: number;
  favoritesCount?: number;
  visitedCount?: number;
  wantToVisitCount?: number;
  discussionsCount?: number;
}

/**
 * Mapper para convertir datos entre el modelo de la aplicación (Spot) 
 * y el modelo de Firebase (SpotFirebase)
 * 
 * Responsabilidad: SOLO transformación de datos
 * - De Firebase a Modelo de dominio
 * - De Modelo de dominio a Firebase
 */
export class SpotMapper {
  
  /**
   * Convierte datos de Firebase a modelo de dominio Spot
   * @param id - ID del spot
   * @param firebaseData - Datos en formato Firebase
   * @returns Spot - Spot en formato de dominio
   */
  static fromFirebase(id: string, firebaseData: SpotFirebase): Spot {
    const details: SpotDetails = {
      name: firebaseData.name || '',
      description: firebaseData.description || '',
      availableSports: firebaseData.availableSports || [],
      media: firebaseData.gallery || [], // gallery → media
      location: parseLocation(firebaseData.location),
      overallRating: firebaseData.overallRating || 0,
      contactInfo: {
        phone: firebaseData.contactPhone || "",
        email: firebaseData.contactEmail || "",
        website: firebaseData.contactWebsite || "",
      }
    };

    const metadata: SpotMetadata = {
      isVerified: firebaseData.isVerified || false,
      isActive: firebaseData.isActive !== false,
      createdAt: parseTimestamp(firebaseData.createdAt) || new Date(),
      updatedAt: parseTimestamp(firebaseData.updatedAt) || new Date(),
      createdBy: firebaseData.createdBy || "",
    };

    const activity: SpotActivity = {
      reviewsCount: firebaseData.reviewsCount || 0,
      visitsCount: firebaseData.visitsCount || 0,
      favoritesCount: firebaseData.favoritesCount || 0,
      visitedCount: firebaseData.visitedCount || 0,
      wantToVisitCount: firebaseData.wantToVisitCount || 0,
      discussionsCount: firebaseData.discussionsCount || 0,
    };

    return {
      id,
      details,
      metadata,
      activity,
    };
  }

  /**
   * Convierte modelo de dominio Spot a formato Firebase
   * @param spot - Spot en formato de dominio
   * @param geohash - Geohash de la ubicación (calculado externamente)
   * @returns SpotFirebase - Spot en formato Firebase
   */
  static toFirebase(spot: Spot, geohash: string): SpotFirebase {
    return {
      name: spot.details.name,
      description: spot.details.description,
      availableSports: spot.details.availableSports || [],
      gallery: spot.details.media || [],
      location: new FirebaseGeoPoint(
        spot.details.location.latitude,
        spot.details.location.longitude
      ),
      geohash: geohash,
      overallRating: spot.details.overallRating || 0,
      contactPhone: spot.details.contactInfo?.phone || "",
      contactEmail: spot.details.contactInfo?.email || "",
      contactWebsite: spot.details.contactInfo?.website || "",
      isVerified: spot.metadata.isVerified || false,
      isActive: spot.metadata.isActive !== false,
      createdAt: spot.metadata.createdAt,
      updatedAt: spot.metadata.updatedAt,
      createdBy: spot.metadata.createdBy || "",
      reviewsCount: spot.activity?.reviewsCount || 0,
      visitsCount: spot.activity?.visitsCount || 0,
      favoritesCount: spot.activity?.favoritesCount || 0,
      visitedCount: spot.activity?.visitedCount || 0,
      wantToVisitCount: spot.activity?.wantToVisitCount || 0,
      discussionsCount: spot.activity?.discussionsCount || 0,
    };
  }

  /**
   * Convierte datos parciales de Spot a formato Firebase (para actualizaciones)
   * @param spotData - Datos parciales para actualizar
   * @param geohash - Geohash opcional (solo si se actualiza la ubicación)
   * @returns Partial<SpotFirebase> - Datos en formato Firebase
   */
  static partialToFirebase(spotData: Partial<Spot>, geohash?: string): Partial<SpotFirebase> {
    const firebaseUpdate: Partial<SpotFirebase> = {};

    // Mapear SpotDetails si existe
    if (spotData.details) {
      const details = spotData.details;
      if (details.name !== undefined) firebaseUpdate.name = details.name;
      if (details.description !== undefined) firebaseUpdate.description = details.description;
      if (details.availableSports !== undefined) firebaseUpdate.availableSports = details.availableSports;
      if (details.media !== undefined) firebaseUpdate.gallery = details.media;
      if (details.location !== undefined) {
        firebaseUpdate.location = new FirebaseGeoPoint(
          details.location.latitude,
          details.location.longitude
        );
        if (geohash) {
          firebaseUpdate.geohash = geohash;
        }
      }
      if (details.overallRating !== undefined) firebaseUpdate.overallRating = details.overallRating;
      if (details.contactInfo) {
        if (details.contactInfo.phone !== undefined) firebaseUpdate.contactPhone = details.contactInfo.phone;
        if (details.contactInfo.email !== undefined) firebaseUpdate.contactEmail = details.contactInfo.email;
        if (details.contactInfo.website !== undefined) firebaseUpdate.contactWebsite = details.contactInfo.website;
      }
    }

    // Mapear metadata si existe
    if (spotData.metadata) {
      if (spotData.metadata.isVerified !== undefined) {
        firebaseUpdate.isVerified = spotData.metadata.isVerified;
      }
      if (spotData.metadata.isActive !== undefined) {
        firebaseUpdate.isActive = spotData.metadata.isActive;
      }
      if (spotData.metadata.createdAt !== undefined) {
        firebaseUpdate.createdAt = spotData.metadata.createdAt;
      }
      if (spotData.metadata.updatedAt !== undefined) {
        firebaseUpdate.updatedAt = spotData.metadata.updatedAt;
      }
      if (spotData.metadata.createdBy !== undefined) {
        firebaseUpdate.createdBy = spotData.metadata.createdBy;
      }
    }

    // Mapear activity si existe
    if (spotData.activity) {
      const activity = spotData.activity;
      if (activity.reviewsCount !== undefined) {
        firebaseUpdate.reviewsCount = activity.reviewsCount;
      }
      if (activity.visitsCount !== undefined) {
        firebaseUpdate.visitsCount = activity.visitsCount;
      }
      if (activity.favoritesCount !== undefined) {
        firebaseUpdate.favoritesCount = activity.favoritesCount;
      }
      if (activity.visitedCount !== undefined) {
        firebaseUpdate.visitedCount = activity.visitedCount;
      }
      if (activity.wantToVisitCount !== undefined) {
        firebaseUpdate.wantToVisitCount = activity.wantToVisitCount;
      }
      if (activity.discussionsCount !== undefined) {
        firebaseUpdate.discussionsCount = activity.discussionsCount;
      }
    }

    return firebaseUpdate;
  }
}

