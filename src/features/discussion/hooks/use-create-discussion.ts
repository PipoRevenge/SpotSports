import { discussionRepository, userRepository } from '@/src/api/repositories';
import { MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
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

  const incrementDiscussionCounters = useCallback(async (authorId: string) => {
    try {
      await userRepository.incrementActivityCounters(authorId, { discussionsDelta: 1 });
    } catch (counterError) {
      console.warn('[useCreateDiscussion] Failed to increment discussion counter', counterError);
    }

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
      const dataToCreate = { ...rest, media: [] };
      const discussion = await discussionRepository.createDiscussion(spotId, userId, dataToCreate as any);

      const rawUris = mediaItems.map(m => (typeof m === 'string' ? m : m.uri));
      const localUris = rawUris.filter(uri => uri && !uri.match(/^https?:\/\//));
      const remoteUris = rawUris.filter(uri => uri && uri.match(/^https?:\/\//));

      if (localUris.length > 0) {
        const uploaded = await discussionRepository.uploadDiscussionMedia(spotId, discussion.id, localUris);
        const finalMedia = [...remoteUris, ...uploaded];
        if (finalMedia.length > 0) {
          await discussionRepository.updateDiscussion(discussion.id, { media: finalMedia }, spotId);
          const updated = await discussionRepository.getDiscussionById(discussion.id, spotId);
          return updated;
        }
      }
      return discussion;
    },
    onSuccess: async (newDiscussion, variables) => {
      // Increment counters and update cache
      try {
        await incrementDiscussionCounters(variables.userId);
      } catch (e) {
        console.warn(e);
      }
      // Invalidate or update query cache
      await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'discussions' });
      if (newDiscussion) {
        queryClient.setQueryData(['discussion', newDiscussion.id, variables.discussionData.spotId], newDiscussion);
      }
    },
  });

  return { createDiscussion: (userId: string, discussionData: CreateDiscussionData) => mutation.mutateAsync({ userId, discussionData }), isCreating: mutation.isPending || false, error: (mutation.error as Error | null)?.message ?? null };
}
