import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/context/user-context";
import { ProfileView } from "@/src/features/profile/components/profile-view";
import React from "react";
import { ActivityIndicator } from "react-native";

export default function Profile() {
    const { user, isLoading } = useUser();

    if (isLoading) {
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
        <VStack style={{ flex: 1, padding: 16 }}>
            <ProfileView />
        </VStack>
    );
}
