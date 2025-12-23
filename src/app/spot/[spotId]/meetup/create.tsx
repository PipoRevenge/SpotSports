import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { CreateMeetupForm } from '@/src/features/meetup/components/forms/create-meetup-form';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function CreateMeetupPage() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Create Meetup', headerBackTitle: 'Spot' }} />
      <CreateMeetupForm spotId={spotId} />
    </SafeAreaView>
  );
}
