import { commentRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { CommentSourceType } from '@/src/entities/comment/model/comment';
import { useMutation, useQuery, useQueryClient } from '@/src/lib/react-query';
import { useCallback, useEffect } from 'react';

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
  const queryClient = useQueryClient();

  const voteQuery = useQuery({
    queryKey: ['commentVote', contextId, sourceType, sourceId, commentId, userId],
    queryFn: async () => {
      if (!contextId || !sourceType || !sourceId || !commentId || !userId) return null;
      return await commentRepository.getCommentVote(contextId, sourceType, sourceId, commentId, userId);
    },
    enabled: autoFetch && !!contextId && !!sourceType && !!sourceId && !!commentId && !!userId,
  });
  
  const voteState = {
    isLiked: voteQuery.data === true,
    isDisliked: voteQuery.data === false,
    isVoting: false,
  } as CommentVoteState;

  const mutation = useMutation({
    mutationFn: async ({ isLike, isRemoving }: { isLike: boolean; isRemoving: boolean }) => {
      if (!contextId || !sourceType || !sourceId || !commentId || !userId) throw new Error('User must be logged in to vote');
      
      if (isRemoving) {
        await commentRepository.removeCommentVote(contextId, sourceType, sourceId, commentId, userId);
        return { isLike, removed: true };
      }
      
      await commentRepository.voteComment(contextId, sourceType, sourceId, commentId, userId, isLike);
      return { isLike, removed: false };
    },
    onMutate: async ({ isLike, isRemoving }) => {
      const key = ['commentVote', contextId, sourceType, sourceId, commentId, userId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<boolean | null>(key);
      
      // Optimistically update vote state
      queryClient.setQueryData(key, isRemoving ? null : isLike);
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      const key = ['commentVote', contextId, sourceType, sourceId, commentId, userId];
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'comments' });
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'commentVote' });
    }
  });
  // helper to refetch the user's vote
  const fetchUserVote = voteQuery.refetch;
  const error = voteQuery.error;

  // compute isVoting based on mutation state
  voteState.isVoting = mutation.isPending;

  // Keep backward-compatible signatures: allow callers to pass current counts (likes, dislikes)
  const handleLike = useCallback(
    (likesCount?: number, dislikesCount?: number) => {
      const isRemoving = voteQuery.data === true;
      
      // Optimistically update counters before mutation
      if (typeof likesCount === 'number' && typeof dislikesCount === 'number') {
        let newLikes = likesCount;
        let newDislikes = dislikesCount;
        
        if (isRemoving) {
          // Remove like
          newLikes = Math.max(0, likesCount - 1);
        } else if (voteQuery.data === false) {
          // Switch from dislike to like
          newLikes = likesCount + 1;
          newDislikes = Math.max(0, dislikesCount - 1);
        } else {
          // Add like
          newLikes = likesCount + 1;
        }
        
        onVoteChange?.(newLikes, newDislikes);
      }
      
      mutation.mutate({ isLike: true, isRemoving });
    },
    [mutation, onVoteChange, voteQuery.data]
  );

  const handleDislike = useCallback(
    (likesCount?: number, dislikesCount?: number) => {
      const isRemoving = voteQuery.data === false;
      
      // Optimistically update counters before mutation
      if (typeof likesCount === 'number' && typeof dislikesCount === 'number') {
        let newLikes = likesCount;
        let newDislikes = dislikesCount;
        
        if (isRemoving) {
          // Remove dislike
          newDislikes = Math.max(0, dislikesCount - 1);
        } else if (voteQuery.data === true) {
          // Switch from like to dislike
          newLikes = Math.max(0, likesCount - 1);
          newDislikes = dislikesCount + 1;
        } else {
          // Add dislike
          newDislikes = dislikesCount + 1;
        }
        
        onVoteChange?.(newLikes, newDislikes);
      }
      
      mutation.mutate({ isLike: false, isRemoving });
    },
    [mutation, onVoteChange, voteQuery.data]
  );

  useEffect(() => {
    if (autoFetch && contextId && sourceType && sourceId && commentId && userId) fetchUserVote();
  }, [autoFetch, contextId, sourceType, sourceId, commentId, userId, fetchUserVote]);

  return { voteState, handleLike, handleDislike, error, refetch: fetchUserVote };
};
