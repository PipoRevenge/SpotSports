import { useAppAlert } from "@/src/context/app-alert-context";
import { useSelectedSpot } from '@/src/context/selected-spot-context';
import { useUser } from "@/src/context/user-context";
import { useCreateDiscussion } from "@/src/features/discussion";
import { DiscussionForm } from "@/src/features/discussion/components/discussion-create/discussion-form";
import { useSpotDetails } from "@/src/features/spot/hooks/use-spot-details";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiscussionCreatePage() {
  const { user } = useUser();
  const { createDiscussion, isCreating } = useCreateDiscussion();
  const router = useRouter();
  const params = useLocalSearchParams();
  const spotId = params.spotId as string | undefined;
  const { sportRatings } = useSpotDetails(spotId);
  const { showSuccess, showError } = useAppAlert();
  const { bumpDiscussionRefresh } = useSelectedSpot();

  const handleSubmit = async (payload: {
    title: string;
    description?: string;
    tags?: string[];
    media?: any[];
  }) => {
    if (!user?.id) {
      showError("You must be logged in to create a discussion");
      return;
    }

    if (!spotId) {
      showError("Spot ID is required to create a discussion");
      return;
    }

    try {
      const newDiscussion = await createDiscussion(user.id, {
        ...payload,
        spotId,
      });
      if (!newDiscussion) {
        showError("Failed to create discussion");
        return;
      }
      showSuccess("Discussion created");
      // Navigate to the nested spot discussion route
      const targetSpotId = spotId || newDiscussion.details?.spotId;
      if (targetSpotId) {
        // Replace the create route so back goes to the spot page, not back to the create page
        // Also bump the discussion refresh counter so any lists update
        try {
          bumpDiscussionRefresh();
        } catch {
          // ignore if context not available
        }
        router.replace({ pathname: `/spot/[spotId]/discussion/[discussionId]`, params: { spotId: targetSpotId, discussionId: newDiscussion.id } });
      }
    } catch {
      showError("Error creating discussion");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DiscussionForm
        onSubmit={handleSubmit}
        isSubmitting={isCreating}
        spotSports={
          sportRatings?.map((sr) => ({ id: sr.sportId, name: sr.sportName })) ??
          []
        }
      />
    </SafeAreaView>
  );
}
