import { Button, ButtonText } from '@/src/components/ui/button';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { useUser } from '@/src/context/user-context';
import { EditMeetupForm } from '@/src/features/meetup/components/forms/edit-meetup-form';
import { useMeetupDetails } from '@/src/features/meetup/hooks/use-meetup-details';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function EditMeetup() {
  const { spotId, meetupId } = useLocalSearchParams<{ spotId: string; meetupId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { data: meetup, isLoading, error } = useMeetupDetails(spotId, meetupId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">Cargando meetup...</Text>
      </SafeAreaView>
    );
  }

  if (!meetup) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">{typeof error === 'string' ? error : (error as Error)?.message ?? 'Meetup no encontrado'}</Text>
      </SafeAreaView>
    );
  }

  // Solo el organizador puede editar
  if (user?.id !== meetup.organizerId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500 text-center mt-10">You do not have permission to edit this meetup</Text>
        <Button onPress={() => router.back()} className="mt-4 mx-10">
          <ButtonText>Volver</ButtonText>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <Button variant="link" onPress={() => router.back()} className="p-0">
          <ArrowLeftIcon size={24} color="#0f172a" />
        </Button>
        <Text className="text-lg font-semibold text-slate-900 flex-1 text-center mx-4">Editar Meetup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        <EditMeetupForm spotId={spotId} meetup={meetup} onSuccess={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
