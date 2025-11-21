import { reviewRepository } from "@/src/api/repositories";
import { useUser } from "@/src/context/user-context";
import { useState } from "react";
import { Alert } from "react-native";

/**
 * Hook para eliminar una review
 * Responsabilidad: Solo eliminación de reviews
 */
export const useReviewDelete = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  /**
   * Elimina una review existente
   * Actualiza todas las métricas relacionadas
   */
  const deleteReview = async (reviewId: string, spotId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User must be authenticated to delete a review");
      }

      // Eliminar la review usando el repositorio
      await reviewRepository.deleteReview(reviewId, spotId);
      
      Alert.alert("Success", "Review eliminada exitosamente");
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to delete review";
      
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
    deleteReview,
    isLoading,
    error,
    clearError,
  };
};
