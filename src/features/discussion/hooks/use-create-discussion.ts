import { discussionRepository } from '@/src/api/repositories';
import { MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
import { useCallback, useState } from 'react';

export function useCreateDiscussion() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDiscussion = useCallback(async (userId: string, discussionData: any) => {
    setIsCreating(true);
    setError(null);
    try {
      // Extract media items (MediaItem[] or string[])
      const mediaItems: MediaItem[] = discussionData.media || [];
      // Create discussion without media first
      const dataToCreate = { ...discussionData, media: [] };
      console.log('[useCreateDiscussion] createDiscussion payload', { userId, dataToCreate });
      const discussion = await discussionRepository.createDiscussion(userId, dataToCreate as any);

      // If there are local media URIs, upload them and then update the discussion
      const rawUris = mediaItems.map(m => (typeof m === 'string' ? m : m.uri));

      const localUris = rawUris.filter(uri => uri && !uri.match(/^https?:\/\//));
      const remoteUris = rawUris.filter(uri => uri && uri.match(/^https?:\/\//));

      if (localUris.length > 0) {
        console.log('[useCreateDiscussion] uploading localUris', localUris);
        const uploaded = await discussionRepository.uploadDiscussionMedia(discussion.details.spotId, discussion.id, localUris);
        const finalMedia = [...remoteUris, ...uploaded];
        if (finalMedia.length > 0) {
          console.log('[useCreateDiscussion] updating discussion with media', finalMedia);
          await discussionRepository.updateDiscussion(discussion.id, { media: finalMedia });
          const updated = await discussionRepository.getDiscussionById(discussion.id);
          return updated;
        }
      }

      return discussion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discussion');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createDiscussion, isCreating, error };
}
