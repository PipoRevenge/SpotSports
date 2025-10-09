import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import React from 'react';
import { FollowStatus, ProfileActionType, ProfileHeaderProps } from '../types/profile-types';
import { formatProfileDate } from '../utils/profile-date-utils';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  actionType,
  onEditPress,
  onFollowPress,
  followStatus = FollowStatus.NOT_FOLLOWING,
  isOwn = false
}) => {
  if (!user) {
    return null;
  }

  const renderActionButtons = () => {
    if (actionType === ProfileActionType.VIEW_OWN || isOwn) {
      return (
        <Button variant="outline" size="sm" onPress={onEditPress}>
          <ButtonText>Editar perfil</ButtonText>
        </Button>
      );
    }

    if (actionType === ProfileActionType.VIEW_OTHER && onFollowPress) {
      const getFollowButtonText = () => {
        switch (followStatus) {
          case FollowStatus.FOLLOWING:
            return 'Siguiendo';
          case FollowStatus.BLOCKED:
            return 'Bloqueado';
          default:
            return 'Seguir';
        }
      };

      const getFollowButtonVariant = () => {
        switch (followStatus) {
          case FollowStatus.FOLLOWING:
            return 'solid';
          case FollowStatus.BLOCKED:
            return 'outline';
          default:
            return 'solid';
        }
      };

      return (
        <Button 
          variant={getFollowButtonVariant()} 
          size="sm" 
          onPress={onFollowPress}
          disabled={followStatus === FollowStatus.BLOCKED}
        >
          <ButtonText>{getFollowButtonText()}</ButtonText>
        </Button>
      );
    }

    return null;
  };

  return (
    <View className="mt-4">
      {/* Foto de perfil y información básica */}
      <View className="flex-row items-center mb-4">
        <Avatar size="lg" className="mr-4">
          {user.userDetails.photoURL ? (
            <AvatarImage source={{ uri: user.userDetails.photoURL }} />
          ) : (
            <AvatarFallbackText>
              {user.userDetails.fullName || user.userDetails.userName || "Usuario"}
            </AvatarFallbackText>
          )}
        </Avatar>
        
        <View className="flex-1">
          <VStack space="xs">
            <HStack className="items-center justify-between">
              <VStack space="xs" className="flex-1">
                <Text size="lg" className="font-bold">
                  {user.userDetails.fullName || "Nombre no disponible"}
                </Text>
                <Text className="text-gray-500">
                  @{user.userDetails.userName || "userName"}
                </Text>
                {!isOwn && (
                  <Text className="text-gray-500">{user.userDetails.email}</Text>
                )}
              </VStack>
              {renderActionButtons()}
            </HStack>
          </VStack>
        </View>
      </View>

      {/* Estadísticas del usuario */}
      <HStack className="mb-4" space="lg">
        <VStack className="items-center">
          <Text className="font-bold text-lg">{user.activity.reviewsCount}</Text>
          <Text className="text-gray-500 text-sm">Reseñas</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="font-bold text-lg">{user.activity.favoriteSpotsCount}</Text>
          <Text className="text-gray-500 text-sm">Spots favoritos</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="font-bold text-lg">{user.activity.followersCount}</Text>
          <Text className="text-gray-500 text-sm">Seguidores</Text>
        </VStack>
        <VStack className="items-center">
          <Text className="font-bold text-lg">{user.activity.followingCount}</Text>
          <Text className="text-gray-500 text-sm">Siguiendo</Text>
        </VStack>
      </HStack>

      {/* Biografía */}
      <View className="mb-4">
        <Text className="text-gray-800 font-medium mb-1">Biografía</Text>
        {user.userDetails.bio ? (
          <Text className="text-gray-700">{user.userDetails.bio}</Text>
        ) : (
          <Text className="text-gray-500 italic">
            {isOwn ? 'Agrega una biografía para contarle a otros sobre ti' : 'Sin biografía'}
          </Text>
        )}
      </View>

      {/* Información adicional */}
      {isOwn && user.userDetails.phoneNumber && (
        <View className="mb-3">
          <Text className="text-gray-800 font-medium mb-1">Teléfono</Text>
          <Text className="text-gray-700">{user.userDetails.phoneNumber}</Text>
        </View>
      )}

      {user.userDetails.birthDate && (
        <View className="mb-3">
          <Text className="text-gray-800 font-medium mb-1">
            {isOwn ? 'Fecha de nacimiento' : 'Edad'}
          </Text>
          <Text className="text-gray-700">
            {isOwn 
              ? formatProfileDate(user.userDetails.birthDate)
              : `${new Date().getFullYear() - user.userDetails.birthDate.getFullYear()} años`
            }
          </Text>
        </View>
      )}

      {user.metadata.isVerified && (
        <View className="mt-2">
          <Text className="text-blue-600 text-sm">✓ Usuario verificado</Text>
        </View>
      )}
    </View>
  );
};



