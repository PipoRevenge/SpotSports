import { discussionRepository, spotRepository } from '@/src/api/repositories';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { Spot } from '@/src/entities/spot/model/spot';
import { useCallback, useEffect, useRef, useState } from 'react';

export const useUserDiscussions = (userId: string | undefined, autoFetch = true) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [spotsMap, setSpotsMap] = useState<Map<string, Spot>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUserDiscussions = useCallback(async () => {
    if (!userId) {
      setDiscussions([]);
      setSpotsMap(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedDiscussions = await discussionRepository.getDiscussionsByUser(userId);

      // Ensure discussions sorted by createdAt desc
      fetchedDiscussions.sort(
        (a: Discussion, b: Discussion) =>
          b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
      );
      if (mountedRef.current) setDiscussions(fetchedDiscussions);

      // Fetch spots for each discussion
      const spotIds = [
        ...new Set(fetchedDiscussions.map((d: Discussion) => d.details.spotId).filter(Boolean)),
      ] as string[];
      const spotMap = new Map<string, Spot>();
      await Promise.all(
        spotIds.map(async (spotId) => {
          try {
            const spot = await spotRepository.getSpotById(spotId);
            if (spot) spotMap.set(spotId, spot);
          } catch (e) {
            console.warn(`[useUserDiscussions] failed to fetch spot ${spotId}`, e);
          }
        })
      );
      if (mountedRef.current) setSpotsMap(spotMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user discussions';
      setError(message);
      console.error('[useUserDiscussions] Error:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch && userId) fetchUserDiscussions();
    return () => {
      mountedRef.current = false;
    };
  }, [autoFetch, userId, fetchUserDiscussions]);

  const refetch = useCallback(() => fetchUserDiscussions(), [fetchUserDiscussions]);

  return {
    discussions,
    spotsMap,
    loading,
    error,
    refetch,
  };
};
