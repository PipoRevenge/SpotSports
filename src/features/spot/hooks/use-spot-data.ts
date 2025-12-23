import { sportRepository, spotRepository } from '@/src/api/repositories';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import { SportSpotRating, Spot } from '@/src/entities/spot/model/spot';
import { useQuery } from '@/src/lib/react-query';

interface UseSpotDataResult {
  spot: Spot | null;
  sportRatings: SportSpotRating[];
  availableSports: SimpleSport[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook optimizado para cargar datos del spot con React Query
 * Implementa carga progresiva: primero spot básico, luego ratings y deportes
 */
export const useSpotData = (spotId: string | undefined): UseSpotDataResult => {
  // Query 1: Cargar spot básico (más rápido)
  const spotQuery = useQuery({
    queryKey: ['spot', spotId],
    enabled: !!spotId,
    staleTime: 3 * 60_000, // 3 minutos
    gcTime: 10 * 60_000, // 10 minutos
    meta: { persist: true },
    queryFn: async () => {
      if (!spotId) throw new Error('Missing spotId');
      const spot = await spotRepository.getSpotById(spotId);
      if (!spot) throw new Error('Spot not found');
      return spot;
    },
  });

  // Query 2: Cargar sport ratings (se carga en paralelo con el spot)
  const ratingsQuery = useQuery({
    queryKey: ['spot', spotId, 'ratings'],
    enabled: !!spotId,
    staleTime: 3 * 60_000,
    gcTime: 10 * 60_000,
    meta: { persist: true },
    queryFn: async () => {
      if (!spotId) return [];
      return await spotRepository.getSportRatings(spotId);
    },
  });

  // Query 3: Cargar deportes disponibles (depende de que el spot esté cargado)
  const sportsQuery = useQuery({
    queryKey: ['spot', spotId, 'sports'],
    enabled: !!spotQuery.data?.details?.availableSports?.length,
    staleTime: 5 * 60_000, // 5 minutos (deportes cambian poco)
    gcTime: 15 * 60_000,
    meta: { persist: true },
    queryFn: async () => {
      const availableIds = spotQuery.data?.details?.availableSports ?? [];
      if (availableIds.length === 0) return [];
      const sports = await sportRepository.getSportsByIds(availableIds);
      return sports.map(sport => ({
        id: sport.id,
        name: sport.details?.name ?? '',
        description: sport.details?.description ?? '',
        category: sport.details?.category ?? '',
      }));
    },
  });

  const refetch = () => {
    spotQuery.refetch();
    ratingsQuery.refetch();
    sportsQuery.refetch();
  };

  return {
    spot: spotQuery.data ?? null,
    sportRatings: ratingsQuery.data ?? [],
    availableSports: sportsQuery.data ?? [],
    isLoading: spotQuery.isLoading,
    isFetching: spotQuery.isFetching || ratingsQuery.isFetching || sportsQuery.isFetching,
    error: spotQuery.error
      ? (spotQuery.error as Error).message
      : ratingsQuery.error
      ? (ratingsQuery.error as Error).message
      : sportsQuery.error
      ? (sportsQuery.error as Error).message
      : null,
    refetch,
  };
};
