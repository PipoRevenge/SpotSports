import { sportRepository } from '@/src/api/repositories';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import { useQuery } from '@/src/lib/react-query';
import { useCallback } from 'react';

export interface UseSportsMapResult {
  sportsMap: Map<string, SimpleSport>;
  loading: boolean;
  error: string | null;
  getSportName: (id: string) => string | undefined;
  reload: () => Promise<void>;
}

export const useSportsMapByIds = (ids: string[] = []): UseSportsMapResult => {
  const query = useQuery({
    queryKey: ['sports', 'byIds', ids],
    enabled: ids.length > 0,
    meta: { persist: true },
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const sports = await sportRepository.getSportsByIds(ids);
      const map = new Map<string, SimpleSport>();
      sports.forEach(s => map.set(s.id, { id: s.id, name: s.details.name, description: s.details.description, category: s.details.category }));
      return map;
    },
  });

  const getSportName = useCallback(
    (id: string) => query.data?.get(id)?.name,
    [query.data]
  );

  return {
    sportsMap: query.data ?? new Map(),
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    getSportName,
    reload: async () => { await query.refetch(); }, // satisfies () => Promise<void>
  };
};

export const useAllSportsMap = (): UseSportsMapResult => {
  const query = useQuery({
    queryKey: ['sports', 'allMap'],
    meta: { persist: true },
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const sports = await sportRepository.getAllSports();
      const map = new Map<string, SimpleSport>();
      sports.forEach(s => map.set(s.id, { id: s.id, name: s.details.name, description: s.details.description, category: s.details.category }));
      return map;
    },
  });

  const getSportName = useCallback(
    (id: string) => query.data?.get(id)?.name,
    [query.data]
  );

  return {
    sportsMap: query.data ?? new Map(),
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    getSportName,
    reload: async () => { await query.refetch(); }, // satisfies () => Promise<void>
  };
};

export default useSportsMapByIds;
