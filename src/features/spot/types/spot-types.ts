import { DifficultyLevel } from "@/src/types/difficulty";
import { GeoPoint } from "@/src/types/geopoint";
import React from "react";

// Media item para el formulario
export interface MediaItem {
  uri: string;
  type: "image" | "video";
  thumbnail?: string;
  duration?: number;
}

/**
 * Criterios específicos de filtrado por deporte
 */
export interface SportFilterCriteria {
  sportId: string;
  difficulty?: DifficultyLevel;
  minRating?: number;
}

/**
 * Constantes para el rating
 */
export const RATING_CONFIG = {
  MIN: 0,
  MAX: 5,
  STEP: 0.5,
  DEFAULT: 0,
} as const;

/**
 * Constantes para la distancia
 */
export const DISTANCE_CONFIG = {
  MIN: 1,
  MAX: 50,
  STEP: 1,
  DEFAULT: 10,
} as const;

// Form data para creación de spot
export interface SpotCreateFormData {
  name: string;
  description: string;
  availableSports: string[];
  media: MediaItem[];
  location: GeoPoint | null;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
}

// Estado del formulario
export interface SpotFormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Errores de validación del formulario
export interface SpotFormErrors {
  name?: string;
  description?: string;
  availableSports?: string;
  media?: string; // Añadido
  location?: string;
  contactEmail?: string;
  contactWebsite?: string;
}

// Props para el slot de selección de deportes
export interface SportsSlotProps {
  selectedSports: string[];
  onSportsChange: (selectedSports: string[]) => void;
  error?: string;
}

// Props para componentes
export interface SpotCreateFormProps {
  onSuccess?: (spotId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<SpotCreateFormData>;
  sportsSlot?: React.ComponentType<SportsSlotProps>;
}
