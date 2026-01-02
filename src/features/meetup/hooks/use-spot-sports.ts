import { sportRepository, spotRepository } from '@/src/api/repositories';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import { useQuery } from '@tanstack/react-query';

export const useSpotSports = (spotId?: string) => {
  return useQuery<SimpleSport[], Error>({
    queryKey: ['spot', spotId, 'sports'],
    queryFn: async () => {
      if (!spotId) return [];
      
      // Get spot data
      const spot = await spotRepository.getSpotById(spotId);
      const sportIds = (spot as any)?.details?.availableSports ?? [];
      
      if (!sportIds || sportIds.length === 0) return [];
      
      // Get sport names from sport repository
      const sportsPromises = sportIds.map(async (idOrObj: any) => {
        const sportId = typeof idOrObj === 'string' ? idOrObj : (idOrObj?.id ?? idOrObj?.name);
        if (!sportId) return null;
        
        try {
          const sport = await sportRepository.getSportById(sportId);

          // Si el repositorio no devuelve deporte, fallback a ID
          if (!sport) {
            return {
              id: sportId,
              name: sportId,
            } as SimpleSport;
          }

          return {
            id: sport.id,
            name: sport.details.name,
            description: sport.details.description,
            category: sport.details.category,
          } as SimpleSport;
        } catch (error) {
          console.warn('[useSpotSports] Failed to fetch sport:', sportId, error);
          return {
            id: sportId,
            name: sportId, // Fallback to ID if sport not found
          } as SimpleSport;
        }
      });
      
      const sports = await Promise.all(sportsPromises);
      return sports.filter((s): s is SimpleSport => s !== null);
    },
    enabled: !!spotId,
    staleTime: 5 * 60_000, // Cache sport names for 5 minutes
  });
};
