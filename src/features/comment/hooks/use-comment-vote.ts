import { commentRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { CommentSourceType } from '@/src/entities/comment/model/comment';
import { useCallback, useEffect, useState } from 'react';

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
 * @param contextId - ID del contexto (spot)
 * @param sourceType - Tipo de recurso padre (review o discussion)
 * @param sourceId - ID del recurso padre
 * @param commentId - ID del comentario
 * @param onVoteChange - Callback cuando cambian los contadores (likes, dislikes)
 * @param autoFetch - Si debe cargar automáticamente el voto del usuario (default: true)
 * 
 * @example
 * ```tsx
 * const { voteState, handleLike, handleDislike } = useCommentVote(contextId, sourceType, sourceId, commentId, handleVoteChange);
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
  contextId: string | undefined,
  sourceType: CommentSourceType | undefined,
  sourceId: string | undefined,
  commentId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  const { user } = useUser();
  const userId = user?.id;

  const [voteState, setVoteState] = useState<CommentVoteState>({
    isLiked: false,
    isDisliked: false,
    isVoting: false,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchUserVote = useCallback(async () => {
    if (!contextId || !sourceType || !sourceId || !commentId || !userId) return;
    try {
      const vote = await commentRepository.getCommentVote(contextId, sourceType, sourceId, commentId, userId);
      setVoteState(prev => ({
        ...prev,
        isLiked: vote === true,
        isDisliked: vote === false,
      }));
    } catch (err) {
      console.error('[useCommentVote] fetchUserVote', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vote');
    }
  }, [contextId, sourceType, sourceId, commentId, userId]);

  const handleVote = useCallback(
    async (isLike: boolean, currentLikes: number, currentDislikes: number) => {
      if (!contextId || !sourceType || !sourceId || !commentId || !userId) {
        setError('User must be logged in to vote');
        return;
      }
      setVoteState(prev => ({ ...prev, isVoting: true }));
      setError(null);

      let newLikes = currentLikes;
      let newDislikes = currentDislikes;

      try {
        if ((isLike && voteState.isLiked) || (!isLike && voteState.isDisliked)) {
          await commentRepository.removeCommentVote(contextId, sourceType, sourceId, commentId, userId);
          if (isLike) newLikes = Math.max(0, currentLikes - 1);
          else newDislikes = Math.max(0, currentDislikes - 1);
          setVoteState({ isLiked: false, isDisliked: false, isVoting: false });
        } else {
          await commentRepository.voteComment(contextId, sourceType, sourceId, commentId, userId, isLike);
          if (isLike) {
            newLikes = currentLikes + 1;
            if (voteState.isDisliked) newDislikes = Math.max(0, currentDislikes - 1);
          } else {
            newDislikes = currentDislikes + 1;
            if (voteState.isLiked) newLikes = Math.max(0, currentLikes - 1);
          }
          setVoteState({ isLiked: isLike, isDisliked: !isLike, isVoting: false });
        }
        onVoteChange?.(newLikes, newDislikes);
      } catch (err) {
        console.error('[useCommentVote] handleVote', err);
        setError(err instanceof Error ? err.message : 'Failed to vote');
        setVoteState(prev => ({ ...prev, isVoting: false }));
      }
    },
    [contextId, sourceType, sourceId, commentId, userId, voteState, onVoteChange]
  );

  const handleLike = useCallback(
    (currentLikes: number, currentDislikes: number) =>
      handleVote(true, currentLikes, currentDislikes),
    [handleVote]
  );

  const handleDislike = useCallback(
    (currentLikes: number, currentDislikes: number) =>
      handleVote(false, currentLikes, currentDislikes),
    [handleVote]
  );

  useEffect(() => {
    if (autoFetch && contextId && sourceType && sourceId && commentId && userId) fetchUserVote();
  }, [autoFetch, contextId, sourceType, sourceId, commentId, userId, fetchUserVote]);

  return { voteState, handleLike, handleDislike, error, refetch: fetchUserVote };
};
