import { discussionRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { useMutation, useQueryClient } from '@/src/lib/react-query';
import { useCallback } from 'react';

export function useDeleteDiscussion() {
  const queryClient = useQueryClient();
  const { user, setUser } = useUser();

  const updateLocalUserCounters = useCallback((authorId: string) => {
    if (user?.id === authorId) {
      setUser({
        ...user,
        activity: {
          ...user.activity,
          discussionsCount: Math.max((user.activity.discussionsCount || 0) - 1, 0),
        },
      });
    }
  }, [setUser, user]);

  const mutation = useMutation({
    mutationFn: async ({ discussionId, spotId }: { discussionId: string; spotId: string }) => {
      await discussionRepository.deleteDiscussion(discussionId, spotId);
    },
    onSuccess: async (_, variables) => {
      // Update local user counters (optimistic)
      if (user?.id) {
        updateLocalUserCounters(user.id);
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && (q.queryKey[0] === 'discussions' || q.queryKey[0] === 'discussion') 
      });
      
      // Update spot counters in cache if possible
      try {
        queryClient.setQueryData(['spot', variables.spotId, 'counters'], (old: any) => {
          if (!old) return old;
          return { ...old, discussionsCount: Math.max((old.discussionsCount || 0) - 1, 0) };
        });
      } catch (e) {
        console.warn(e);
      }
    }
  });

  return { 
    deleteDiscussion: (discussionId: string, spotId: string) => mutation.mutateAsync({ discussionId, spotId }), 
    isDeleting: mutation.isPending, 
    error: (mutation.error as Error | null)?.message ?? null 
  };
}
