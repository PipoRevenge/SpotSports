/**
 * Interfaz del repositorio de votos
 * 
 * Estructura de datos en Firestore:
 * - spots/{spotId}/reviews/{reviewId}/votes/{userId}
 * - spots/{spotId}/discussions/{discussionId}/votes/{userId}
 * - spots/{spotId}/reviews/{reviewId}/comments/{commentId}/votes/{userId}
 * - spots/{spotId}/discussions/{discussionId}/comments/{commentId}/votes/{userId}
 * 
 * Los votos siempre son subcollections del recurso padre.
 * Todos los métodos usan resourcePath (ruta completa del recurso).
 */
export interface IVoteRepository {
  /**
   * Vota en un recurso (like o dislike)
   * @param resourcePath - Ruta completa del recurso (ej: spots/abc/reviews/xyz)
   * @param userId - ID del usuario que vota
   * @param isLike - true para like, false para dislike
   */
  vote(resourcePath: string, userId: string, isLike: boolean): Promise<void>;

  /**
   * Elimina el voto de un usuario en un recurso
   * @param resourcePath - Ruta completa del recurso
   * @param userId - ID del usuario
   */
  removeVote(resourcePath: string, userId: string): Promise<void>;

  /**
   * Obtiene el voto actual de un usuario en un recurso
   * @param resourcePath - Ruta completa del recurso
   * @param userId - ID del usuario
   * @returns true si es like, false si es dislike, null si no hay voto
   */
  getUserVote(resourcePath: string, userId: string): Promise<boolean | null>;
}
