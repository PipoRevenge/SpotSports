import { discussionRepository } from '@/src/api/repositories';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUpdateDiscussion } from '@/src/features/discussion';
import { DiscussionForm } from '@/src/features/discussion/components/discussion-create/discussion-form';
import { useSpotDetails } from '@/src/features/spot/hooks/use-spot-details';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscussionEditPage() {
  const { discussionId } = useLocalSearchParams();
  const id = discussionId as string;
  const { updateDiscussion, isUpdating } = useUpdateDiscussion();
  const [discussion, setDiscussion] = useState<any | null>(null);
  const router = useRouter();
  const { showError, showSuccess } = useAppAlert();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await discussionRepository.getDiscussionById(id);
        if (mounted) setDiscussion(d);
      } catch (_err) {
        console.error(_err);
        showError('Cannot load discussion');
      }
    })();
    return () => { mounted = false; };
  }, [id, showError]);

  const handleSubmit = async (payload: { title: string; description?: string; tags?: string[]; media?: any[] }) => {
    try {
      const updated = await updateDiscussion(id, { title: payload.title, description: payload.description, tags: payload.tags }, payload.media);
      showSuccess('Discussion updated');
      const spotIdFromDetails = updated.details?.spotId;
      if (spotIdFromDetails) {
        router.push({ pathname: `/spot/[spotId]/discussion/[discussionId]`, params: { spotId: spotIdFromDetails, discussionId: updated.id } });
      }
    } catch (_err) {
      console.error(_err);
      showError('Failed to update discussion');
    }
  };

  const { sportRatings } = useSpotDetails(discussion?.details?.spotId);

  if (!discussion) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DiscussionForm initialData={discussion} onSubmit={handleSubmit} isSubmitting={isUpdating} spotSports={sportRatings?.map(sr => ({ id: sr.sportId, name: sr.sportName })) ?? []} />
    </SafeAreaView>
  );
}
