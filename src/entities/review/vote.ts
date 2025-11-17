/**
 * Vote entity
 * Representa un voto (like/dislike) en una review
 */

/**
 * Voto de un usuario en una review
 * true = like, false = dislike
 */
export interface ReviewVote {
  userId: string;
  isLike: boolean; // true = like, false = dislike
  createdAt: Date;
}

/**
 * Datos para crear un voto
 */
export interface CreateVoteData {
  userId: string;
  isLike: boolean;
}
