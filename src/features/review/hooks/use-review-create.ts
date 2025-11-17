import { reviewRepository } from "@/src/api/repositories";
import { ReviewDetails } from "@/src/entities/review/review";
import { useUser } from "@/src/entities/user/context/user-context";
import { useState } from "react";
import { Alert } from "react-native";
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

  /**
   * Crea una nueva review
   */
  const createReview = async (reviewData: CreateReviewData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
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

      const result = await reviewRepository.createReview(user.id, reviewDetails);
      
      console.log("[useReviewCreate] Review created successfully:", result.id);
      Alert.alert("Success", REVIEW_SUCCESS_MESSAGES.CREATED);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : REVIEW_ERROR_MESSAGES.CREATE_ERROR;
      
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
    createReview,
    isLoading,
    error,
    clearError,
  };
};
