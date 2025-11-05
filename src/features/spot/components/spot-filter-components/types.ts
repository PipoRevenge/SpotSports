/**
 * Tipos compartidos para los filtros de spots
 */

/**
 * Criterios específicos de filtrado por deporte
 */
export interface SportFilterCriteria {
  sportId: string;
  difficulty?: "easy" | "intermediate" | "hard";
  minRating?: number;
}

/**
 * Niveles de dificultad disponibles
 */
export type DifficultyLevel = "easy" | "intermediate" | "hard";

/**
 * Opciones para el selector de dificultad
 */
export const DIFFICULTY_OPTIONS = [
  { label: "Cualquiera", value: "" },
  { label: "Fácil", value: "easy" as DifficultyLevel },
  { label: "Intermedio", value: "intermediate" as DifficultyLevel },
  { label: "Difícil", value: "hard" as DifficultyLevel },
] as const;

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