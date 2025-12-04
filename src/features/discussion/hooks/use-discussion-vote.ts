import { useVote } from '@/src/hooks/use-vote';

export interface DiscussionVoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

export const useDiscussionVote = (
  discussionId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  const res = useVote('discussion', discussionId, onVoteChange, autoFetch);
  return res;
};
