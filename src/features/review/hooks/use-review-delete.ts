// import { reviewRepository } from "@/src/api/repositories"; // TODO: Descomentar cuando se implemente
import { useUser } from "@/src/entities/user/context/user-context";
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
   * TODO: Implementar en el repositorio la lógica de eliminación
   */
  const deleteReview = async (reviewId: string, spotId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User must be authenticated to delete a review");
      }

      // TODO: Implementar reviewRepository.deleteReview(reviewId, spotId)
      // Por ahora, solo mostramos un placeholder
      console.log("[useReviewDelete] Delete review not yet implemented:", reviewId, spotId);
      Alert.alert("Próximamente", "La función de eliminar review estará disponible pronto");
      
      // Cuando se implemente:
      // await reviewRepository.deleteReview(reviewId, spotId);
      // Alert.alert("Success", "Review eliminada exitosamente");
      // if (onSuccess) {
      //   onSuccess();
      // }
      
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
