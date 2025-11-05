/**
 * Componentes de filtros para búsqueda de spots
 * Exportaciones públicas
 */

// Tipos compartidos
export type {
    DifficultyLevel, SportFilterCriteria
} from './types';

export {
    DIFFICULTY_OPTIONS, DISTANCE_CONFIG, RATING_CONFIG
} from './types';

// Componentes principales de filtro
export { DistanceFilter } from './distance-filter';
export { RatingFilter } from './rating-filter';
export { SportFilter } from './sport-filter';
export { SportSelectedFilter } from './sport-selected-filter';
export { VerifiedFilter } from './verified-filter';





