import { reviewRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { useMutation, useQuery, useQueryClient } from '@/src/lib/react-query';
import { useCallback, useMemo } from 'react';

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
  const { user } = useUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const voteQuery = useQuery<boolean | null>({
    queryKey: ['review', 'vote', spotId, reviewId, userId],
    enabled: autoFetch && !!spotId && !!reviewId && !!userId,
    staleTime: 5 * 60_000,
    queryFn: () => reviewRepository.getReviewVote(spotId!, reviewId!, userId!),
  });

  const voteState: ReviewVoteState = useMemo(() => ({
    isLiked: voteQuery.data === true,
    isDisliked: voteQuery.data === false,
    isVoting: false,
  }), [voteQuery.data]);

  const mutation = useMutation({
    mutationFn: async ({ isLike, currentLikes, currentDislikes }: { isLike: boolean; currentLikes: number; currentDislikes: number }) => {
      if (!spotId || !reviewId || !userId) {
        throw new Error('User must be logged in to vote');
      }

      const isRemoving = (isLike && voteState.isLiked) || (!isLike && voteState.isDisliked);
      
      if (isRemoving) {
        await reviewRepository.removeReviewVote(spotId, reviewId, userId);
        return { isLike, removed: true };
      }

      await reviewRepository.voteReview(spotId, reviewId, userId, isLike);
      return { isLike, removed: false };
    },
    onMutate: async ({ isLike, currentLikes, currentDislikes }) => {
      const key = ['review', 'vote', spotId, reviewId, userId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<boolean | null>(key);
      
      // Optimistically update vote state
      const isRemoving = (isLike && voteState.isLiked) || (!isLike && voteState.isDisliked);
      queryClient.setQueryData(key, isRemoving ? null : isLike);
      
      // Calculate optimistic counter changes
      let newLikes = currentLikes;
      let newDislikes = currentDislikes;
      
      if (isRemoving) {
        if (isLike) newLikes = Math.max(0, currentLikes - 1);
        else newDislikes = Math.max(0, currentDislikes - 1);
      } else {
        if (isLike) {
          newLikes = currentLikes + 1;
          if (voteState.isDisliked) newDislikes = Math.max(0, currentDislikes - 1);
        } else {
          newDislikes = currentDislikes + 1;
          if (voteState.isLiked) newLikes = Math.max(0, currentLikes - 1);
        }
      }
      
      // Immediately notify UI of counter changes
      onVoteChange?.(newLikes, newDislikes);
      
      return { previous, previousLikes: currentLikes, previousDislikes: currentDislikes };
    },
    onError: (_err, _variables, context) => {
      const key = ['review', 'vote', spotId, reviewId, userId];
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
      // Revert counter changes on error
      if (context?.previousLikes !== undefined && context?.previousDislikes !== undefined) {
        onVoteChange?.(context.previousLikes, context.previousDislikes);
      }
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const handleVote = useCallback(
    async (isLike: boolean, currentLikes: number, currentDislikes: number) => {
      // Pass counters to mutation for optimistic update
      await mutation.mutateAsync({ isLike, currentLikes, currentDislikes });
    },
    [mutation]
  );

  const handleLike = useCallback(
    (currentLikes: number, currentDislikes: number) => handleVote(true, currentLikes, currentDislikes),
    [handleVote]
  );

  const handleDislike = useCallback(
    (currentLikes: number, currentDislikes: number) => handleVote(false, currentLikes, currentDislikes),
    [handleVote]
  );

  return {
    voteState: { ...voteState, isVoting: mutation.isPending },
    handleLike,
    handleDislike,
    error: voteQuery.error ? (voteQuery.error as Error).message : null,
    refetch: voteQuery.refetch,
  };
};
