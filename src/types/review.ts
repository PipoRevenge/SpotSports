import { CommentReview } from "./comment";
import { Spot } from "./spot";
import { User } from "./user";

export interface ReviewDetails {
  title: string;
  content: string;
  rating: number;
  sportId: string;
  sportDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  images?: string[];
}

export interface ReviewMetadata {
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReviewActivity {
  likes: number;
  dislikes: number;
  commentsCount: number;
  comments?: CommentReview[];
  shares: number;
  reports: number;
}

// Interfaz principal de Reseña
export interface Review {
  id: string;
  author: User;
  spot: Spot;
  details: ReviewDetails;
  metadata: ReviewMetadata;
  isDeleted?: boolean;
  activity?: ReviewActivity;
}