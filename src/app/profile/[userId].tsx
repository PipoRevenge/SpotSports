import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { UserCommentList } from '@/src/features/comment';
import { UserDiscussionList } from '@/src/features/discussion';
import { useFollow } from '@/src/features/relationships';
import { UserReviewList } from '@/src/features/review';
import { ProfileActivityTabs, ProfileHeader } from '@/src/features/user';
import { useProfile } from '@/src/features/user/hooks/use-profile';
import { FollowStatus, ProfileActionType } from '@/src/features/user/types/profile-types';
import { useAllSportsMap } from '@/src/hooks/use-sports';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
        const { getSportName } = useAllSportsMap();
        // Local optimistic followers counter
        const [localFollowersCount, setLocalFollowersCount] = useState<number | null>(null);
        const { subscribeToFollowEvents } = useUser();
        useEffect(() => {
            if (!subscribeToFollowEvents) return;
            const unsub = subscribeToFollowEvents((payload) => {
                // If the event affects this profile, update local counter
                if (payload.targetUserId === user?.id) {
                    setLocalFollowersCount(prev => (prev ?? 0) + (payload.isFollowing ? 1 : -1));
                }
                // If the current user is the follower, their following count is updated via userContext
            });
            return unsub;
        }, [subscribeToFollowEvents, user]);
        useEffect(() => {
            if (user) setLocalFollowersCount(user.activity.followersCount);
        }, [user]);



    const { toggleFollow, isFollowing } = useFollow(user?.id);
    const displayedUser = user ? { ...user, activity: { ...user.activity, followersCount: localFollowersCount ?? user.activity.followersCount } } : user;
    const handleFollowPress = async () => {
        if (!user) return;
        try {
            const newState = await toggleFollow();
            if (typeof newState === 'boolean') {
                setLocalFollowersCount(prev => {
                    if (prev == null) return prev;
                    return newState ? prev + 1 : prev - 1;
                });
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            // Ensure final data is consistent with server
            refetch();
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
                    user={displayedUser as any}
                    actionType={ProfileActionType.VIEW_OTHER}
                    onFollowPress={handleFollowPress}
                    isOwn={false}
                    followStatus={isFollowing ? FollowStatus.FOLLOWING : FollowStatus.NOT_FOLLOWING}
                    onFollowersPress={handleFollowersPress}
                    onFollowingPress={handleFollowingPress}
                    displayFollowersCount={localFollowersCount ?? user.activity.followersCount}
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
                                // Disallow editing/deleting reviews from profile view
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
                                            // fallback to root if spotId not present
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

            </VStack>
        </ScrollView>
    );
}