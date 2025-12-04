export { useVote } from '@/src/hooks/use-vote';
import { voteRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { VoteResourceType } from '@/src/entities/vote/model/vote';
import { useCallback, useEffect, useState } from 'react';

export interface VoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

export const useVote = (
  resourceType: VoteResourceType,
  resourceId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  const { user } = useUser();
  const userId = user?.id;

  const [voteState, setVoteState] = useState<VoteState>({ isLiked: false, isDisliked: false, isVoting: false });
  const [error, setError] = useState<string | null>(null);

  const fetchUserVote = useCallback(async () => {
    if (!resourceId || !userId) return;
    try {
      const vote = await voteRepository.getUserVote(resourceType, resourceId, userId);
      setVoteState(prev => ({ ...prev, isLiked: vote === true, isDisliked: vote === false }));
    } catch (err) {
      console.error('[useVote] fetchUserVote', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vote');
    }
  }, [resourceType, resourceId, userId]);

  const handleVote = useCallback(async (isLike: boolean, currentLikes: number, currentDislikes: number) => {
    if (!resourceId || !userId) {
      setError('User must be logged in to vote');
      return;
    }
    setVoteState(prev => ({ ...prev, isVoting: true }));
    setError(null);

    let newLikes = currentLikes;
    let newDislikes = currentDislikes;

    try {
      if ((isLike && voteState.isLiked) || (!isLike && voteState.isDisliked)) {
        await voteRepository.removeVote(resourceType, resourceId, userId);
        if (isLike) newLikes = Math.max(0, currentLikes - 1);
        else newDislikes = Math.max(0, currentDislikes - 1);
        setVoteState({ isLiked: false, isDisliked: false, isVoting: false });
      } else {
        await voteRepository.vote(resourceType, resourceId, userId, isLike);
        if (isLike) {
          newLikes = currentLikes + 1;
          if (voteState.isDisliked) newDislikes = Math.max(0, currentDislikes - 1);
        } else {
          newDislikes = currentDislikes + 1;
          if (voteState.isLiked) newLikes = Math.max(0, currentLikes - 1);
        }
        setVoteState({ isLiked: isLike, isDisliked: !isLike, isVoting: false });
      }
      if (onVoteChange) onVoteChange(newLikes, newDislikes);
    } catch (err) {
      console.error('[useVote] handleVote', err);
      setError(err instanceof Error ? err.message : 'Failed to vote');
      setVoteState(prev => ({ ...prev, isVoting: false }));
    }
  }, [resourceType, resourceId, userId, voteState, onVoteChange]);

  const handleLike = useCallback((currentLikes: number, currentDislikes: number) => handleVote(true, currentLikes, currentDislikes), [handleVote]);
  const handleDislike = useCallback((currentLikes: number, currentDislikes: number) => handleVote(false, currentLikes, currentDislikes), [handleVote]);

  useEffect(() => {
    if (autoFetch && resourceId && userId) fetchUserVote();
  }, [autoFetch, resourceId, userId, fetchUserVote]);

  return { voteState, handleLike, handleDislike, error, refetch: fetchUserVote };
};
