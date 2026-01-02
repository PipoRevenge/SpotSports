import { reviewRepository } from "@/src/api/repositories";
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from "@/src/context/user-context";
import { ReviewDetails } from "@/src/entities/review/model/review";
import { useQueryClient } from "@/src/lib/react-query";
import { useState } from "react";
import { CreateReviewData } from "../types/review-types";

/**
 * Hook para actualizar una review existente
 * Responsabilidad: Solo actualización de reviews
 */
export const useReviewUpdate = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { showError, showSuccess } = useAppAlert();
  const queryClient = useQueryClient();

  /**
   * Actualiza una review existente
   */
  const updateReview = async (reviewData: CreateReviewData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User must be authenticated to update a review");
      }

      const updates: Partial<ReviewDetails> = {
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

      // Construir reviewId como userId_spotId
      const reviewId = `${user.id}_${reviewData.spotId}`;
      const result = await reviewRepository.updateReview(reviewId, reviewData.spotId, updates);
      
      console.log("[useReviewUpdate] Review updated successfully:", result.id);
      showSuccess("Review updated successfully", 'Success');
      
      // Invalidate and refetch all related queries
      await Promise.all([
        // Invalidate all review-related queries
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['review', reviewId] }),
        queryClient.invalidateQueries({ queryKey: ['spot', reviewData.spotId, 'reviews'] }),
        
        // Invalidate spot data to get updated ratings
        queryClient.invalidateQueries({ queryKey: ['spot', reviewData.spotId] }),
        queryClient.invalidateQueries({ queryKey: ['spot', reviewData.spotId, 'sportRatings'] }),
        
        // Refetch immediately to show updated data
        queryClient.refetchQueries({ queryKey: ['spot', reviewData.spotId] }),
        queryClient.refetchQueries({ queryKey: ['review', reviewId] }),
      ]);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to update review";
      
      setError(errorMessage);
      showError(errorMessage, 'Error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpia el error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    updateReview,
    isLoading,
    error,
    clearError,
  };
};
