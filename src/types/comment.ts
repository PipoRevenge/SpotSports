import { User } from "../entities/user/model/user";

export interface CommentDetails {
  content: string;
  rating?: number;
}

export interface CommentMetadata {
  createdAt: Date;
  updatedAt?: Date;
}

export interface CommentActivity {
  likes: number;
  dislikes: number;
  reports: number;
}

// Interfaz principal de Comentario
export interface CommentReview {
  id: string;
  author: User;
  details: CommentDetails;
  metadata: CommentMetadata;
  isDeleted?: boolean;
  activity?: CommentActivity;
}