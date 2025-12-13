import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Review } from '@/src/entities/review/model/review';
import { User } from '@/src/entities/user/model/user';
import { CommentWithUser } from '@/src/features/comment';
import { useReviewDelete } from '@/src/features/review/hooks/use-review-delete';
import { useUserReviews } from '@/src/features/review/hooks/use-user-reviews';
import { useSportsMapByIds } from '@/src/hooks/use-sports';
import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ReviewCard } from './review-card';

export interface UserReviewListProps {
  userId: string | undefined;
  profileUser?: User; // user object for author of reviews (optional — passed by profile page)
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
  onEdit?: (reviewId: string, spotId: string, spotSports?: any) => void;
  getSportName?: (id: string) => string | undefined;
  /**
   * If false, hide edit/delete controls (used when rendering lists inside profile pages)
   * Defaults to true
   */
  allowManage?: boolean;
  // Comment modal slots (propagated to ReviewCard)
  /** Slot for the reply modal - injected from app/ layer */
  commentModalSlot?: React.ReactNode;
  /** Callback when user wants to reply to a comment */
  onOpenReplyModal?: (comment: CommentWithUser, review: Review) => void;
  /** Callback when user wants to add a new comment to a review */
  onOpenNewCommentModal?: (review: Review) => void;
}

export const UserReviewList: React.FC<UserReviewListProps> = ({
  userId,
  profileUser,
  onNavigateToProfile,
  onNavigateToSpot,
  onEdit,
  allowManage = true,
  getSportName: passedGetSportName,
  commentModalSlot,
  onOpenReplyModal,
  onOpenNewCommentModal,
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

  // Use shared hook to get sport names from the centralized repo/hook
  const { getSportName: getSportNameFromHook } = useSportsMapByIds(sportIds);
  const getSportName = passedGetSportName ?? getSportNameFromHook;

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

        const canManage = !!allowManage;

        return (
          <View key={review.id}>
              <ReviewCard
              review={review}
              spotId={review.details.spotId}
              user={user}
              getSportName={(sportId: string) => getSportName(sportId) ?? sportId}
              spot={spot}
              onNavigateToProfile={onNavigateToProfile}
              onNavigateToSpot={onNavigateToSpot}
              onEdit={canManage && onEdit ? () => onEdit(review.id, review.details.spotId, spot?.details.availableSports) : undefined}
              onDelete={canManage ? async () => {
                try {
                  await deleteReview(review.id, review.details.spotId);
                } catch (e) {
                  console.error('Failed to delete review in user list', e);
                }
              } : undefined}
              commentModalSlot={commentModalSlot}
              onOpenReplyModal={onOpenReplyModal}
              onOpenNewCommentModal={onOpenNewCommentModal}
            />
          </View>
        );
      })}
    </VStack>
  );
};

export default UserReviewList;
