import { sportRepository } from '@/src/api/repositories';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Review } from '@/src/entities/review/model/review';
import { User } from '@/src/entities/user/model/user';
import { useReviewDelete } from '@/src/features/review/hooks/use-review-delete';
import { useUserReviews } from '@/src/features/review/hooks/use-user-reviews';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ReviewCard } from './review-card';

export interface UserReviewListProps {
  userId: string | undefined;
  profileUser?: User; // user object for author of reviews (optional — passed by profile page)
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
  onEdit?: (reviewId: string, spotId: string, spotSports?: any) => void;
}

export const UserReviewList: React.FC<UserReviewListProps> = ({
  userId,
  profileUser,
  onNavigateToProfile,
  onNavigateToSpot,
  onEdit,
}) => {
  const { reviews, spotsMap, usersData, loading, error, refetch } = useUserReviews(userId);
  const { deleteReview } = useReviewDelete(() => refetch());

  // Compute unique sport IDs used in the rendered reviews (hook must be called unconditionally)
  const sportIds = useMemo(() => {
    const ids = new Set<string>();
    reviews.forEach((rev) => {
      (rev.details.reviewSports || []).forEach(s => ids.add(s.sportId));
    });
    return Array.from(ids);
  }, [reviews]);

  // Local fetch for sport names
  const [sportNames, setSportNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (sportIds.length === 0) {
        setSportNames({});
        return;
      }
      const promises = sportIds.map(id => sportRepository.getSportById(id).catch(() => null));
      const results = await Promise.all(promises);
      const map: Record<string, string> = {};
      results.forEach((s, idx) => {
        if (s) map[sportIds[idx]] = s.details.name;
      });
      if (mounted) setSportNames(map);
    };
    load();
    return () => { mounted = false; };
  }, [sportIds]);

  const getSportName = useCallback((sportId: string) => sportNames[sportId] || sportId, [sportNames]);

  if (loading) {
    return (
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Cargando actividad...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-red-600">Error cargando actividad</Text>
        <Text className="pt-2 text-gray-600">{error}</Text>
      </VStack>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-gray-600">No hay reseñas creadas por este usuario</Text>
      </VStack>
    );
  }

  // Note: hooks for sportIds, sportNames and getSportName are declared above

  return (
    <VStack className="gap-3">
      {reviews.map((review: Review) => {
        const spot = spotsMap.get(review.details.spotId);
        const user = usersData.get(review.metadata.createdBy) ?? profileUser;

        return (
          <View key={review.id}>
            <ReviewCard
              review={review}
              spotId={review.details.spotId}
              user={user}
              getSportName={getSportName}
              spot={spot}
              onNavigateToProfile={onNavigateToProfile}
              onNavigateToSpot={onNavigateToSpot}
              onEdit={() => onEdit && onEdit(review.id, review.details.spotId, spot?.details.availableSports)}
              onDelete={async () => {
                try {
                  await deleteReview(review.id, review.details.spotId);
                } catch (e) {
                  console.error('Failed to delete review in user list', e);
                }
              }}
            />
          </View>
        );
      })}
    </VStack>
  );
};

export default UserReviewList;
