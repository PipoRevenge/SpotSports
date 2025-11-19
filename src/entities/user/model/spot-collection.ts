/**
 * Categorías disponibles para clasificar spots guardados
 */
export type SpotCategory = 'Favorites' | 'Visited' | 'WantToVisit';

/**
 * Representa un spot guardado en la colección de usuario
 * Estructura: users/[userId]/saved_spots/[savedSpotId]
 */
export interface SavedSpot {
  id: string; // ID del documento en Firestore (savedSpotId)
  spotId: string; // ID del spot
  categories: SpotCategory[]; // Categorías en las que está guardado
  createdAt: Date; // Fecha en que se guardó por primera vez
  updatedAt: Date; // Fecha de última actualización de categorías
}

/**
 * Datos para crear o actualizar un spot guardado
 */
export interface SavedSpotCreate {
  spotId: string;
  categories: SpotCategory[];
}

// Mantener compatibilidad temporal con nombres antiguos
export type SpotCollectionType = SpotCategory;
export type SpotCollection = SavedSpot;
export type SpotCollectionCreate = SavedSpotCreate;
