import { discussionRepository, userRepository } from '@/src/api/repositories';
import { useQuery, useQueryClient } from '@/src/lib/react-query';

export function useDiscussionDetails(discussionId?: string, spotId?: string) {
  const queryClient = useQueryClient();

  const discussionQuery = useQuery({
    queryKey: ['discussion', discussionId, spotId],
    queryFn: async () => {
      if (!discussionId) return null;
      const d = await discussionRepository.getDiscussionById(discussionId, spotId);
      return d;
    },
    enabled: !!discussionId,
  });

  const authorId = discussionQuery.data?.metadata?.createdBy;

  const authorQuery = useQuery({
    queryKey: ['user', authorId],
    queryFn: async () => {
      if (!authorId) return null;
      const u = await userRepository.getUserById(authorId);
      return u;
    },
    enabled: !!authorId,
  });

  return {
    discussion: discussionQuery.data ?? null,
    author: authorQuery.data ?? null,
    loading: discussionQuery.isLoading || authorQuery.isLoading,
    error: discussionQuery.isError ? (discussionQuery.error as Error)?.message : (authorQuery.isError ? (authorQuery.error as Error)?.message : null),
    refresh: () => discussionQuery.refetch(),
  };
}
