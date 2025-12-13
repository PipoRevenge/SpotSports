import { userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { useMutation, useQuery, useQueryClient } from '@/src/lib/react-query';

export const useFollow = (targetUserId?: string) => {
  const { user: currentUser, emitFollowEvent } = useUser();
  const queryClient = useQueryClient();

  const followQuery = useQuery({
    queryKey: ['isFollowing', currentUser?.id, targetUserId],
    queryFn: async () => {
      if (!currentUser || !targetUserId) return false;
      return await userRepository.isFollowing(currentUser.id, targetUserId);
    },
    enabled: !!currentUser && !!targetUserId,
  });

  const mutation = useMutation({
    mutationFn: async (follow: boolean) => {
      if (!currentUser || !targetUserId) throw new Error('Missing user or target');
      if (follow) return await userRepository.followUser(currentUser.id, targetUserId);
      return await userRepository.unfollowUser(currentUser.id, targetUserId);
    },
    onMutate: async (follow: boolean) => {
      // optimistic update
      const previous = queryClient.getQueryData(['isFollowing', currentUser?.id, targetUserId]);
      queryClient.setQueryData(['isFollowing', currentUser?.id, targetUserId], follow);
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['isFollowing', currentUser?.id, targetUserId], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey[0] === 'isFollowing' || q.queryKey[0] === 'followers' || q.queryKey[0] === 'following') });
      if (typeof emitFollowEvent === 'function' && currentUser && targetUserId) {
          emitFollowEvent({ targetUserId, followerId: currentUser.id, isFollowing: !!vars });
        }
    }
  });

  const toggleFollow = async () => {
    if (!currentUser || !targetUserId) return undefined;
    const currently = followQuery.data as boolean | undefined;
    await mutation.mutateAsync(!currently);
    return !currently;
  };

  return { isFollowing: followQuery.data ?? false, isLoading: followQuery.isLoading || mutation.isPending || false, error: followQuery.isError ? (followQuery.error as Error)?.message : null, toggleFollow };
};
