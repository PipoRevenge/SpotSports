import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { SpotCreateForm, useSelectedSpot, useUpdateSpot } from '@/src/features/spot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function EditSpotScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const spotId = params.spotId as string | undefined;

  const { selectedSpot, selectSpot, loadingSpot } = useSelectedSpot();
  const { updateSpot, isLoading } = useUpdateSpot() as any;

  useEffect(() => {
    if (spotId) selectSpot(spotId, false);
  }, [spotId, selectSpot]);

  const initialData = useMemo(() => {
    if (!selectedSpot) return undefined;
    const details = selectedSpot.details;
    return {
      name: details.name,
      description: details.description,
      availableSports: details.availableSports || [],
      media: (details.media || []).map((uri: string) => ({ uri, type: 'image' as const })),

      location: details.location,
      contactPhone: details.contactInfo?.phone || '',
      contactEmail: details.contactInfo?.email || '',
      contactWebsite: details.contactInfo?.website || '',
    };
  }, [selectedSpot]);

  const handleCancel = () => router.back();

  const handleSubmitForm = async (formData: any) => {
    if (!spotId) return;
    // Prepare partial SpotDetails (media as string URLs and/or local URIs)
    const payload: any = {
      name: formData.name,
      description: formData.description,
      availableSports: formData.availableSports,
      media: formData.media.map((m: any) => m.uri),
      contactInfo: {
        phone: formData.contactPhone,
        email: formData.contactEmail,
        website: formData.contactWebsite,
      }
    };

    await updateSpot(spotId, payload);

    // Navigate back to spot page
    router.push(`/spot/${spotId}`);
  };

  if (loadingSpot || !initialData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="pt-4 text-gray-600">Loading spot details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SpotCreateForm
        initialData={initialData}
        initialLocation={initialData.location}
        onCancel={handleCancel}
        onSubmitForm={handleSubmitForm}
        externalLoading={isLoading}
      />
    </SafeAreaView>
  );
}
