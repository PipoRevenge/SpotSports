import { Comment } from "@/src/entities/review/comment";
import { Review, ReviewDetails } from "@/src/entities/review/model/review";

/**
 * Interfaz del repositorio de reviews
 * Define las operaciones CRUD para gestionar reviews
 */
export interface IReviewRepository {
  /**
   * Crea una nueva review
   * @param reviewData - Datos de la review a crear
   * @returns La review creada con su ID
   */
  createReview(userId: string, reviewData: ReviewDetails): Promise<Review>;

  /**
   * Obtiene una review por su ID
   * @param reviewId - ID de la review
   * @param spotId - ID del spot (opcional pero recomendado para mejor performance)
   * @returns La review encontrada o null
   */
  getReviewById(reviewId: string, spotId?: string): Promise<Review | null>;

  /**
   * Obtiene la review de un usuario para un spot específico
   * El reviewId se genera como userId_spotId
   * @param userId - ID del usuario
   * @param spotId - ID del spot
   * @returns La review del usuario para ese spot o null
   */
  getUserReviewForSpot(userId: string, spotId: string): Promise<Review | null>;

  /**
   * Obtiene todas las reviews de un spot
   * @param spotId - ID del spot
   * @param limit - Número máximo de reviews a obtener
   * @param offset - Número de reviews a saltar (paginación)
   * @returns Array de reviews del spot
   */
  getReviewsBySpot(spotId: string, limit?: number, offset?: number): Promise<Review[]>;

  /**
   * Obtiene todas las reviews de un usuario
   * @param userId - ID del usuario
   * @param limit - Número máximo de reviews a obtener
   * @param offset - Número de reviews a saltar (paginación)
   * @returns Array de reviews del usuario
   */
  getReviewsByUser(userId: string, limit?: number, offset?: number): Promise<Review[]>;

  /**
   * Sube archivos multimedia de una review a Firebase Storage
   * @param spotId - ID del spot
   * @param reviewId - ID de la review
   * @param mediaUris - Array de URIs locales de los archivos a subir
   * @returns Array de rutas de Storage donde se guardaron los archivos
   */
  uploadReviewMedia(spotId: string, reviewId: string, mediaUris: string[]): Promise<string[]>;

  /**
   * Actualiza una review existente
   * @param reviewId - ID de la review a actualizar (formato: userId_spotId)
   * @param spotId - ID del spot
   * @param updates - Datos parciales a actualizar
   * @returns La review actualizada
   */
  updateReview(reviewId: string, spotId: string, updates: Partial<ReviewDetails>): Promise<Review>;

  /**
   * Elimina una review (soft delete)
   * @param reviewId - ID de la review a eliminar
   * @param spotId - ID del spot (necesario para acceder a la review)
   */
  deleteReview(reviewId: string, spotId: string): Promise<void>;

  /**
   * Vota en una review (like o dislike)
   * Si el usuario ya votó, actualiza el voto
   * @param spotId - ID del spot
   * @param reviewId - ID de la review
   * @param userId - ID del usuario que vota
   * @param isLike - true para like, false para dislike
   */
  voteReview(spotId: string, reviewId: string, userId: string, isLike: boolean): Promise<void>;

  /**
   * Elimina el voto de una review
   * @param spotId - ID del spot
   * @param reviewId - ID de la review
   * @param userId - ID del usuario que quita el voto
   */
  removeVote(spotId: string, reviewId: string, userId: string): Promise<void>;

  /**
   * Obtiene el voto de un usuario en una review
   * @param spotId - ID del spot
   * @param reviewId - ID de la review
   * @param userId - ID del usuario
   * @returns true si es like, false si es dislike, null si no hay voto
   */
  getUserVote(spotId: string, reviewId: string, userId: string): Promise<boolean | null>;

  /**
   * Reporta una review
   * @param reviewId - ID de la review a reportar
   * @param userId - ID del usuario que reporta
   * @param reason - Razón del reporte
   */
  reportReview(reviewId: string, userId: string, reason: string): Promise<void>;

  /**
   * Obtiene los comentarios de una review con paginación
   * @param reviewId - ID de la review
   * @param page - Número de página (empezando en 1)
   * @param pageSize - Cantidad de comentarios por página
   * @returns Array de comentarios y total de comentarios
   */
  getComments(reviewId: string, page: number, pageSize: number): Promise<{ comments: Comment[], total: number }>;

  /**
   * Añade un comentario a una review
   * @param reviewId - ID de la review
   * @param userId - ID del usuario que comenta
   * @param content - Contenido del comentario
   * @returns El comentario creado
   */
  addComment(reviewId: string, userId: string, content: string): Promise<Comment>;

  /**
   * Elimina un comentario (soft delete)
   * @param reviewId - ID de la review
   * @param commentId - ID del comentario a eliminar
   */
  deleteComment(reviewId: string, commentId: string): Promise<void>;

  /**
   * Vota en un comentario (like o dislike)
   * @param reviewId - ID de la review
   * @param commentId - ID del comentario
   * @param userId - ID del usuario que vota
   * @param isLike - true para like, false para dislike
   */
  voteComment(reviewId: string, commentId: string, userId: string, isLike: boolean): Promise<void>;

  /**
   * Elimina el voto de un comentario
   * @param reviewId - ID de la review
   * @param commentId - ID del comentario
   * @param userId - ID del usuario que quita el voto
   */
  removeCommentVote(reviewId: string, commentId: string, userId: string): Promise<void>;

  /**
   * Obtiene el voto de un usuario en un comentario
   * @param reviewId - ID de la review
   * @param commentId - ID del comentario
   * @param userId - ID del usuario
   * @returns true si es like, false si es dislike, null si no hay voto
   */
  getCommentVote(reviewId: string, commentId: string, userId: string): Promise<boolean | null>;
}
