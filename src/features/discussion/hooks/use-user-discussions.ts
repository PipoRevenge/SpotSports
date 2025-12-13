import { discussionRepository, spotRepository } from '@/src/api/repositories';
import { Spot } from '@/src/entities/spot/model/spot';
import { useQuery } from '@/src/lib/react-query';

export const useUserDiscussions = (userId: string | undefined, autoFetch = true) => {
  const qk = ['userDiscussions', userId];
  const query = useQuery({
    queryKey: qk,
    queryFn: async () => {
      if (!userId) return { discussions: [], spotsMap: new Map<string, Spot>() };
      const fetchedDiscussions = await discussionRepository.getDiscussionsByUser(userId);
      fetchedDiscussions.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
      const spotIds = [...new Set(fetchedDiscussions.map(d => d.details.spotId).filter(Boolean))] as string[];
      const spotMap = new Map<string, Spot>();
      await Promise.all(spotIds.map(async (spotId) => {
        try {
          const spot = await spotRepository.getSpotById(spotId);
          if (spot) spotMap.set(spotId, spot);
        } catch (e) {
          console.warn(`[useUserDiscussions] failed to fetch spot ${spotId}`, e);
        }
      }));
      return { discussions: fetchedDiscussions, spotsMap: spotMap };
    },
    enabled: !!userId && autoFetch,
  });

  return {
    discussions: query.data?.discussions ?? [],
    spotsMap: query.data?.spotsMap ?? new Map<string, Spot>(),
    loading: query.isLoading,
    error: query.isError ? (query.error as Error)?.message : null,
    refetch: () => query.refetch(),
  };
};
