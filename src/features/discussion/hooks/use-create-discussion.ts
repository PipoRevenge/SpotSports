import { discussionRepository, userRepository } from '@/src/api/repositories';
import { MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
import { useUser } from '@/src/context/user-context';
import { useCallback, useState } from 'react';

interface CreateDiscussionData {
  spotId: string;
  title: string;
  description?: string;
  tags?: string[];
  media?: MediaItem[];
}

export function useCreateDiscussion() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser } = useUser();

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

  const createDiscussion = useCallback(async (userId: string, discussionData: CreateDiscussionData) => {
    setIsCreating(true);
    setError(null);
    try {
      const { spotId, media: mediaItems = [], ...rest } = discussionData;
      
      // Create discussion without media first
      const dataToCreate = { ...rest, media: [] };
      console.log('[useCreateDiscussion] createDiscussion payload', { userId, spotId, dataToCreate });
      const discussion = await discussionRepository.createDiscussion(spotId, userId, dataToCreate as any);

      // If there are local media URIs, upload them and then update the discussion
      const rawUris = mediaItems.map(m => (typeof m === 'string' ? m : m.uri));
      const localUris = rawUris.filter(uri => uri && !uri.match(/^https?:\/\//));
      const remoteUris = rawUris.filter(uri => uri && uri.match(/^https?:\/\//));

      if (localUris.length > 0) {
        console.log('[useCreateDiscussion] uploading localUris', localUris);
        const uploaded = await discussionRepository.uploadDiscussionMedia(spotId, discussion.id, localUris);
        const finalMedia = [...remoteUris, ...uploaded];
        if (finalMedia.length > 0) {
          console.log('[useCreateDiscussion] updating discussion with media', finalMedia);
          await discussionRepository.updateDiscussion(discussion.id, { media: finalMedia }, spotId);
            const updated = await discussionRepository.getDiscussionById(discussion.id, spotId);
            await incrementDiscussionCounters(userId);
            return updated;
        }
      }
      await incrementDiscussionCounters(userId);

      return discussion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discussion');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [incrementDiscussionCounters]);

  return { createDiscussion, isCreating, error };
}
