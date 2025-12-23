import { spotRepository } from '@/src/api/repositories';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import { useQuery } from '@tanstack/react-query';

export const useSpotSports = (spotId?: string) => {
  return useQuery<SimpleSport[], Error>({
    queryKey: ['spot', spotId, 'sports'],
    queryFn: async () => {
      if (!spotId) return [];
      const spot = await spotRepository.getSpotById(spotId);
      const raw = (spot as any)?.details?.availableSports ?? [];

      // Normalize: accept array of strings or array of objects (SimpleSport)
      const normalized: SimpleSport[] = raw.map((r: any) => {
        if (typeof r === 'string') return { id: r, name: r } as SimpleSport;
        return { id: r.id ?? r.name, name: r.name ?? r.id, description: r.description, category: r.category } as SimpleSport;
      });

      return normalized;
    },
    enabled: !!spotId,
  });
};
