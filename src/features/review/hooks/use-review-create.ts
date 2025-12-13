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
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      await queryClient.invalidateQueries({ queryKey: ['spot', result.details.spotId] });
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
