import { useVote } from '@/src/hooks/use-vote';

/**
 * Estado del voto del usuario en un comentario
 */
export interface CommentVoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

/**
 * Hook para gestionar los votos (likes/dislikes) en un comentario
 * 
 * Características:
 * - Permite dar like o dislike a un comentario
 * - Permite cambiar el voto (de like a dislike o viceversa)
 * - Permite quitar el voto
 * - Sincroniza el estado con Firebase
 * - Requiere que el usuario esté autenticado
 * - Actualiza los contadores en tiempo real
 * 
 * @param commentId - ID del comentario
 * @param onVoteChange - Callback cuando cambian los contadores (likes, dislikes)
 * @param autoFetch - Si debe cargar automáticamente el voto del usuario (default: true)
 * 
 * @example
 * ```tsx
 * const { voteState, handleLike, handleDislike } = useCommentVote(commentId, handleVoteChange);
 * 
 * <Pressable 
 *   onPress={() => handleLike(likesCount, dislikesCount)}
 *   disabled={voteState.isVoting}
 * >
 *   <ThumbsUp fill={voteState.isLiked ? "blue" : "none"} />
 * </Pressable>
 * ```
 */
export const useCommentVote = (
  commentId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  return useVote('comment', commentId, onVoteChange, autoFetch);
};
