import { useAppAlert } from "@/src/context/app-alert-context";
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
      router.push(`/discussion/${newDiscussion.id}`);
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
