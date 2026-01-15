import { spotRepository } from '@/src/api/repositories';
import { useMutation, useQuery, useQueryClient } from '@/src/lib/react-query';

export interface SpotCounters {
  activeMeetupsCount: number;
  reviewsCount: number;
  discussionsCount?: number;
}

/**
 * Hook optimizado para cargar y actualizar contadores de un spot
 */
export const useSpotCounters = (spotId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['spot', spotId, 'counters'],
    enabled: !!spotId,
    staleTime: 1 * 60_000, // 1 minuto (contadores cambian frecuentemente)
    gcTime: 3 * 60_000,
    queryFn: async () => {
      if (!spotId) return null;
      return await spotRepository.getSpotCounters(spotId);
    },
  });

  const updateCountersMutation = useMutation({
    mutationFn: async () => {
      if (!spotId) throw new Error('No spotId');
      return await spotRepository.getSpotCounters(spotId);
    },
    onSuccess: (data) => {
      if (data && spotId) {
        // Actualizar cache de contadores
        queryClient.setQueryData(['spot', spotId, 'counters'], data);
        
        // Actualizar spot completo si está en cache
        queryClient.setQueryData<any>(['spot', spotId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            activity: {
              ...old.activity,
              ...data,
            },
          };
        });
      }
    },
  });

  return {
    counters: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    updateCounters: updateCountersMutation.mutateAsync,
    isUpdating: updateCountersMutation.isPending,
  };
};
