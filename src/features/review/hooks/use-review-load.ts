import { reviewRepository } from "@/src/api/repositories";
import { Review } from "@/src/entities/review/review";
import { useUser } from "@/src/entities/user/context/user-context";
import { useCallback, useState } from "react";

/**
 * Hook para cargar una review existente del usuario para un spot
 * Responsabilidad: Solo carga de datos
 */
export const useReviewLoad = () => {
  const [loadingReview, setLoadingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  /**
   * Carga una review existente del usuario para un spot
   */
  const loadReview = useCallback(async (spotId: string): Promise<Review | null> => {
    if (!user) {
      return null;
    }

    setLoadingReview(true);
    setError(null);

    try {
      const review = await reviewRepository.getUserReviewForSpot(user.id, spotId);
      return review;
    } catch (err) {
      console.error("[useReviewLoad] Error loading review:", err);
      setError(err instanceof Error ? err.message : "Failed to load review");
      return null;
    } finally {
      setLoadingReview(false);
    }
  }, [user]);

  /**
   * Limpia el error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loadReview,
    loadingReview,
    error,
    clearError,
  };
};
