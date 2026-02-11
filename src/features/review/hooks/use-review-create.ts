import { reviewRepository } from "@/src/api/repositories";
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from "@/src/context/user-context";
import { Review, ReviewDetails } from "@/src/entities/review/model/review";
import { useMutation, useQueryClient } from "@/src/lib/react-query";
import { useState } from "react";
import { CreateReviewData } from "../types/review-types";
import { REVIEW_ERROR_MESSAGES, REVIEW_SUCCESS_MESSAGES } from "../utils/review-constants";

/**
 * Hook para crear una nueva review
 * Responsabilidad: Solo creación de reviews
 * 
 * @param onSuccess - Callback opcional que se ejecuta después de crear exitosamente
 */
export const useReviewCreate = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { showError, showSuccess } = useAppAlert();
  const queryClient = useQueryClient();

  /**
   * Crea una nueva review
   */
  const mutation = useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      if (!user) {
        throw new Error("User must be authenticated to create a review");
      }

      const reviewDetails: ReviewDetails = {
        spotId: reviewData.spotId,
        content: reviewData.content,
        rating: reviewData.rating,
        reviewSports: reviewData.reviewSports.map(sport => ({
          sportId: sport.sportId,
          sportRating: sport.sportRating,
          difficulty: sport.difficulty,
          comment: sport.comment,
        })),
        media: reviewData.media,
      };

      return reviewRepository.createReview(user.id, reviewDetails);
    },
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: async (result) => {
      showSuccess(REVIEW_SUCCESS_MESSAGES.CREATED, 'Success');

      const spotId = result.details.spotId;
      const reviewId = result.id;

      // Invalidate all related queries immediately
      await Promise.all([
        // Invalidate all review-related queries
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['review', reviewId] }),
        queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'reviews'] }),
        
        // Invalidate spot data to get updated counters, ratings, and sports
        queryClient.invalidateQueries({ queryKey: ['spot', spotId] }),
        queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'counters'] }),
        queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'ratings'] }),
        queryClient.invalidateQueries({ queryKey: ['spot', spotId, 'sports'] }),
      ]);

      // Wait for backend triggers (onReviewCreate → updates sport_metrics & availableSports)
      // before refetching to ensure we get the updated data
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refetch spot data to show updated info
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['spot', spotId] }),
        queryClient.refetchQueries({ queryKey: ['spot', spotId, 'reviews'] }),
        queryClient.refetchQueries({ queryKey: ['spot', spotId, 'ratings'] }),
        queryClient.refetchQueries({ queryKey: ['spot', spotId, 'sports'] }),
      ]);

      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error 
        ? err.message 
        : REVIEW_ERROR_MESSAGES.CREATE_ERROR;
      setError(errorMessage);
      showError(errorMessage, 'Error');
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const createReview = async (reviewData: CreateReviewData): Promise<Review> => {
    return mutation.mutateAsync(reviewData);
  };

  /**
   * Limpia el error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    createReview,
    isLoading,
    error,
    clearError,
  };
};
