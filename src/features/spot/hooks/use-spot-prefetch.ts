import { reviewRepository, sportRepository, spotRepository } from '@/src/api/repositories';
import { useQueryClient } from '@/src/lib/react-query';
import { useCallback } from 'react';

/**
 * Hook para hacer prefetch de datos del spot
 * Útil cuando el usuario está navegando por el mapa y queremos
 * pre-cargar datos antes de que entre a la página
 */
export const useSpotPrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Pre-carga los datos básicos del spot (sin reviews)
   * Ideal para cuando el usuario hace hover o selecciona un marker
   */
  const prefetchSpotBasic = useCallback(async (spotId: string) => {
    // Prefetch del spot básico
    await queryClient.prefetchQuery({
      queryKey: ['spot', spotId],
      staleTime: 3 * 60_000,
      queryFn: async () => {
        const spot = await spotRepository.getSpotById(spotId);
        if (!spot) throw new Error('Spot not found');
        return spot;
      },
    });

    // Prefetch de ratings en paralelo
    await queryClient.prefetchQuery({
      queryKey: ['spot', spotId, 'ratings'],
      staleTime: 3 * 60_000,
      queryFn: async () => {
        return await spotRepository.getSportRatings(spotId);
      },
    });
  }, [queryClient]);

  /**
   * Pre-carga datos del spot incluyendo reviews
   * Ideal para cuando el usuario está a punto de navegar a la página
   */
  const prefetchSpotFull = useCallback(async (spotId: string) => {
    // Primero cargar datos básicos
    await prefetchSpotBasic(spotId);

    // Obtener el spot del cache para saber qué deportes tiene
    const spot = queryClient.getQueryData<any>(['spot', spotId]);

    // Prefetch de deportes disponibles si hay
    if (spot?.details?.availableSports?.length > 0) {
      await queryClient.prefetchQuery({
        queryKey: ['spot', spotId, 'sports'],
        staleTime: 5 * 60_000,
        queryFn: async () => {
          const sports = await sportRepository.getSportsByIds(spot.details.availableSports);
          return sports.map(sport => ({
            id: sport.id,
            name: sport.details.name,
            description: sport.details.description,
            category: sport.details.category,
          }));
        },
      });
    }

    // Prefetch de reviews (limitado a primeras 50 para coincidir con useSpotReviews)
    await queryClient.prefetchQuery({
      queryKey: ['spot', spotId, 'reviews', 50, 0],
      staleTime: 2 * 60_000,
      queryFn: async () => {
        const reviews = await reviewRepository.getReviewsBySpot(spotId, 50, 0);
        return { reviews, users: new Map() }; // No pre-cargar usuarios para ahorrar tiempo
      },
    });
  }, [queryClient, prefetchSpotBasic]);

  /**
   * Pre-carga contadores del spot
   */
  const prefetchSpotCounters = useCallback(async (spotId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['spot', spotId, 'counters'],
      staleTime: 1 * 60_000,
      queryFn: async () => {
        return await spotRepository.getSpotCounters(spotId);
      },
    });
  }, [queryClient]);

  return {
    prefetchSpotBasic,
    prefetchSpotFull,
    prefetchSpotCounters,
  };
};
