import { DifficultyLevel } from "../types/review-types";

/**
 * Límites de validación para reviews
 */
export const REVIEW_VALIDATION_LIMITS = {
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 1000,
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_MEDIA_COUNT: 10,
  MIN_SPORTS_COUNT: 1,
  MAX_SPORTS_COUNT: 10,
} as const;

/**
 * Mensajes de error para reviews
 */
export const REVIEW_ERROR_MESSAGES = {
  REQUIRED_CONTENT: 'Review content is required',
  REQUIRED_RATING: 'Overall rating is required',
  REQUIRED_SPORTS: 'At least one sport must be rated',
  CONTENT_TOO_SHORT: `Content must be at least ${REVIEW_VALIDATION_LIMITS.CONTENT_MIN_LENGTH} characters long`,
  CONTENT_TOO_LONG: `Content cannot be longer than ${REVIEW_VALIDATION_LIMITS.CONTENT_MAX_LENGTH} characters`,
  INVALID_RATING: `Rating must be between ${REVIEW_VALIDATION_LIMITS.MIN_RATING} and ${REVIEW_VALIDATION_LIMITS.MAX_RATING}`,
  INVALID_SPORT_RATING: 'All sports must have a valid rating',
  INVALID_DIFFICULTY: 'All sports must have a difficulty level',
  TOO_MANY_SPORTS: `Cannot rate more than ${REVIEW_VALIDATION_LIMITS.MAX_SPORTS_COUNT} sports`,
  TOO_MANY_MEDIA: `Cannot upload more than ${REVIEW_VALIDATION_LIMITS.MAX_MEDIA_COUNT} files`,
  CREATE_ERROR: 'Error creating review',
  DUPLICATE_SPORT: 'This sport is already in your review',
} as const;

/**
 * Niveles de dificultad disponibles
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Expert',
];

/**
 * Configuración de colores para niveles de dificultad
 */
export const DIFFICULTY_COLORS = {
  Beginner: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-500',
  },
  Intermediate: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-500',
  },
  Advanced: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-500',
  },
  Expert: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-500',
  },
} as const;

/**
 * Placeholders para campos de review
 */
export const REVIEW_PLACEHOLDERS = {
  CONTENT: 'Share your experience at this spot...',
  SEARCH_SPORT: 'Search for a sport to add...',
} as const;

/**
 * Estados de carga
 */
export const REVIEW_LOADING_STATES = {
  LOADING: 'Loading...',
  CREATING: 'Creating review...',
  UPLOADING_MEDIA: 'Uploading media...',
} as const;

/**
 * Mensajes de éxito
 */
export const REVIEW_SUCCESS_MESSAGES = {
  CREATED: 'Review created successfully!',
} as const;

/**
 * Review Sort Options
 */
export type ReviewSortValue = 'newest' | 'oldest' | 'ratingHigh' | 'ratingLow' | 'mostVoted';

export interface ReviewSortOption {
  value: ReviewSortValue;
  label: string;
  icon?: string;
}

export const REVIEW_SORT_OPTIONS: ReviewSortOption[] = [
  {
    value: 'newest',
    label: 'Newest First',
    icon: 'calendar-arrow-down',
  },
  {
    value: 'oldest',
    label: 'Oldest First',
    icon: 'calendar-arrow-up',
  },
  {
    value: 'ratingHigh',
    label: 'Highest Rating',
    icon: 'star',
  },
  {
    value: 'ratingLow',
    label: 'Lowest Rating',
    icon: 'star-off',
  },
  {
    value: 'mostVoted',
    label: 'Most Voted',
    icon: 'trending-up',
  },
];

export const DEFAULT_REVIEW_SORT: ReviewSortValue = 'newest';

export const getReviewSortLabel = (value: ReviewSortValue): string => {
  const option = REVIEW_SORT_OPTIONS.find(opt => opt.value === value);
  return option?.label || 'Newest First';
};
