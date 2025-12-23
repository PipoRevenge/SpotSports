import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { SignOut } from '@/src/features/auth';
import { UserCommentList } from '@/src/features/comment';
import { ProfileDiscussionList } from '@/src/features/discussion';
import { ProfileMeetupsList } from '@/src/features/meetup/components/profile-meetups/profile-meetups-list';
import { ProfileReviewList } from '@/src/features/review';
import { ProfileActivityTabs, ProfileHeader } from '@/src/features/user';
import { useProfile } from '@/src/features/user/hooks/use-profile';
import { MenuOption, ProfileActionType } from '@/src/features/user/types/profile-types';
import { useAllSportsMap } from '@/src/hooks/use-sports';
import { router } from "expo-router";
import { Edit, LogOut } from 'lucide-react-native';
import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';

export default function MyProfile() {
    const { user: currentUser } = useUser();
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    
    // Usar el hook de perfil
    const { user, isLoading, error, refetch } = useProfile(currentUser?.id);

    // Cargar nombres de deportes para pasar al componente de reviews
    const { getSportName } = useAllSportsMap();

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

    const handleFollowersPress = () => {
        if (!user?.id) return;
        router.push(`/profile/${user.id}/followers`);
    };

    const handleFollowingPress = () => {
        if (!user?.id) return;
        router.push(`/profile/${user.id}/following`);
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
        <>
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
                    onFollowersPress={handleFollowersPress}
                    onFollowingPress={handleFollowingPress}
                />

                        {/* Activity tabs */}
                        <ProfileActivityTabs
                            user={user}
                            userId={user?.id}
                            reviewsSlot={(
                                <ProfileReviewList
                                    userId={user?.id}
                                    profileUser={user}
                                    getSportName={getSportName}
                                    onNavigateToReview={(reviewId, spotId) => router.push({ pathname: `/spot/[spotId]`, params: { spotId, reviewId } })}
                                    onNavigateToSpot={(spotId) => { if (spotId) router.push(`/spot/${spotId}`); }}
                                />
                            )}
                            discussionsSlot={(
                                <ProfileDiscussionList
                                    userId={user?.id}
                                    profileUser={user}
                                    onNavigateToDiscussion={(discussionId, spotId) => {
                                        if (spotId) {
                                            router.push({ pathname: `/spot/[spotId]/discussion/[discussionId]`, params: { spotId, discussionId } });
                                        } else {
                                            router.push('/');
                                        }
                                    }}
                                    onNavigateToSpot={(spotId) => { if (spotId) router.push(`/spot/${spotId}`); }}
                                />
                            )}
                            commentsSlot={(
                                <UserCommentList
                                    userId={user?.id}
                                    getSportName={getSportName}
                                    onNavigateToReview={(reviewId, spotId, commentId, parentCommentId) => {
                                        const params: Record<string, string> = { spotId, reviewId };
                                        if (commentId) params.commentId = commentId;
                                        if (parentCommentId) params.parentCommentId = parentCommentId;
                                        router.push({ pathname: `/spot/[spotId]`, params });
                                    }}
                                    onNavigateToDiscussion={(discussionId, spotId, commentId, parentCommentId) => {
                                        if (spotId) {
                                            const params: Record<string, string> = { spotId, discussionId };
                                            if (commentId) params.commentId = commentId;
                                            if (parentCommentId) params.parentCommentId = parentCommentId;
                                            router.push({ pathname: `/spot/[spotId]/discussion/[discussionId]`, params });
                                        } else {
                                            router.push('/');
                                        }
                                    }}
                                    onNavigateToSpot={(spotId) => { if (spotId) router.push(`/spot/${spotId}`); }}
                                />
                            )}
                            meetupsSlot={(
                                <ProfileMeetupsList userId={user?.id} />
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



            </VStack>
        </ScrollView>

        {/* Diálogo de confirmación para cerrar sesión */}
        <SignOut
            isOpen={showSignOutDialog}
            onClose={handleCloseSignOutDialog}
            showTrigger={false}
            onSignOutComplete={() => router.replace('/auth/authentication')}
        />
        </>
    );
}
