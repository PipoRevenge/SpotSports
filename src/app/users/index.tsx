import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { useUser } from '@/src/context/user-context';
import { RelationshipList } from '@/src/features/relationships';
import { useAllUsers } from '@/src/features/relationships/hooks/use-all-users';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function AllUsersPage() {
  const { users, isLoading, isLoadingMore, error, refetch, loadMore } = useAllUsers({ limit: 100 });
  const [localUsers, setLocalUsers] = useState(users);
  useEffect(() => setLocalUsers(users), [users]);
  const { user: currentUser } = useUser();
  const { subscribeToFollowEvents } = useUser();

  const handleNavigateToProfile = (id: string) => {
    if (!id) return;
    if (id === currentUser?.id) {
      router.push('/home-tabs/my-profile');
    } else {
      router.push(`/profile/${id}`);
    }
  };

  useEffect(() => {
    if (!subscribeToFollowEvents) return;
    const unsub = subscribeToFollowEvents((payload) => {
      if (!payload) return;
      // Update local users array if the changed user is in the list
      // We'll trigger a refetch afterwards for consistency
      // find user and update followersCount
      // We can do a shallow update by triggering refetch for simplicity
      refetch();
    });
    return unsub;
  }, [subscribeToFollowEvents]);

  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-bold pb-2">Usuarios</Text>
      <RelationshipList users={localUsers} onNavigateToProfile={handleNavigateToProfile} isLoading={isLoading} isLoadingMore={isLoadingMore} onLoadMore={loadMore} onFollowChange={(userId, isFollowing) => {
        setLocalUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, activity: {...u.activity, followersCount: Math.max(0, u.activity.followersCount + (isFollowing ? 1 : -1))}} : u));
      }} />
    </View>
  );
}
