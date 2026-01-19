import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/context/user-context";
import { UserCommentList } from "@/src/features/comment";
import { ProfileDiscussionList } from "@/src/features/discussion";
import { ProfileMeetupsList } from "@/src/features/meetup/components/profile-meetups/profile-meetups-list";
import { useFollow } from "@/src/features/relationships";
import { ProfileReviewList } from "@/src/features/review";
import { ProfileActivityTabs, ProfileHeader } from "@/src/features/user";
import { useProfile } from "@/src/features/user/hooks/use-profile";
import {
  FollowStatus,
  ProfileActionType,
} from "@/src/features/user/types/profile-types";
import { useAllSportsMap } from "@/src/hooks/use-sports";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useUser();

  // Redirigir a my-profile si es el mismo usuario
  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
      router.push("/home-tabs/my-profile");
    }
  }, [userId, currentUser]);

  // Usar el hook de perfil
  const { user, isLoading, error, refetch } = useProfile(userId);
  const { getSportName } = useAllSportsMap();
  // Local optimistic followers counter
  const [localFollowersCount, setLocalFollowersCount] = useState<number | null>(
    null
  );
  const { subscribeToFollowEvents } = useUser();
  useEffect(() => {
    if (!subscribeToFollowEvents) return;
    const unsub = subscribeToFollowEvents((payload) => {
      // If the event affects this profile, update local counter
      if (payload.targetUserId === user?.id) {
        setLocalFollowersCount(
          (prev) => (prev ?? 0) + (payload.isFollowing ? 1 : -1)
        );
      }
      // If the current user is the follower, their following count is updated via userContext
    });
    return unsub;
  }, [subscribeToFollowEvents, user]);
  useEffect(() => {
    if (user) setLocalFollowersCount(user.activity.followersCount);
  }, [user]);

  const { toggleFollow, isFollowing } = useFollow(user?.id);
  const displayedUser = user
    ? {
        ...user,
        activity: {
          ...user.activity,
          followersCount: localFollowersCount ?? user.activity.followersCount,
        },
      }
    : user;
  const handleFollowPress = async () => {
    if (!user) return;
    try {
      const newState = await toggleFollow();
      if (typeof newState === "boolean") {
        setLocalFollowersCount((prev) => {
          if (prev == null) return prev;
          return newState ? prev + 1 : prev - 1;
        });
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="pt-2">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center pb-4">{error}</Text>
          <Text className="text-blue-500" onPress={handleRefresh}>
            Try again
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text>Could not load user information</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <VStack className="p-4" space="lg">
          <ProfileHeader
            user={displayedUser as any}
            actionType={ProfileActionType.VIEW_OTHER}
            onFollowPress={handleFollowPress}
            isOwn={false}
            followStatus={
              isFollowing ? FollowStatus.FOLLOWING : FollowStatus.NOT_FOLLOWING
            }
            onFollowersPress={handleFollowersPress}
            onFollowingPress={handleFollowingPress}
            displayFollowersCount={
              localFollowersCount ?? user.activity.followersCount
            }
          />

          {/* Activity tabs */}
          <ProfileActivityTabs
            user={user}
            userId={user?.id}
            reviewsSlot={
              <ProfileReviewList
                userId={user?.id}
                profileUser={user}
                getSportName={getSportName}
                onNavigateToReview={(reviewId, spotId) =>
                  router.push({
                    pathname: `/spot/[spotId]`,
                    params: { spotId, reviewId },
                  })
                }
                onNavigateToSpot={(spotId) => {
                  if (spotId) router.push(`/spot/${spotId}`);
                }}
              />
            }
            discussionsSlot={
              <ProfileDiscussionList
                userId={user?.id}
                profileUser={user}
                onNavigateToDiscussion={(
                  discussionId: string,
                  spotId?: string
                ) => {
                  if (spotId) {
                    router.push({
                      pathname: `/spot/[spotId]/discussion/[discussionId]`,
                      params: { spotId, discussionId } as any,
                    });
                  } else {
                    router.push("/");
                  }
                }}
                onNavigateToSpot={(spotId?: string) => {
                  if (spotId) router.push(`/spot/${spotId}`);
                }}
              />
            }
            commentsSlot={
              <UserCommentList
                userId={user?.id}
                getSportName={getSportName}
                onNavigateToReview={(
                  reviewId: string,
                  spotId: string,
                  commentId?: string,
                  parentCommentId?: string
                ) => {
                  const params: any = { spotId, reviewId };
                  if (commentId) params.commentId = commentId;
                  if (parentCommentId) params.parentCommentId = parentCommentId;
                  router.push({
                    pathname: `/spot/[spotId]`,
                    params: params as any,
                  });
                }}
                onNavigateToDiscussion={(
                  discussionId: string,
                  spotId?: string,
                  commentId?: string,
                  parentCommentId?: string
                ) => {
                  if (!spotId) {
                    router.push("/");
                    return;
                  }
                  const params: any = { spotId, discussionId };
                  if (commentId) params.commentId = commentId;
                  if (parentCommentId) params.parentCommentId = parentCommentId;
                  router.push({
                    pathname: `/spot/[spotId]/discussion/[discussionId]`,
                    params: params as any,
                  });
                }}
                onNavigateToSpot={(spotId?: string) => {
                  if (spotId) router.push(`/spot/${spotId}`);
                }}
              />
            }
            meetupsSlot={<ProfileMeetupsList userId={user?.id} />}
          />

          {/* Sección de spots favoritos */}
          {user.activity.favoriteSpotsCount > 0 && (
            <View>
              <Text className="text-lg font-bold pb-2">Favorite spots</Text>
              <Text className="text-gray-500">
                {user.activity.favoriteSpotsCount} saved spots
              </Text>
              {/* TODO: Mostrar lista de spots favoritos */}
              {/* Aquí puedes integrar componentes de la feature de spots */}
            </View>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
