import { spotRepository } from '@/src/api/repositories';
import { Spot } from '@/src/entities/spot/model/spot';
import { useQuery } from '@/src/lib/react-query';

interface UseSpotsByIdsResult {
  spots: Spot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSpotsByIds = (ids?: string[]): UseSpotsByIdsResult => {
  const enabled = !!ids && ids.length > 0;

  const query = useQuery({
    queryKey: ['spots', 'byIds', ids],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<Spot[]> => {
      if (!ids || ids.length === 0) return [];
      const results = await Promise.all(ids.map((id) => spotRepository.getSpotById(id)));
      return results.filter(Boolean) as Spot[];
    },
  });

  return {
    spots: query.data ?? [],
    loading: query.isFetching || query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
};
