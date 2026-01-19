import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { User } from '@/src/entities/user/model/user';
import { useUserDiscussions } from '@/src/features/discussion/hooks/use-user-discussions';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ProfileDiscussionCard } from './profile-discussion-card';

interface ProfileDiscussionListProps {
  userId: string | undefined;
  profileUser?: User;
  onNavigateToDiscussion?: (discussionId: string, spotId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
}

export const ProfileDiscussionList: React.FC<ProfileDiscussionListProps> = ({
  userId,
  profileUser,
  onNavigateToDiscussion,
  onNavigateToSpot,
}) => {
  const { discussions, spotsMap, loading, error } = useUserDiscussions(userId);

  if (loading) {
    return (
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Loading discussions...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-red-600">Error loading discussions</Text>
      </VStack>
    );
  }

  if (!discussions || discussions.length === 0) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-gray-600">No hay discusiones creadas por este usuario</Text>
      </VStack>
    );
  }

  return (
    <VStack className="gap-3">
      {discussions.map((discussion: Discussion) => {
        const spot = spotsMap.get(discussion.details.spotId);
        return (
          <View key={discussion.id}>
            <ProfileDiscussionCard
              discussion={discussion}
              user={profileUser}
              spotName={spot?.details.name}
              onNavigate={(discussionId, spotId) => {
                if (onNavigateToDiscussion) onNavigateToDiscussion(discussionId, spotId);
                else if (onNavigateToSpot) onNavigateToSpot(spotId);
              }}
            />
          </View>
        );
      })}
    </VStack>
  );
};

export type { ProfileDiscussionListProps };

export default ProfileDiscussionList;
