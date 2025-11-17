import { reviewRepository } from "@/src/api/repositories";
import { ReviewDetails } from "@/src/entities/review/review";
import { useUser } from "@/src/entities/user/context/user-context";
import { useState } from "react";
import { Alert } from "react-native";
import { CreateReviewData } from "../types/review-types";

/**
 * Hook para actualizar una review existente
 * Responsabilidad: Solo actualización de reviews
 */
export const useReviewUpdate = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

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

      const result = await reviewRepository.updateReview(user.id, reviewData.spotId, updates);
      
      console.log("[useReviewUpdate] Review updated successfully:", result.id);
      Alert.alert("Success", "Review updated successfully");
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to update review";
      
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
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
