import { useCallback, useEffect, useMemo, useState } from 'react';
import { sportRepository } from '@/src/api/repositories';
import { SimpleSport } from '@/src/entities/sport/model/sport';

export interface UseSportsMapResult {
  sportsMap: Map<string, SimpleSport>;
  loading: boolean;
  error: string | null;
  getSportName: (id: string) => string | undefined;
  reload: () => Promise<void>;
}

export const useSportsMapByIds = (ids: string[] = []): UseSportsMapResult => {
  const [sportsMap, setSportsMap] = useState<Map<string, SimpleSport>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!ids || ids.length === 0) {
        setSportsMap(new Map());
        return;
      }
      const sports = await sportRepository.getSportsByIds(ids);
      const map = new Map<string, SimpleSport>();
      sports.forEach(s => map.set(s.id, { id: s.id, name: s.details.name, description: s.details.description, category: s.details.category }));
      setSportsMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading sports');
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    load();
  }, [load]);

  const getSportName = useCallback((id: string) => {
    return sportsMap.get(id)?.name;
  }, [sportsMap]);

  return {
    sportsMap,
    loading,
    error,
    getSportName,
    reload: load,
  };
};

export const useAllSportsMap = (): UseSportsMapResult => {
  const [sportsMap, setSportsMap] = useState<Map<string, SimpleSport>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sports = await sportRepository.getAllSports();
      const map = new Map<string, SimpleSport>();
      sports.forEach(s => map.set(s.id, { id: s.id, name: s.details.name, description: s.details.description, category: s.details.category }));
      setSportsMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading sports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getSportName = useCallback((id: string) => {
    return sportsMap.get(id)?.name;
  }, [sportsMap]);

  return { sportsMap, loading, error, getSportName, reload: load };
};

export default useSportsMapByIds;
