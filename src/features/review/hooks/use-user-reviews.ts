import { reviewRepository, spotRepository, userRepository } from '@/src/api/repositories';
import { Review } from '@/src/entities/review/model/review';
import { Spot } from '@/src/entities/spot/model/spot';
import { User } from '@/src/entities/user/model/user';
import { useCallback, useEffect, useRef, useState } from 'react';

export const useUserReviews = (userId: string | undefined, autoFetch = true) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [spotsMap, setSpotsMap] = useState<Map<string, Spot>>(new Map());
  const [usersData, setUsersData] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUserReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      setSpotsMap(new Map());
      setUsersData(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedReviews = await reviewRepository.getReviewsByUser(userId);

      // Ensure reviews sorted by createdAt desc
      fetchedReviews.sort((a: Review, b: Review) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
      if (mountedRef.current) setReviews(fetchedReviews);

      // Fetch spots
      const spotIds = [...new Set(fetchedReviews.map((r: Review) => r.details.spotId).filter(Boolean))] as string[];
      const spotMap = new Map<string, Spot>();
      await Promise.all(
        spotIds.map(async (spotId) => {
          try {
            const spot = await spotRepository.getSpotById(spotId);
            if (spot) spotMap.set(spotId, spot);
          } catch (e) {
            console.warn(`[useUserReviews] failed to fetch spot ${spotId}`, e);
          }
        })
      );
      if (mountedRef.current) setSpotsMap(spotMap);

      // Fetch all creators' user data referenced in reviews
      const userIds = [...new Set(fetchedReviews.map((r: Review) => r.metadata.createdBy).filter(Boolean))] as string[];
      const usersMap = new Map<string, User>();
      await Promise.all(
        userIds.map(async (uId) => {
          try {
            const profileUser = await userRepository.getUserById(uId);
            if (profileUser) usersMap.set(uId, profileUser);
          } catch (e) {
            console.warn(`[useUserReviews] failed to fetch user ${uId}`, e);
          }
        })
      );
      if (mountedRef.current) setUsersData(usersMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user reviews';
      setError(message);
      console.error('[useUserReviews] Error:', err);

      // Gracefully handle Firestore Index requirement error
      // If index is missing, it means there are likely no complex queries possible yet, or just wait.
      // We can treat this as "no reviews" to avoid crashing UI while index builds.
      if (message.includes('requires an index') || message.includes('failed-precondition')) {
         console.warn('[useUserReviews] Index missing. This is normal for new queries. Please create the index using the link in the console.');
         // Temporarily treat as success with empty list to allow UI to render
         if (mountedRef.current) {
            setReviews([]);
            setError(null); // Clear error so UI doesn't show error state
         }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch && userId) fetchUserReviews();
    return () => { mountedRef.current = false; };
  }, [autoFetch, userId, fetchUserReviews]);

  const refetch = useCallback(() => fetchUserReviews(), [fetchUserReviews]);

  return {
    reviews,
    spotsMap,
    usersData,
    loading,
    error,
    refetch,
  };
};

export default useUserReviews;
