
import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Heading } from "@/src/components/ui/heading";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import {
  User, exampleUser
} from "@/src/types/user";
import React, { useState } from "react";
import { View } from "react-native";



export const ProfileView: React.FC = () => {
  const [user] = useState<User>(exampleUser);

  const handleEditPress = () => {
  }

  return (
    <Card className="mb-6 p-4">
      <Heading>
        <View className="w-full flex-row justify-between items-center ">
          <Text size="xl" className="font-bold">
            Perfil
          </Text>
          <Button size="sm" variant="outline" onPress={handleEditPress}>
            <ButtonText>Editar</ButtonText>
          </Button>
        </View>
      </Heading>

      <View className="mt-4">
        {/* Foto de perfil y nombre */}
        <View className="flex-row items-center mb-4">
          <Avatar size="lg" className="mr-4">
            {user?.photoURL ? (
              <AvatarImage source={{ uri: user.photoURL }} />
            ) : (
              <AvatarFallbackText>
                {user?.fullName || user?.username || "Usuario"}
              </AvatarFallbackText>
            )}
          </Avatar>
          <VStack space="xs">
            <Text size="lg" className="font-bold">
              {user?.fullName || "Nombre no disponible"}
            </Text>
            <Text className="text-gray-500">
              @{user?.username || "username"}
            </Text>
            <Text className="text-gray-500">{user?.email}</Text>
          </VStack>
        </View>

        {/* Información adicional */}
        <View className="mt-4">
          <Text className="text-gray-800 font-medium mb-1">Biografía</Text>
          {user?.bio ? (
            <Text className="text-gray-700">{user.bio}</Text>
          ) : (
            <Text className="text-gray-500 italic">
              No hay biografía disponible
            </Text>
          )}
        </View>

        {/* Otros datos */}
        {user?.birthDate && (
          <View className="mt-3">
            <Text className="text-gray-800 font-medium mb-1">
              Fecha de nacimiento
            </Text>
            <Text className="text-gray-700">{user.birthDate}</Text>
          </View>
        )}

        {user?.phoneNumber && (
          <View className="mt-3">
            <Text className="text-gray-800 font-medium mb-1">Teléfono</Text>
            <Text className="text-gray-700">{user.phoneNumber}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

export default ProfileView;