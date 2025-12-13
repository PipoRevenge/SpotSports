import { reviewRepository } from "@/src/api/repositories";
import { useUser } from "@/src/context/user-context";
import { Review } from "@/src/entities/review/model/review";
import { useQuery } from "@/src/lib/react-query";

/**
 * Hook para cargar una review existente del usuario para un spot
 * Responsabilidad: Solo carga de datos
 */
export const useReviewLoad = (spotId?: string) => {
  const { user } = useUser();

  const query = useQuery<Review | null>({
    queryKey: ['review', 'user', user?.id, spotId],
    enabled: !!user && !!spotId,
    staleTime: 2 * 60_000,
    queryFn: () => {
      if (!user || !spotId) return Promise.resolve(null);
      return reviewRepository.getUserReviewForSpot(user.id, spotId);
    },
  });

  return {
    review: query.data ?? null,
    loadingReview: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
};
