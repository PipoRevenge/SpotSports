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
  const normalizeToMap = (value: unknown): Map<string, SimpleSport> => {
    if (value instanceof Map) return value;
    if (!value) return new Map();
    if (Array.isArray(value)) {
      const m = new Map<string, SimpleSport>();
      value.forEach((s: any) => {
        if (s?.id) m.set(s.id, { id: s.id, name: s.details?.name ?? s.name, description: s.details?.description ?? s.description, category: s.details?.category ?? s.category });
      });
      return m;
    }
    if (typeof value === 'object') {
      const m = new Map<string, SimpleSport>();
      Object.entries(value as Record<string, any>).forEach(([key, s]) => {
        // Prefer the id inside the value, otherwise use the object key (handles arrays rehydrated as objects)
        const id = s?.id ?? key;
        if (!id) return;
        m.set(id, {
          id,
          name: s?.details?.name ?? s?.name ?? id,
          description: s?.details?.description ?? s?.description,
          category: s?.details?.category ?? s?.category,
        });
      });
      return m;
    }
    return new Map();
  };

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

  const sportsMap = normalizeToMap(query.data);

  const getSportName = useCallback(
    (id: string) => sportsMap.get(id)?.name,
    [sportsMap]
  );

  return {
    sportsMap,
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    getSportName,
    reload: async () => { await query.refetch(); }, // satisfies () => Promise<void>
  };
};

export const useAllSportsMap = (): UseSportsMapResult => {
  const normalizeToMap = (value: unknown): Map<string, SimpleSport> => {
    if (value instanceof Map) return value;
    if (!value) return new Map();
    if (Array.isArray(value)) {
      const m = new Map<string, SimpleSport>();
      value.forEach((s: any) => {
        if (s?.id) m.set(s.id, { id: s.id, name: s.details?.name ?? s.name, description: s.details?.description ?? s.description, category: s.details?.category ?? s.category });
      });
      return m;
    }
    if (typeof value === 'object') {
      const m = new Map<string, SimpleSport>();
      Object.entries(value as Record<string, any>).forEach(([key, s]) => {
        // Prefer the id inside the value, otherwise use the object key (handles arrays rehydrated as objects)
        const id = s?.id ?? key;
        if (!id) return;
        m.set(id, {
          id,
          name: s?.details?.name ?? s?.name ?? id,
          description: s?.details?.description ?? s?.description,
          category: s?.details?.category ?? s?.category,
        });
      });
      return m;
    }
    return new Map();
  };

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

  const sportsMap = normalizeToMap(query.data);

  const getSportName = useCallback(
    (id: string) => sportsMap.get(id)?.name,
    [sportsMap]
  );

  return {
    sportsMap,
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    getSportName,
    reload: async () => { await query.refetch(); }, // satisfies () => Promise<void>
  };
};

export default useSportsMapByIds;
