import { sportRepository } from "@/src/api/repositories";
import { useQuery } from "@/src/lib/react-query";
import { useCallback, useMemo } from "react";

/**
 * Hook para obtener nombres de deportes a partir de sus IDs
 * Cachea los resultados para evitar llamadas repetidas
 */
export const useSportNames = (sportIds: string[]) => {
  const sortedIds = useMemo(() => [...sportIds].sort(), [sportIds]);

  const query = useQuery({
    queryKey: ['sports', 'names', sortedIds],
    enabled: sortedIds.length > 0,
    meta: { persist: true },
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const sportsPromises = sortedIds.map(id => sportRepository.getSportById(id).catch(() => null));
      const sports = await Promise.all(sportsPromises);
      const map: Record<string, string> = {};
      sports.forEach((sport, index) => {
        if (sport) {
          map[sortedIds[index]] = sport.details.name;
        }
      });
      return map;
    },
  });

  const getSportName = useCallback((sportId: string): string => {
    return query.data?.[sportId] || sportId;
  }, [query.data]);

  return {
    sportNames: query.data ?? {},
    getSportName,
    loading: query.isLoading || query.isFetching,
  };
};
