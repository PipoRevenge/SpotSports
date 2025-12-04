import { useVote } from '@/src/hooks/use-vote';

/**
 * Estado del voto del usuario en una review
 */
export interface ReviewVoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

/**
 * Hook para gestionar los votos (likes/dislikes) en una review
 * 
 * Características:
 * - Permite dar like o dislike a una review
 * - Permite cambiar el voto (de like a dislike o viceversa)
 * - Permite quitar el voto
 * - Sincroniza el estado con Firebase
 * - Requiere que el usuario esté autenticado
 * - Actualiza los contadores en tiempo real
 * 
 * @param spotId - ID del spot al que pertenece la review
 * @param reviewId - ID de la review
 * @param onVoteChange - Callback cuando cambian los contadores (likes, dislikes)
 * @param autoFetch - Si debe cargar automáticamente el voto del usuario (default: true)
 * 
 * @example
 * ```tsx
 * const { voteState, handleLike, handleDislike } = useReviewVote(spotId, reviewId);
 * 
 * <Button 
 *   onPress={handleLike}
 *   disabled={voteState.isVoting}
 * >
 *   <ThumbsUp fill={voteState.isLiked ? "blue" : "none"} />
 * </Button>
 * ```
 */
export const useReviewVote = (
  spotId: string | undefined,
  reviewId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  const res = useVote('review', reviewId, onVoteChange, autoFetch);
  return res;
};
