import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Review } from '@/src/entities/review/model/review';
import { User } from '@/src/entities/user/model/user';
import { useUserReviews } from '@/src/features/review/hooks/use-user-reviews';
import sportsMapByIds, { useAllSportsMap } from '@/src/hooks/use-sports';
import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ProfileReviewCard } from './profile-review-card';

interface ProfileReviewListProps {
  userId: string | undefined;
  profileUser?: User;
  getSportName?: (id: string) => string | undefined;
  onNavigateToSpot?: (spotId: string) => void;
  onNavigateToReview?: (reviewId: string, spotId: string) => void;
}

export const ProfileReviewList: React.FC<ProfileReviewListProps> = ({
  userId,
  profileUser,
  getSportName,
  onNavigateToSpot,
  onNavigateToReview,
}) => {
  const { reviews, spotsMap, usersData, loading, error, refetch } = useUserReviews(userId);

  // Trigger recompute when reviews change (hook manages fetching by reviewSports internally)
  useMemo(() => reviews.map((r) => r.id), [reviews]);

  // Build a set of sportIds from reviews so we can fetch their names reliably
  const sportIds = useMemo(() => {
    const ids = new Set<string>();
    reviews.forEach(r => r.details.reviewSports?.forEach(s => ids.add(s.sportId)));
    return [...ids];
  }, [reviews]);

  const sportsMapHook = sportsMapByIds(sportIds);
  const { getSportName: localGetSportName } = sportsMapHook;
  const { getSportName: globalGetSportName } = useAllSportsMap();

  if (loading) {
    return (
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Cargando reseñas...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-red-600">Error cargando reseñas</Text>
        <Text className="pt-2 text-gray-600" onPress={refetch}>Toca para reintentar</Text>
      </VStack>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-gray-600">No hay reseñas de este usuario</Text>
      </VStack>
    );
  }

  return (
    <VStack className="gap-3">
      {reviews.map((review: Review) => {
        const spot = spotsMap.get(review.details.spotId);
        const user = usersData.get(review.metadata.createdBy) ?? profileUser;
        return (
          <View key={review.id}>
            <ProfileReviewCard
              review={review}
              user={user}
              spotName={spot?.details.name}
              getSportName={(id: string) => (getSportName ? getSportName(id) : undefined) ?? localGetSportName(id) ?? globalGetSportName(id)}
              onNavigate={(reviewId, spotId) => {
                if (onNavigateToReview) onNavigateToReview(reviewId, spotId);
                else if (onNavigateToSpot) onNavigateToSpot(spotId);
              }}
            />
          </View>
        );
      })}
    </VStack>
  );
};

export type { ProfileReviewListProps };

export default ProfileReviewList;
