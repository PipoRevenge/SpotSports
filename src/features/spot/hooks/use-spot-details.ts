import { spotRepository } from '@/src/api/repositories';
import { SportSpotRating, Spot } from '@/src/entities/spot/model/spot';
import { useQuery } from '@/src/lib/react-query';

interface UseSpotDetailsResult {
  spot: Spot | null;
  sportRatings: SportSpotRating[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para obtener los detalles de un spot y sus métricas de deportes
 */
export const useSpotDetails = (spotId: string | undefined): UseSpotDetailsResult => {
  const query = useQuery({
    queryKey: ['spot', spotId],
    enabled: !!spotId,
    staleTime: 5 * 60_000,
    meta: { persist: true },
    retry: 2, // Intentar 2 veces antes de fallar
    queryFn: async () => {
      if (!spotId) throw new Error('Missing spotId');
      console.log('[useSpotDetails] Fetching spot:', spotId);
      const fetchedSpot = await spotRepository.getSpotById(spotId);
      if (!fetchedSpot) throw new Error('Spot not found');
      const ratings = await spotRepository.getSportRatings(spotId);
      console.log('[useSpotDetails] Fetched spot:', fetchedSpot.id, 'ratings:', ratings.length);
      return { spot: fetchedSpot, ratings };
    }
  });

  return {
    spot: query.data?.spot ?? null,
    sportRatings: query.data?.ratings ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
};
