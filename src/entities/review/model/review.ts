


export interface ReviewDetails {
  spotId: string;
  content: string;
  rating: number;
  reviewSports: ReviewSport[];
  media?: string[];
}


export interface ReviewSport {
  sportId: string;
  sportRating: number;
  difficulty: number;
  comment?: string; // Comentario específico sobre este deporte en este spot
}

export interface ReviewMetadata {
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  createdBy: string;
}


export interface ReviewActivity {
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  reports: number;
}

// Interfaz principal de Reseña
export interface Review {
  id: string;
  details: ReviewDetails;
  metadata: ReviewMetadata;
  activity?: ReviewActivity;
}