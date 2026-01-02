import { Review, ReviewActivity, ReviewDetails, ReviewMetadata, ReviewSport } from "@/src/entities/review/model/review";
import { DocumentReference, Timestamp } from "firebase/firestore";
import { parseTimestamp } from '../utils/firebase-parsers';

/**
 * Estructura de sportRating individual dentro del map
 */
export interface FirestoreSportRating {
  sportRating: number;  // Rating específico para este deporte
  difficulty: number;   // Dificultad para este deporte
  content?: string;     // Comentario opcional solo para este deporte
}

/**
 * Estructura de la review principal en Firestore
 * Ubicación: spots/[spotId]/reviews/[reviewId]
 */
export interface FirestoreReviewData {
  // Contenido de la Review (General)
  content: string;
  rating: number; // Rating Overall del Spot
  gallery: string[]; // Lista de urls de media
  
  // Referencias
  spotId: string;  // ID del spot
  userId: string;  // ID del usuario
  
  // SportReviews ahora es un array de strings (sportIds)
  SportReviews: string[]; // Array de sportIds que fueron calificados
  
  // sportRatings es un map donde la key es el sportId
  sportRatings: { [sportId: string]: FirestoreSportRating };
  
  // Métricas de Interacción (planas)
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  reports: number;
  
  // Metadatos y Estado
  createdAt: Timestamp | string; // Can be Timestamp from Firestore or ISO string from cloud functions
  updatedAt?: Timestamp | string;
  isDeleted?: boolean;
}

/**
 * Estructura de sport_review en Firestore (DEPRECATED - ahora parte de sportRatings map)
 * Mantenida para compatibilidad durante migración
 */
export interface FirestoreSportReviewData {
  // Calificación Específica del Deporte
  sportRating: number;
  difficulty: number;
  comment?: string; // Comentario específico sobre este deporte
  
  // Referencias
  refReview: DocumentReference; // Referencia directa a la review
  sportId: string; // ID del deporte
}

/**
 * Estructura de spot_sport_metrics en Firestore
 * Ubicación: spots/[spotId]/sport_metrics/[sportId]
 * 
 * NOTA: spot_ref y sport_ref ya no son necesarios porque están
 * implícitos en el path de la subcollection
 */
export interface FirestoreSpotSportMetrics {
  // Métricas Calculadas
  avg_difficulty: number;
  avg_rating: number; // Promedio de sportRating (antes avg_quality)
  review_count: number;
  
  // Sumas para facilitar recalculos
  sum_difficulty: number;
  sum_rating: number;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Mapea los datos de Firestore a la entidad Review
 */
export const mapFirestoreToReview = (
  id: string,
  data: FirestoreReviewData
): Review => {
  // Convertir sportRatings map a array de ReviewSport
  const sportReviews: ReviewSport[] = [];
  if (data.sportRatings) {
    for (const sportId in data.sportRatings) {
      const sportRating = data.sportRatings[sportId];
      sportReviews.push({
        sportId,
        sportRating: sportRating.sportRating,
        difficulty: sportRating.difficulty,
        comment: sportRating.content || "",
      });
    }
  }

  const details: ReviewDetails = {
    spotId: data.spotId,
    content: data.content,
    rating: data.rating,
    reviewSports: sportReviews,
    media: data.gallery || [], // Asegurar que siempre sea un array
  };

  const metadata: ReviewMetadata = {
    createdAt: parseTimestamp(data.createdAt) || new Date(),
    updatedAt: parseTimestamp(data.updatedAt),
    createdBy: data.userId, // userId es string ahora
    isDeleted: data.isDeleted,
  };

  const activity: ReviewActivity = {
    likesCount: data.likesCount || 0,
    dislikesCount: data.dislikesCount || 0,
    commentsCount: data.commentsCount || 0,
    reports: data.reports || 0,
  };

  return {
    id,
    details,
    metadata,
    activity,
  };
};

/**
 * Mapea SportReview de Firestore a ReviewSport
 */
export const mapFirestoreToReviewSport = (
  data: FirestoreSportReviewData
): ReviewSport => {
  return {
    sportId: data.sportId,
    sportRating: data.sportRating,
    difficulty: data.difficulty,
    comment: data.comment || "", // Asegurar que nunca sea undefined
  };
};

/**
 * Crea los datos de la review principal para Firestore
 */
export const createFirestoreReviewData = (
  userId: string,
  spotId: string,
  content: string,
  rating: number,
  reviewSports: ReviewSport[],
  gallery?: string[],
  existingCounts?: {
    likesCount?: number;
    dislikesCount?: number;
    commentsCount?: number;
    reports?: number;
  }
): FirestoreReviewData => {
  const now = Timestamp.now();
  
  // Crear el map de sportRatings
  const sportRatings: { [sportId: string]: FirestoreSportRating } = {};
  const sportReviewsIds: string[] = [];
  
  for (const reviewSport of reviewSports) {
    sportRatings[reviewSport.sportId] = {
      sportRating: reviewSport.sportRating,
      difficulty: reviewSport.difficulty,
      content: reviewSport.comment || "",
    };
    sportReviewsIds.push(reviewSport.sportId);
  }
  
  return {
    content,
    rating,
    gallery: gallery || [],
    spotId,
    userId,
    SportReviews: sportReviewsIds, // Array de sportIds
    sportRatings, // Map de sportId -> FirestoreSportRating
    likesCount: existingCounts?.likesCount ?? 0,
    dislikesCount: existingCounts?.dislikesCount ?? 0,
    commentsCount: existingCounts?.commentsCount ?? 0,
    reports: existingCounts?.reports ?? 0,
    createdAt: now,
    isDeleted: false,
  };
};

/**
 * Crea un documento FirestoreSportReviewData para guardar en Firestore
 */
export const createFirestoreSportReviewData = (
  reviewRef: DocumentReference,
  sportId: string,
  sportRating: number,
  difficulty: number,
  comment?: string
): FirestoreSportReviewData => {
  return {
    refReview: reviewRef, // Referencia directa a la review
    sportId,
    sportRating,
    difficulty,
    comment: comment || "", // Convertir undefined a string vacío
  };
};


