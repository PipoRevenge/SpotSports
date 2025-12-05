import { discussionRepository } from '@/src/api/repositories';
import { MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
import { useCallback, useState } from 'react';

export function useUpdateDiscussion() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDiscussion = useCallback(async (discussionId: string, updates: any, mediaItems?: MediaItem[]) => {
    setIsUpdating(true);
    setError(null);
    try {
      let finalUpdates = { ...updates };
      if (mediaItems && mediaItems.length > 0) {
        const rawUris = mediaItems.map(m => (typeof m === 'string' ? m : m.uri));
        console.log('[useUpdateDiscussion] media upload rawUris', rawUris);
        const localUris = rawUris.filter(uri => uri && !uri.match(/^https?:\/\//));
        const remoteUris = rawUris.filter(uri => uri && uri.match(/^https?:\/\//));

        if (localUris.length > 0) {
          // Get the discussion to get spotId for upload
          const current = await discussionRepository.getDiscussionById(discussionId);
          const uploaded = await discussionRepository.uploadDiscussionMedia(
            current?.details.spotId || '', 
            discussionId, 
            localUris
          );
          const finalMedia = [...remoteUris, ...uploaded];
          finalUpdates.media = finalMedia;
        } else {
          finalUpdates.media = [...remoteUris];
        }
      }

      console.log('[useUpdateDiscussion] update payload', { discussionId, finalUpdates });
      // spotId is optional - will be resolved internally if not provided
      const updated = await discussionRepository.updateDiscussion(discussionId, finalUpdates);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update discussion');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { updateDiscussion, isUpdating, error };
}
