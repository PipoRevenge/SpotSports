import { Comment } from "@/src/entities/comment";

/**
 * Comentario enriquecido con datos del usuario
 * Se usa en la UI para mostrar información del autor
 */
export interface CommentWithUser extends Comment {
  userName?: string;
  userProfileUrl?: string;
}
