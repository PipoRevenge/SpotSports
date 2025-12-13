import { discussionRepository } from '@/src/api/repositories';
import { MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
import { useMutation, useQueryClient } from '@/src/lib/react-query';

export function useUpdateDiscussion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ discussionId, updates, mediaItems }: { discussionId: string; updates: any; mediaItems?: MediaItem[] }) => {
      let finalUpdates = { ...updates };
      if (mediaItems && mediaItems.length > 0) {
        const rawUris = mediaItems.map(m => (typeof m === 'string' ? m : m.uri));
        const localUris = rawUris.filter(uri => uri && !uri.match(/^https?:\/\//));
        const remoteUris = rawUris.filter(uri => uri && uri.match(/^https?:\/\//));

        if (localUris.length > 0) {
          const current = await discussionRepository.getDiscussionById(discussionId);
          const uploaded = await discussionRepository.uploadDiscussionMedia(current?.details.spotId || '', discussionId, localUris);
          const finalMedia = [...remoteUris, ...uploaded];
          finalUpdates.media = finalMedia;
        } else {
          finalUpdates.media = [...remoteUris];
        }
      }

      const updated = await discussionRepository.updateDiscussion(discussionId, finalUpdates);
      return updated;
    },
    onSuccess: async (updated) => {
      // Update discussion cache and invalidate relevant lists
      if (updated) {
        queryClient.setQueryData(['discussion', updated.id, updated.details.spotId], updated);
      }
      await queryClient.invalidateQueries({ predicate: q => Array.isArray(q.queryKey) && (q.queryKey[0] === 'discussions' || q.queryKey[0] === 'discussion') });
    }
  });

  return { updateDiscussion: (discussionId: string, updates: any, mediaItems?: MediaItem[]) => mutation.mutateAsync({ discussionId, updates, mediaItems }), isUpdating: mutation.isPending || false, error: (mutation.error as Error | null)?.message ?? null };
}
