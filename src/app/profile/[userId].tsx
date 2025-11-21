import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { UserReviewList } from '@/src/features/review';
import { ProfileActivityTabs, ProfileHeader } from '@/src/features/user';
import { useProfile } from '@/src/features/user/hooks/use-profile';
import { ProfileActionType } from '@/src/features/user/types/profile-types';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';

export default function UserProfile() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const { user: currentUser } = useUser();
    
    // Redirigir a my-profile si es el mismo usuario
    useEffect(() => {
        if (currentUser && userId === currentUser.id) {
            router.push('/home-tabs/my-profile');
        }
    }, [userId, currentUser]);
    
    // Usar el hook de perfil
    const { user, isLoading, error, refetch } = useProfile(userId);



    const handleFollowPress = () => {
        // TODO: Implementar lógica de seguir/no seguir
        console.log('Follow/Unfollow user');
    };


    const handleRefresh = () => {
        refetch();
    };

    const handleNavigateToProfile = (userIdToNavigate: string) => {
        if (!userIdToNavigate) return;
        if (userIdToNavigate === currentUser?.id) {
            router.push('/home-tabs/my-profile');
        } else {
            router.push(`/profile/${userIdToNavigate}`);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="pt-2">Cargando perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center px-4">
                <Text className="text-red-500 text-center pb-4">{error}</Text>
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
                    actionType={ProfileActionType.VIEW_OTHER}
                    onFollowPress={handleFollowPress}
                    isOwn={false}
                />

                {/* Activity tabs */}
                <ProfileActivityTabs
                    user={user}
                    userId={user?.id}
                    reviewsSlot={(
                        <UserReviewList
                            userId={user?.id}
                            profileUser={user}
                            onNavigateToProfile={handleNavigateToProfile}
                            onNavigateToSpot={(spotId) => { if (spotId) router.push(`/spot/${spotId}`); }}
                            onEdit={(reviewId, spotId, spotSports) => {
                                if (!spotId) return;
                                router.push({
                                    pathname: `/spot/review/[spotId]/edit-review`,
                                    params: {
                                        spotId,
                                        spotSports: spotSports ? JSON.stringify(spotSports) : JSON.stringify([]),
                                    },
                                });
                            }}
                        />
                    )}
                />

                {/* Sección de spots favoritos */}
                {user.activity.favoriteSpotsCount > 0 && (
                    <View>
                        <Text className="text-lg font-bold pb-2">Spots favoritos</Text>
                        <Text className="text-gray-500">
                            {user.activity.favoriteSpotsCount} spots guardados
                        </Text>
                        {/* TODO: Mostrar lista de spots favoritos */}
                        {/* Aquí puedes integrar componentes de la feature de spots */}
                    </View>
                )}

                {/* Sección de actividad reciente */}
                {user.activity.reviewsCount > 0 && (
                    <View>
                        <Text className="text-lg font-bold pb-2">Actividad reciente</Text>
                        <Text className="text-gray-500">
                            {user.activity.reviewsCount} reseñas • {user.activity.commentsCount} comentarios
                        </Text>
                        {/* TODO: Mostrar lista de actividad reciente */}
                        {/* Aquí puedes integrar componentes de la feature de reviews */}
                    </View>
                )}

                {/* Sección de seguidores */}
                {(user.activity.followersCount > 0 || user.activity.followingCount > 0) && (
                    <View>
                        <Text className="text-lg font-bold pb-2">Conexiones</Text>
                        <Text className="text-gray-500">
                            {user.activity.followersCount} seguidores • {user.activity.followingCount} siguiendo
                        </Text>
                        {/* Aquí puedes integrar componentes de la feature de follows */}
                    </View>
                )}

                {/* Mensaje cuando no hay actividad */}
                {user.activity.reviewsCount === 0 && user.activity.favoriteSpotsCount === 0 && (
                    <View className="pt-8">
                        <Text className="text-gray-500 text-center italic">
                            Este usuario aún no tiene actividad pública.
                        </Text>
                    </View>
                )}

                {/* Aquí puedes agregar secciones específicas para perfiles de otros usuarios */}
                {/* Por ejemplo: mutual friends, shared spots, etc. */}
            </VStack>
        </ScrollView>
    );
}