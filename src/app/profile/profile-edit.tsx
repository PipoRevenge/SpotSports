import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { ProfileEditForm } from '@/src/features/profile/components/profile-edit-form';
import { useUpdateProfile } from '@/src/features/profile/hooks/use-update-profile';
import { UserDetails } from '@/src/types/user';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert } from 'react-native';

export default function EditProfile() {
  const { user, isLoading: userLoading } = useUser();
  
  const { updateProfile } = useUpdateProfile({
    onSuccess: () => {
      Alert.alert(
        'Perfil actualizado',
        'Tu perfil ha sido actualizado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (errorMessage) => {
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    },
  });

  const handleSubmit = async (userData: Partial<UserDetails>) => {
    try {
      await updateProfile(userData);
    } catch (error) {
      // El error ya se maneja en el hook y se muestra en la alerta
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (userLoading) {
    return (
      <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Cargando perfil...</Text>
      </VStack>
    );
  }

  if (!user) {
    return (
      <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No se pudo cargar la información del usuario</Text>
      </VStack>
    );
  }

  return (
    <VStack style={{ flex: 1 }}>
      <ProfileEditForm
        user={user.userDetails}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </VStack>
  );
}