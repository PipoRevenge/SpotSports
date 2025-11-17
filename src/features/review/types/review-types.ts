import { MediaItem } from "@/src/components/commons/media-picker/media-picker-carousel";

/**
 * Tipos de dificultad para deportes
 */
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

/**
 * Datos para crear una nueva review
 */
export interface CreateReviewData {
  spotId: string;
  content: string;
  rating: number;
  reviewSports: ReviewSportFormData[];
  media: string[]; // Array de URIs locales (siempre presente, puede estar vacío)
}

/**
 * Datos de un deporte en el formulario de review
 */
export interface ReviewSportFormData {
  sportId: string;
  name: string;
  sportRating: number;
  difficulty: number; // Valor numérico 0-10
  comment?: string; // Comentario específico sobre este deporte
}

/**
 * Errores del formulario de review
 */
export interface ReviewFormErrors {
  content?: string;
  rating?: string;
  reviewSports?: string;
  media?: string;
}

/**
 * Datos del formulario de review
 */
export interface ReviewFormData {
  content: string;
  rating: number;
  reviewSports: ReviewSportFormData[];
  media: MediaItem[];
}

/**
 * Deporte simple para búsqueda
 */
export interface SimpleSport {
  id: string;
  name: string;
  description?: string;
  category?: string;
}
