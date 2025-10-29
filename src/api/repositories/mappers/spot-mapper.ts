import { Spot, SpotActivity, SpotDetails, SpotMetadata } from "@/src/entities/spot/model/spot";
import { GeoPoint } from "@/src/types/geopoint";

/**
 * Interface que representa el modelo de spot tal como se almacena en Firebase
 */
export interface SpotFirebase {
  // SpotDetails (campos planos en Firebase)
  name: string;
  description: string;
  availableSports: string[];
  media: string[];
  // GeoPoint se almacena como { latitude: number, longitude: number }
  location: {
    latitude: number;
    longitude: number;
  };
  geohash: string;
  overallRating: number;
  
  // ContactInfo (campos planos en Firebase)
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;

  // SpotMetadata (campos planos en Firebase)
  isVerified: boolean;
  isActive: boolean;
  // Pueden venir como Timestamp de Firebase u otros formatos
  createdAt: any;
  updatedAt: any;
  createdBy: string;

  // SpotActivity (campos planos en Firebase)
  reviewsCount: number;
  visitsCount: number;
}

/**
 * Mapper para convertir entre modelos de dominio y Firebase
 */
export const spotMapper = {
  /**
   * Convierte datos de Firebase a modelo de dominio
   */
  toDomain(raw: SpotFirebase & { id: string }): Spot {
    if (!raw) {
      throw new Error('Invalid raw spot data');
    }

    // Construir SpotDetails
    const details: SpotDetails = {
      name: raw.name || '',
      description: raw.description || '',
      availableSports: raw.availableSports || [],
      media: raw.media || [],
      location: {
        latitude: raw.location?.latitude || 0,
        longitude: raw.location?.longitude || 0,
      } as GeoPoint,
      overallRating: raw.overallRating || 0,
      contactInfo: {
        phone: raw.contactPhone || "",
        email: raw.contactEmail || "",
        website: raw.contactWebsite || "",
      }
    };

    // Construir SpotMetadata
    const metadata: SpotMetadata = {
      isVerified: raw.isVerified || false,
      isActive: raw.isActive !== false, // Por defecto true
      createdAt: raw.createdAt ? new Date(raw.createdAt.seconds * 1000) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt.seconds * 1000) : new Date(),
      createdBy: raw.createdBy,
    };

    // Construir SpotActivity
    const activity: SpotActivity = {
      reviewsCount: raw.reviewsCount || 0,
      visitsCount: raw.visitsCount || 0,
    };

    return {
      id: raw.id,
      details,
      metadata,
      activity,
    };
  },

  /**
   * Convierte modelo de dominio a formato de Firebase
   */
  toFirestore(spotDetails: SpotDetails, userId: string): Omit<SpotFirebase, 'createdAt' | 'updatedAt' | 'geohash'> {
    return {
      name: spotDetails.name,
      description: spotDetails.description,
      availableSports: spotDetails.availableSports || [],
      media: spotDetails.media || [],
      location: {
        latitude: spotDetails.location.latitude,
        longitude: spotDetails.location.longitude,
      },
      overallRating: spotDetails.overallRating || 0,
      contactPhone: spotDetails.contactInfo?.phone || "",
      contactEmail: spotDetails.contactInfo?.email || "",
      contactWebsite: spotDetails.contactInfo?.website || "",
      isVerified: false, // Por defecto false hasta verificación
      isActive: true, // Por defecto activo
      reviewsCount: 0, // Inicia en 0
      visitsCount: 0, // Inicia en 0
      createdBy: userId,
    };
  },

  /**
   * Convierte modelo completo de dominio a formato de Firebase (para actualizaciones)
   */
  toFirestoreComplete(spot: Spot, geohash: string): SpotFirebase {
    const baseData = this.toFirestore(spot.details, spot.metadata.createdBy);
    
    return {
      ...baseData,
      geohash: geohash,
      isVerified: spot.metadata.isVerified || false,
      isActive: spot.metadata.isActive !== false,
      createdBy: spot.metadata.createdBy || "", 
      reviewsCount: spot.activity?.reviewsCount || 0,
      visitsCount: spot.activity?.visitsCount || 0,
      createdAt: spot.metadata.createdAt,
      updatedAt: spot.metadata.updatedAt,
    };
  }
};
