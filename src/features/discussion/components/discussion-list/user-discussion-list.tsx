import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { useUserDiscussions } from '@/src/features/discussion/hooks/use-user-discussions';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DiscussionCard } from './discussion-card';

export interface UserDiscussionListProps {
  userId: string | undefined;
  onNavigateToDiscussion?: (discussionId: string, spotId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
}

export const UserDiscussionList: React.FC<UserDiscussionListProps> = ({
  userId,
  onNavigateToDiscussion,
  onNavigateToSpot,
}) => {
  const { discussions, spotsMap, loading, error } = useUserDiscussions(userId);

  if (loading) {
    return (
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Cargando discusiones...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-red-600">Error cargando discusiones</Text>
        <Text className="pt-2 text-gray-600">{error}</Text>
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
            <DiscussionCard
              discussion={discussion}
              spotName={spot?.details.name}
              onPress={(discussionId) => {
                if (onNavigateToDiscussion) {
                  onNavigateToDiscussion(discussionId, discussion.details.spotId);
                }
              }}
            />
          </View>
        );
      })}
    </VStack>
  );
};

export default UserDiscussionList;
