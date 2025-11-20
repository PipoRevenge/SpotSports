import { spotRepository } from '@/src/api/repositories';
import { Spot } from '@/src/entities/spot/model/spot';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpotsByIdsResult {
  spots: Spot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSpotsByIds = (ids?: string[]): UseSpotsByIdsResult => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpots = useCallback(async (currentIds?: string[]) => {
    if (!currentIds || currentIds.length === 0) {
      setSpots([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const promises = currentIds.map((id) => spotRepository.getSpotById(id));
      const results = await Promise.all(promises);
      const valid = results.filter(Boolean) as Spot[];
      setSpots(valid);
    } catch (err) {
      console.error('[useSpotsByIds] Error fetching spots by ids:', err);
      setError(err instanceof Error ? err.message : 'Error fetching spots');
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const lastIdsStringRef = useRef<string | null>(null);

  useEffect(() => {
    const idsString = ids ? JSON.stringify(ids) : null;
    if (idsString === lastIdsStringRef.current) return;
    lastIdsStringRef.current = idsString;
    fetchSpots(ids);
  }, [ids, fetchSpots]);

  const refetch = useCallback(() => {
    fetchSpots(ids);
  }, [ids, fetchSpots]);

  return { spots, loading, error, refetch };
};
