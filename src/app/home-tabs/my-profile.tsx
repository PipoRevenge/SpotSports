import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { SignOut } from '@/src/features/auth';
import { UserCommentList } from '@/src/features/comment';
import { UserDiscussionList } from '@/src/features/discussion';
import { UserReviewList } from '@/src/features/review';
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

    const handleNavigateToProfile = (userIdToNavigate: string) => {
        if (!userIdToNavigate) return;
        if (userIdToNavigate === currentUser?.id) {
            router.push('/home-tabs/my-profile');
        } else {
            router.push(`/profile/${userIdToNavigate}`);
        }
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
                                <UserReviewList
                                    userId={user?.id}
                                    profileUser={user}
                                    onNavigateToProfile={handleNavigateToProfile}
                                    onNavigateToSpot={(spotId) => { if (spotId) router.push(`/spot/${spotId}`); }}
                                    getSportName={getSportName}
                                        // Editing or deleting reviews from profile not allowed
                                        allowManage={false}
                                />
                            )}
                            discussionsSlot={(
                                <UserDiscussionList
                                    userId={user?.id}
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
                                    onNavigateToReview={(reviewId, spotId) => {
                                        router.push(`/spot/${spotId}`);
                                    }}
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
                        />

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
