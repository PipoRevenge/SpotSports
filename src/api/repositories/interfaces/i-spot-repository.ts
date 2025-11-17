import { SportSpotRating, Spot, SpotDetails } from '@/src/entities/spot/model/spot';
import { GeoPoint } from '@/src/types/geopoint';

/**
 * Filtros para búsqueda de spots
 */
export interface SpotSearchFilters {
  // Búsqueda por texto
  searchQuery?: string;
  
  // Filtros de ubicación
  location?: GeoPoint;
  maxDistance?: number; // en kilómetros
  
  // Filtros de deportes
  sportIds?: string[];
  categoryId?: string; // Filtro por categoría de deporte
  sportCriteria?: {
    sportId: string;
    difficulty?: 'easy' | 'intermediate' | 'hard';
    minRating?: number;
  }[];  
  // Filtros de calidad
  minRating?: number;
  onlyVerified?: boolean;
  
  // Ordenamiento
  sortBy?: 'distance' | 'rating' | 'name' | 'recent';
  sortOrder?: 'asc' | 'desc';
  
  // Paginación
  limit?: number;
  offset?: number;
}

export interface ISpotRepository {
  // Crear un nuevo spot
  createSpot(spotData: SpotDetails, userId: string, username: string): Promise<string >;
  
  // Obtener spot por ID
  getSpotById(id: string): Promise<Spot | null>;
  
  // Obtener calificaciones de deportes para un spot
  getSportRatings(spotId: string): Promise<SportSpotRating[]>;
  
  // Buscar spots con filtros
  searchSpots(filters: SpotSearchFilters): Promise<Spot[]>;

  

}