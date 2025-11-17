import { ReviewFormData, ReviewSportFormData } from "../types/review-types";
import { REVIEW_ERROR_MESSAGES, REVIEW_VALIDATION_LIMITS } from "./review-constants";

/**
 * Valida el contenido de la review
 */
export const validateReviewContent = (content: string): string | null => {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return REVIEW_ERROR_MESSAGES.REQUIRED_CONTENT;
  }

  if (trimmedContent.length < REVIEW_VALIDATION_LIMITS.CONTENT_MIN_LENGTH) {
    return REVIEW_ERROR_MESSAGES.CONTENT_TOO_SHORT;
  }

  if (trimmedContent.length > REVIEW_VALIDATION_LIMITS.CONTENT_MAX_LENGTH) {
    return REVIEW_ERROR_MESSAGES.CONTENT_TOO_LONG;
  }

  return null;
};

/**
 * Valida el rating general
 */
export const validateOverallRating = (rating: number): string | null => {
  if (!rating || rating < REVIEW_VALIDATION_LIMITS.MIN_RATING) {
    return REVIEW_ERROR_MESSAGES.REQUIRED_RATING;
  }

  if (rating > REVIEW_VALIDATION_LIMITS.MAX_RATING) {
    return REVIEW_ERROR_MESSAGES.INVALID_RATING;
  }

  return null;
};

/**
 * Valida la lista de deportes calificados
 */
export const validateReviewSports = (sports: ReviewSportFormData[]): string | null => {
  if (!sports || sports.length < REVIEW_VALIDATION_LIMITS.MIN_SPORTS_COUNT) {
    return REVIEW_ERROR_MESSAGES.REQUIRED_SPORTS;
  }

  if (sports.length > REVIEW_VALIDATION_LIMITS.MAX_SPORTS_COUNT) {
    return REVIEW_ERROR_MESSAGES.TOO_MANY_SPORTS;
  }

  // Validar que cada deporte tenga rating y dificultad válidos
  for (const sport of sports) {
    if (!sport.sportRating || sport.sportRating < REVIEW_VALIDATION_LIMITS.MIN_RATING || sport.sportRating > REVIEW_VALIDATION_LIMITS.MAX_RATING) {
      return REVIEW_ERROR_MESSAGES.INVALID_SPORT_RATING;
    }

    if (!sport.difficulty) {
      return REVIEW_ERROR_MESSAGES.INVALID_DIFFICULTY;
    }
  }

  return null;
};

/**
 * Valida el número de medios
 */
export const validateMedia = (mediaCount: number): string | null => {
  if (mediaCount > REVIEW_VALIDATION_LIMITS.MAX_MEDIA_COUNT) {
    return REVIEW_ERROR_MESSAGES.TOO_MANY_MEDIA;
  }

  return null;
};

/**
 * Valida todos los campos del formulario de review
 */
export const validateReviewForm = (formData: ReviewFormData): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  // Validar contenido
  const contentError = validateReviewContent(formData.content);
  if (contentError) {
    errors.content = contentError;
  }

  // Validar rating general
  const ratingError = validateOverallRating(formData.rating);
  if (ratingError) {
    errors.rating = ratingError;
  }

  // Validar deportes
  const sportsError = validateReviewSports(formData.reviewSports);
  if (sportsError) {
    errors.reviewSports = sportsError;
  }

  // Validar media
  const mediaError = validateMedia(formData.media.length);
  if (mediaError) {
    errors.media = mediaError;
  }

  return errors;
};
