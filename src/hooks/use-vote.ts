/**
 * @deprecated Este hook ya no debe usarse directamente.
 * Usa los hooks específicos de cada feature:
 * - useReviewVote (features/review)
 * - useDiscussionVote (features/discussion)  
 * - useCommentVote (features/comment)
 * 
 * Estos hooks usan los repositorios correspondientes que encapsulan
 * la lógica de votación sin exponer la estructura de la base de datos.
 */

export interface VoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

// Re-export types for backward compatibility
export type { VoteState as default };

