import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Icon } from '@/src/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/src/components/ui/menu';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { Edit, LogOut, MoreVertical, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { FollowStatus, ProfileActionType, ProfileHeaderProps } from '../types/profile-types';
import { formatProfileDate } from '../utils/profile-date-utils';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  actionType,
  onEditPress,
  onFollowPress,
  followStatus = FollowStatus.NOT_FOLLOWING,
  isOwn = false,
  menuOptions
  ,onFollowersPress, onFollowingPress
}) => {
  if (!user) {
    return null;
  }

  const renderActionButtons = () => {
    if (actionType === ProfileActionType.VIEW_OWN || isOwn) {
      // Si se proporcionan opciones personalizadas, usarlas
      if (menuOptions && menuOptions.length > 0) {
        return (
          <Menu
            placement="bottom right"
            trigger={({ ...triggerProps }) => {
              return (
                <Button variant="outline" size="sm" {...triggerProps}>
                  <Icon as={MoreVertical} className="color-gray-600" />
                </Button>
              );
            }}
          >
            {menuOptions.map((option) => (
                <MenuItem 
                key={option.key} 
                textValue={option.label} 
                onPress={option.onPress}
                disabled={option.disabled}
              >
                <Icon as={option.icon} size="sm" className="pr-2" />
                <MenuItemLabel size="sm">{option.label}</MenuItemLabel>
              </MenuItem>
            ))}
          </Menu>
        );
      }

      // Menú por defecto si no se proporcionan opciones personalizadas
      return (
        <Menu
          placement="bottom right"
          trigger={({ ...triggerProps }) => {
            return (
              <Button variant="outline" size="sm" {...triggerProps}>
                <Icon as={MoreVertical} className="color-gray-600" />
              </Button>
            );
          }}
        >
            <MenuItem key="edit" textValue="Editar perfil" onPress={onEditPress}>
            <Icon as={Edit} size="sm" className="pr-2" />
            <MenuItemLabel size="sm">Editar perfil</MenuItemLabel>
          </MenuItem>
          <MenuItem key="settings" textValue="Configuración">
            <Icon as={Settings} size="sm" className="pr-2" />
            <MenuItemLabel size="sm">Configuración</MenuItemLabel>
          </MenuItem>
          <MenuItem key="logout" textValue="Cerrar sesión">
            <Icon as={LogOut} size="sm" className="pr-2" />
            <MenuItemLabel size="sm">Cerrar sesión</MenuItemLabel>
          </MenuItem>
        </Menu>
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
    <ScrollView className="">
      
      <View className="justify-end items-end pb-2  top-0 right-0">
        {renderActionButtons()}
      </View>
      {/* Foto de perfil y información básica */}
      <View className="flex-row items-center pb-4">
            <Avatar size="xl" >
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
            <HStack space="md" className="items-center p-4">
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
              <HStack space="lg">
              <Pressable onPress={() => onFollowersPress && onFollowersPress()}>
                <VStack className="items-center">
                  <Text className="font-bold text-lg">{user.activity.followersCount}</Text>
                  <Text className="text-gray-500 text-sm">Seguidores</Text>
                </VStack>
              </Pressable>
              <Pressable onPress={() => onFollowingPress && onFollowingPress()}>
                <VStack className="items-center">
                  <Text className="font-bold text-lg">{user.activity.followingCount}</Text>
                  <Text className="text-gray-500 text-sm">Siguiendo</Text>
                </VStack>
              </Pressable>
              </HStack>
              
            </HStack>
          </VStack>
        </View>
        
      </View>

      
      {/* Biografía */}
      <View className="pb-4">
        <Text className="text-gray-800 font-medium pb-1">Biografía</Text>
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
        <View className="pb-3">
          <Text className="text-gray-800 font-medium pb-1">Teléfono</Text>
          <Text className="text-gray-700">{user.userDetails.phoneNumber}</Text>
        </View>
      )}

      {user.userDetails.birthDate && (
        <View className="pb-3">
          <Text className="text-gray-800 font-medium pb-1">
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
        <View className="pt-2">
          <Text className="text-blue-600 text-sm">✓ Usuario verificado</Text>
        </View>
      )}
    </ScrollView>
  );
};



