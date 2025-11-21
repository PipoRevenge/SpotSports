import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { SignOut } from '@/src/features/auth';
import { UserReviewList } from '@/src/features/review';
import { ProfileActivityTabs, ProfileHeader } from '@/src/features/user';
import { useProfile } from '@/src/features/user/hooks/use-profile';
import { MenuOption, ProfileActionType } from '@/src/features/user/types/profile-types';
import { router } from "expo-router";
import { Edit, LogOut } from 'lucide-react-native';
import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';

export default function MyProfile() {
    const { user: currentUser } = useUser();
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    
    // Usar el hook de perfil
    const { user, isLoading, error, refetch } = useProfile(currentUser?.id);

    const handleEditPress = () => {
        router.push('/profile/profile-edit');
    };

    const handleLogout = () => {
        setShowSignOutDialog(true);
    };

    const handleCloseSignOutDialog = () => {
        setShowSignOutDialog(false);
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

    // Opciones del menú personalizadas
    const menuOptions: MenuOption[] = [
        {
            key: 'edit',
            label: 'Editar perfil',
            icon: Edit,
            onPress: handleEditPress
        },
        {
            key: 'logout',
            label: 'Cerrar sesión',
            icon: LogOut,
            onPress: handleLogout
        }
    ];

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
                    actionType={ProfileActionType.VIEW_OWN}
                    onEditPress={handleEditPress}
                    isOwn={true}
                    menuOptions={menuOptions}
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
                                            }
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
                            Aún no tienes actividad. ¡Empieza explorando spots y dejando reseñas!
                        </Text>
                    </View>
                )}

                {/* Aquí puedes agregar más secciones específicas de tu perfil */}
                {/* Por ejemplo: configuraciones, estadísticas adicionales, etc. */}
            </VStack>
            
            {/* Diálogo de confirmación para cerrar sesión */}
            <SignOut
                isOpen={showSignOutDialog}
                onClose={handleCloseSignOutDialog}
                showTrigger={false}
                onSignOutComplete={() => router.replace('/auth/authentication')}
            />
        </ScrollView>
    );
}
