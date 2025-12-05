import { discussionRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { useCallback, useEffect, useState } from 'react';

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

  const [voteState, setVoteState] = useState<DiscussionVoteState>({
    isLiked: false,
    isDisliked: false,
    isVoting: false,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchUserVote = useCallback(async () => {
    if (!spotId || !discussionId || !userId) return;
    try {
      const vote = await discussionRepository.getDiscussionVote(spotId, discussionId, userId);
      setVoteState(prev => ({
        ...prev,
        isLiked: vote === true,
        isDisliked: vote === false,
      }));
    } catch (err) {
      console.error('[useDiscussionVote] fetchUserVote', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vote');
    }
  }, [spotId, discussionId, userId]);

  const handleVote = useCallback(
    async (isLike: boolean, currentLikes: number, currentDislikes: number) => {
      if (!spotId || !discussionId || !userId) {
        setError('User must be logged in to vote');
        return;
      }
      setVoteState(prev => ({ ...prev, isVoting: true }));
      setError(null);

      let newLikes = currentLikes;
      let newDislikes = currentDislikes;

      try {
        if ((isLike && voteState.isLiked) || (!isLike && voteState.isDisliked)) {
          await discussionRepository.removeDiscussionVote(spotId, discussionId, userId);
          if (isLike) newLikes = Math.max(0, currentLikes - 1);
          else newDislikes = Math.max(0, currentDislikes - 1);
          setVoteState({ isLiked: false, isDisliked: false, isVoting: false });
        } else {
          await discussionRepository.voteDiscussion(spotId, discussionId, userId, isLike);
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
        console.error('[useDiscussionVote] handleVote', err);
        setError(err instanceof Error ? err.message : 'Failed to vote');
        setVoteState(prev => ({ ...prev, isVoting: false }));
      }
    },
    [spotId, discussionId, userId, voteState, onVoteChange]
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
    if (autoFetch && spotId && discussionId && userId) fetchUserVote();
  }, [autoFetch, spotId, discussionId, userId, fetchUserVote]);

  return { voteState, handleLike, handleDislike, error, refetch: fetchUserVote };
};
