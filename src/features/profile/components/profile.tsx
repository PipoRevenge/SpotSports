import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useProfile } from '../hooks/use-profile';
import { ProfileActionType, ProfileProps } from '../types/profile-types';
import { ProfileHeader } from './profile-header';

/**
 * Componente Profile reutilizable
 * Puede mostrar el perfil propio o de otro usuario
 */
export const Profile: React.FC<ProfileProps> = ({
  userId,
  actionType = ProfileActionType.VIEW_OWN,
  showActions = true,
  showStats = true,
  onNavigateToEdit,
  onNavigateToUser,
  onBack
}) => {
  const { user: currentUser } = useUser();
  
  // Determinar el ID del usuario a mostrar
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  // Usar el hook de perfil
  const { user, isLoading, error, refetch } = useProfile(targetUserId);

  const handleEditPress = () => {
    if (onNavigateToEdit) {
      onNavigateToEdit();
    } else {
      console.log('Navigate to edit profile - no navigation handler provided');
    }
  };

  const handleFollowPress = () => {
    // TODO: Implementar lógica de seguir/no seguir
    console.log('Follow/Unfollow user');
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2">Cargando perfil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Text 
          className="text-blue-500" 
          onPress={handleRefresh}
        >
          Intentar de nuevo
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No se pudo cargar la información del usuario</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
        />
      }
    >
      <VStack className="p-4" space="lg">
        <ProfileHeader
          user={user}
          actionType={actionType}
          onEditPress={showActions ? handleEditPress : undefined}
          onFollowPress={showActions ? handleFollowPress : undefined}
          isOwn={isOwnProfile}
        />

        {/* Sección de spots favoritos */}
        {showStats && user.activity.favoriteSpotsCount > 0 && (
          <View>
            <Text className="text-lg font-bold mb-2">Spots favoritos</Text>
            <Text className="text-gray-500">
              {user.activity.favoriteSpotsCount} spots guardados
            </Text>
            {/* TODO: Mostrar lista de spots favoritos */}
          </View>
        )}

        {/* Sección de actividad reciente */}
        {showStats && user.activity.reviewsCount > 0 && (
          <View>
            <Text className="text-lg font-bold mb-2">Actividad reciente</Text>
            <Text className="text-gray-500">
              {user.activity.reviewsCount} reseñas • {user.activity.commentsCount} comentarios
            </Text>
            {/* TODO: Mostrar lista de actividad reciente */}
          </View>
        )}

        {/* Sección de seguidores */}
        {showStats && (user.activity.followersCount > 0 || user.activity.followingCount > 0) && (
          <View>
            <Text className="text-lg font-bold mb-2">Conexiones</Text>
            <Text className="text-gray-500">
              {user.activity.followersCount} seguidores • {user.activity.followingCount} siguiendo
            </Text>
          </View>
        )}

        {/* Mensaje cuando no hay actividad */}
        {showStats && user.activity.reviewsCount === 0 && user.activity.favoriteSpotsCount === 0 && (
          <View className="mt-8">
            <Text className="text-gray-500 text-center italic">
              {isOwnProfile 
                ? 'Aún no tienes actividad. ¡Empieza explorando spots y dejando reseñas!'
                : 'Este usuario aún no tiene actividad pública.'
              }
            </Text>
          </View>
        )}
      </VStack>
    </ScrollView>
  );
};