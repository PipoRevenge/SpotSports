import { reviewRepository } from "@/src/api/repositories";
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from "@/src/context/user-context";
import { useQueryClient } from '@/src/lib/react-query';
import { useState } from "react";
/**
 * Hook para eliminar una review
 * Responsabilidad: Solo eliminación de reviews
 */
export const useReviewDelete = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { showError, showSuccess } = useAppAlert();
  const queryClient = useQueryClient();

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
      
      // Update counters cache (optimistic - server already decremented in transaction)
      try {
        queryClient.setQueryData(['spot', spotId, 'counters'], (old: any) => {
          if (!old) return old;
          return { ...old, reviewsCount: Math.max(0, (old.reviewsCount || 0) - 1) };
        });

        queryClient.setQueryData<any>(['spot', spotId], (old: any) => {
          if (!old) return old;
          return { ...old, activity: { ...old.activity, reviewsCount: Math.max(0, (old.activity?.reviewsCount || 0) - 1) } };
        });
      } catch (cacheErr) {
        console.warn('[useReviewDelete] Failed to update spot counters cache', cacheErr);
      }

      showSuccess("Review eliminada exitosamente", 'Success');

      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      await queryClient.invalidateQueries({ queryKey: ['spot', spotId] });

      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to delete review";
      
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
    deleteReview,
    isLoading,
    error,
    clearError,
  };
};
