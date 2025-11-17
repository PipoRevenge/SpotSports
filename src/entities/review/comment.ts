

export interface CommentDetails {
  content: string;
}

export interface CommentMetadata {
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface CommentActivity {
  likes: number;
  dislikes: number;
  reports: number;
}

// Interfaz principal de Comentario
export interface Comment{
  id: string;
  author: string;
  details: CommentDetails;
  metadata: CommentMetadata;
  activity?: CommentActivity;
}