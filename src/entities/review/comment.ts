

// Interfaz principal de Comentario (estructura plana)
export interface Comment {
  id: string;
  createdBy: string; // userId
  content: string;
  likesCount: number;
  dislikesCount: number;
  reports: number;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}