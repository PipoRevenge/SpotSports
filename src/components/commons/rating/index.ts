/**
 * Rating Components
 * 
 * Componentes profesionales y reutilizables para mostrar y editar ratings
 */

export { RatingStars } from "./rating-stars";
export type { RatingStarsProps } from "./rating-stars";

export { RatingDifficulty } from "./rating-difficulty";
export type { RatingDifficultyProps } from "./rating-difficulty";

export { RatingDifficultySlider } from "./rating-difficulty-slider";
export type { RatingDifficultySliderProps } from "./rating-difficulty-slider";

// Re-exportar tipos y constantes globales de dificultad para conveniencia
export { DIFFICULTY_CONFIG, DIFFICULTY_LEVELS, DIFFICULTY_RANGE } from "@/src/types/difficulty";
export type { DifficultyLevel } from "@/src/types/difficulty";

