import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Heading } from "@/src/components/ui/heading";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/context/user-context";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useProfileActions } from "../hooks/use-profile-actions";

export const ProfileView: React.FC = () => {
  const { user } = useUser();
  const { signOut, isSigningOut } = useProfileActions();

  const handleEditPress = () => {
    router.push('/profile/profile-edit');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-6 p-4">
      <Heading>
        <View className="w-full flex-row justify-between items-center ">
          <Text size="xl" className="font-bold">
            Perfil
          </Text>
          <HStack space="sm">
            <Button size="sm" variant="outline" onPress={handleEditPress}>
              <ButtonText>Editar</ButtonText>
            </Button>
            <Button 
              size="sm" 
              variant="solid" 
              action="negative"
              onPress={handleSignOut}
              isDisabled={isSigningOut}
              testID="profile-sign-out-button"
            >
              <ButtonText>{isSigningOut ? "Cerrando..." : "Cerrar Sesión"}</ButtonText>
            </Button>
          </HStack>
        </View>
      </Heading>

      <View className="mt-4">
        {/* Foto de perfil y nombre */}
        <View className="flex-row items-center mb-4">
          <Avatar size="lg" className="mr-4">
            {user.userDetails.fullName && user.userDetails.photoURL ? (
              <AvatarImage source={{ uri: user.userDetails.photoURL }} />
            ) : (
              <AvatarFallbackText>
                {user?.userDetails.fullName || user?.userDetails.userName || "Usuario"}
              </AvatarFallbackText>
            )}
          </Avatar>
          <VStack space="xs">
            <Text size="lg" className="font-bold">
              {user?.userDetails.fullName || "Nombre no disponible"}
            </Text>
            <Text className="text-gray-500">
              @{user?.userDetails.userName || "userName"}
            </Text>
            <Text className="text-gray-500">{user.userDetails.email}</Text>
          </VStack>
        </View>

        {/* Información adicional */}
        <View className="mt-4">
          <Text className="text-gray-800 font-medium mb-1">Biografía</Text>
          {user.userDetails.bio ? (
            <Text className="text-gray-700">{user.userDetails .bio}</Text>
          ) : (
            <Text className="text-gray-500 italic">
              No hay biografía disponible
            </Text>
          )}
        </View>

        {/* Otros datos */}
        {user?.userDetails.birthDate && (
          <View className="mt-3">
            <Text className="text-gray-800 font-medium mb-1">
              Fecha de nacimiento
            </Text>
            <Text className="text-gray-700">{user.userDetails.birthDate}</Text>
          </View>
        )}

        {user.userDetails.phoneNumber && (
          <View className="mt-3">
            <Text className="text-gray-800 font-medium mb-1">Teléfono</Text>
            <Text className="text-gray-700">{user.userDetails.phoneNumber}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

export default ProfileView;