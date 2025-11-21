import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { useUser } from '@/src/context/user-context';
import { RelationshipList } from '@/src/features/relationships';
import { useFollowers } from '@/src/features/relationships/hooks/use-followers';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function FollowersPage() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { users, isLoading, isLoadingMore, error, refetch, loadMore } = useFollowers(userId);
  const [localUsers, setLocalUsers] = useState(users);
  useEffect(() => setLocalUsers(users), [users]);
  const { subscribeToFollowEvents } = useUser();
  useEffect(() => {
    if (!subscribeToFollowEvents) return;
    const unsub = subscribeToFollowEvents((payload) => {
      // Apply update only if the changed user is in list
      setLocalUsers(prev => prev.map(u => u.id === payload.targetUserId ? { ...u, activity: { ...u.activity, followersCount: Math.max(0, u.activity.followersCount + (payload.isFollowing ? 1 : -1)) } } : u));
    });
    return unsub;
  }, [subscribeToFollowEvents]);
  const { user: currentUser } = useUser();

  const handleNavigateToProfile = (id: string) => {
    if (!id) return;
    if (id === currentUser?.id) {
      router.push('/home-tabs/my-profile');
    } else {
      router.push(`/profile/${id}`);
    }
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-bold pb-2">Seguidores</Text>
      <RelationshipList users={localUsers} onNavigateToProfile={handleNavigateToProfile} isLoading={isLoading} isLoadingMore={isLoadingMore} onLoadMore={loadMore} onFollowChange={(userId, isFollowing) => setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, activity: { ...u.activity, followersCount: Math.max(0, u.activity.followersCount + (isFollowing ? 1 : -1)) } } : u))} />
    </View>
  );
}
