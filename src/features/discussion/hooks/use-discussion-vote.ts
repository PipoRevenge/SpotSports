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

  const mutationVote = useMutation({
    mutationFn: async ({ isLike }: { isLike: boolean }) => {
      if (!spotId || !discussionId || !userId) throw new Error('User must be logged in to vote');
      return await discussionRepository.voteDiscussion(spotId, discussionId, userId, isLike);
    },
    onSuccess: () => {
      // Update vote cache and invalidate discussion counters
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussion' });
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussions' });
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussionVote' });
    }
  });

  const mutationRemove = useMutation({
    mutationFn: async () => {
      if (!spotId || !discussionId || !userId) throw new Error('User must be logged in to vote');
      return await discussionRepository.removeDiscussionVote(spotId, discussionId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussion' });
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussions' });
      queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussionVote' });
    }
  });

  const handleLike = useCallback(() => mutationVote.mutate({ isLike: true }), [mutationVote]);

  const handleDislike = useCallback(() => mutationVote.mutate({ isLike: false }), [mutationVote]);

  // React Query handles fetching/updating, expose method to refetch when needed
  const refetch = () => voteQuery.refetch();

  return { voteState, handleLike, handleDislike, error: voteQuery.isError ? (voteQuery.error as Error)?.message : null, refetch };
};
