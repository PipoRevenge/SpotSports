import { discussionRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { useMutation, useQuery, useQueryClient } from '@/src/lib/react-query';
import { useCallback } from 'react';

export interface DiscussionVoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

/**
 * Hook para gestionar los votos en una discussion
 * 
 * @param spotId - ID del spot al que pertenece la discussion
 * @param discussionId - ID de la discussion
 * @param onVoteChange - Callback cuando cambian los contadores
 * @param autoFetch - Si debe cargar automáticamente el voto del usuario
 */
export const useDiscussionVote = (
  spotId: string | undefined,
  discussionId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  const { user } = useUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const voteQuery = useQuery({
    queryKey: ['discussionVote', spotId, discussionId, userId],
    queryFn: async () => {
      if (!spotId || !discussionId || !userId) return null;
      const v = await discussionRepository.getDiscussionVote(spotId, discussionId, userId);
      return v;
    },
    enabled: autoFetch && !!spotId && !!discussionId && !!userId,
  });

  const voteState = {
    isLiked: voteQuery.data === true,
    isDisliked: voteQuery.data === false,
    isVoting: false,
  } as DiscussionVoteState;

  const mutation = useMutation({
    mutationFn: async ({ isLike, currentLikes, currentDislikes }: { isLike: boolean; currentLikes: number; currentDislikes: number }) => {
      if (!spotId || !discussionId || !userId) throw new Error('User must be logged in to vote');
      
      const isRemoving = (isLike && voteState.isLiked) || (!isLike && voteState.isDisliked);
      
      if (isRemoving) {
        await discussionRepository.removeDiscussionVote(spotId, discussionId, userId);
        return { isLike, removed: true };
      }
      
      await discussionRepository.voteDiscussion(spotId, discussionId, userId, isLike);
      return { isLike, removed: false };
    },
    onMutate: async ({ isLike, currentLikes, currentDislikes }) => {
      const key = ['discussionVote', spotId, discussionId, userId];
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
      const key = ['discussionVote', spotId, discussionId, userId];
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
      // Revert counter changes on error
      if (context?.previousLikes !== undefined && context?.previousDislikes !== undefined) {
        onVoteChange?.(context.previousLikes, context.previousDislikes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussion' });
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussions' });
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussionVote' });
    }
  });

  const handleLike = useCallback(
    (currentLikes: number, currentDislikes: number) => {
      mutation.mutate({ isLike: true, currentLikes, currentDislikes });
    },
    [mutation]
  );

  const handleDislike = useCallback(
    (currentLikes: number, currentDislikes: number) => {
      mutation.mutate({ isLike: false, currentLikes, currentDislikes });
    },
    [mutation]
  );

  // React Query handles fetching/updating, expose method to refetch when needed
  const refetch = () => voteQuery.refetch();

  return { 
    voteState: { ...voteState, isVoting: mutation.isPending }, 
    handleLike, 
    handleDislike, 
    error: voteQuery.isError ? (voteQuery.error as Error)?.message : null, 
    refetch 
  };
};
