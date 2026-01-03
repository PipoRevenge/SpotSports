import { discussionRepository } from '@/src/api/repositories';
import { MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
import { useSelectedSpot } from '@/src/context/selected-spot-context';
import { useUser } from '@/src/context/user-context';
import { useMutation, useQueryClient } from '@/src/lib/react-query';
import { useCallback } from 'react';

interface CreateDiscussionData {
  spotId: string;
  title: string;
  description?: string;
  tags?: string[];
  media?: MediaItem[];
}

export function useCreateDiscussion() {
  const { user, setUser } = useUser();
  const queryClient = useQueryClient();
  const { bumpDiscussionRefresh } = useSelectedSpot();

  const updateLocalUserCounters = useCallback((authorId: string) => {
    if (user?.id === authorId) {
      setUser({
        ...user,
        activity: {
          ...user.activity,
          discussionsCount: (user.activity.discussionsCount || 0) + 1,
        },
      });
    }
  }, [setUser, user]);

  const mutation = useMutation({
    mutationFn: async ({ userId, discussionData }: { userId: string; discussionData: CreateDiscussionData }) => {
      const { spotId, media: mediaItems = [], ...rest } = discussionData;
      
      // Convert MediaItems to strings (uris)
      const mediaUris = mediaItems.map(m => (typeof m === 'string' ? m : m.uri));
      
      const dataToCreate = { 
        ...rest, 
        media: mediaUris 
      };
      
      // Repository handles upload and creation in one step (with rollback on failure)
      const discussion = await discussionRepository.createDiscussion(spotId, userId, dataToCreate as any);
      return discussion;
    },
    onSuccess: async (newDiscussion, variables) => {
      // Update local user counters (optimistic)
      updateLocalUserCounters(variables.userId);

      // The spot discussions counter is updated inside the repository transaction
      // Update counters cache to reflect the new value immediately
      try {
        queryClient.setQueryData(['spot', variables.discussionData.spotId, 'counters'], (old: any) => {
          if (!old) return old;
          return { ...old, discussionsCount: (old.discussionsCount || 0) + 1 };
        });

        // Update full spot in cache if available
        queryClient.setQueryData<any>(['spot', variables.discussionData.spotId], (old: any) => {
          if (!old) return old;
          return { ...old, activity: { ...old.activity, discussionsCount: (old.activity?.discussionsCount || 0) + 1 } };
        });
      } catch (cacheErr) {
        console.warn('[useCreateDiscussion] Failed to update cache for spot discussionsCount', cacheErr);
      }

      // Invalidate or update query cache
      await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussions' });
      if (newDiscussion) {
        queryClient.setQueryData(['discussion', newDiscussion.id, variables.discussionData.spotId], newDiscussion);
      }
      
      // Bump discussion refresh counter to notify UI components
      bumpDiscussionRefresh();
    },
  });

  return { createDiscussion: (userId: string, discussionData: CreateDiscussionData) => mutation.mutateAsync({ userId, discussionData }), isCreating: mutation.isPending || false, error: (mutation.error as Error | null)?.message ?? null };
}
