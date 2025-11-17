import { Review, ReviewActivity, ReviewDetails, ReviewMetadata, ReviewSport } from "@/src/entities/review/review";
import { firestore } from "@/src/lib/firebase-config";
import { doc, DocumentReference, Timestamp } from "firebase/firestore";

/**
 * Estructura de la review principal en Firestore
 * Ubicación: spots/[spotId]/reviews/[reviewId]
 */
export interface FirestoreReviewData {
  // Contenido de la Review (General)
  content: string;
  rating: number; // Rating Overall del Spot
  
  // Referencias
  refSportReviews: string[]; // IDs de documentos en sport_review
  createdByRef: DocumentReference; // Referencia al usuario que creó la review
  
  // Media
  media?: string[];
  
  // Métricas de Interacción
  likes: number;
  dislikes: number;
  commentsCount: number;
  reports: number;
  
  // Metadatos y Estado
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isDeleted?: boolean;
}

/**
 * Estructura de sport_review en Firestore
 * Ubicación: spots/[spotId]/sport_review/[sportReviewId]
 */
export interface FirestoreSportReviewData {
  // Calificación Específica del Deporte
  sportRating: number;
  difficulty: number;
  comment?: string; // Comentario específico sobre este deporte
  
  // Referencias
  refReview: DocumentReference; // Referencia directa a la review en spots/[spotId]/reviews/[reviewId]
  sportId: string; // ID del deporte
}

/**
 * Estructura de spot_sport_metrics en Firestore
 * Ubicación: spot_sport_metrics/[idMetric]
 */
export interface FirestoreSpotSportMetrics {
  // Referencias Principales (DocumentReference de Firestore)
  spot_ref: DocumentReference; // Referencia a spots/[spotId]
  sport_ref: DocumentReference; // Referencia a sports/[sportId]
  
  // Métricas Calculadas
  avg_difficulty: number;
  avg_quality: number; // Promedio de sportRating
  review_count: number;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Mapea los datos de Firestore a la entidad Review
 * Nota: Los reviewSports se deben cargar por separado desde sport_review
 */
export const mapFirestoreToReview = (
  id: string,
  data: FirestoreReviewData,
  sportReviews: ReviewSport[] = [],
  spotId?: string
): Review => {
  const details: ReviewDetails = {
    spotId: spotId || '', // Se pasa como parámetro ya que no está en FirestoreReviewData
    content: data.content,
    rating: data.rating,
    reviewSports: sportReviews,
    media: data.media || [], // Asegurar que siempre sea un array
  };

  const metadata: ReviewMetadata = {
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    createdBy: data.createdByRef.id, // Obtener ID de la referencia
    isDeleted: data.isDeleted,
  };

  const activity: ReviewActivity = {
    likes: data.likes,
    dislikes: data.dislikes,
    commentsCount: data.commentsCount,
    reports: data.reports,
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
  content: string,
  rating: number,
  sportReviewIds: string[],
  media?: string[]
): FirestoreReviewData => {
  const now = Timestamp.now();
  
  return {
    content,
    rating,
    createdByRef: doc(firestore, `users/${userId}`), // Referencia correcta usando doc()
    refSportReviews: sportReviewIds,
    media: media || [],
    likes: 0,
    dislikes: 0,
    commentsCount: 0,
    reports: 0,
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
