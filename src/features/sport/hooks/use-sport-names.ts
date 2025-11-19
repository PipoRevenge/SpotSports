import { sportRepository } from "@/src/api/repositories";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook para obtener nombres de deportes a partir de sus IDs
 * Cachea los resultados para evitar llamadas repetidas
 */
export const useSportNames = (sportIds: string[]) => {
  const [sportNames, setSportNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSportNames = async () => {
      if (sportIds.length === 0) {
        setSportNames({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Obtener deportes en paralelo
        const sportsPromises = sportIds.map(id => 
          sportRepository.getSportById(id).catch(() => null)
        );
        const sports = await Promise.all(sportsPromises);

        // Crear mapa de ID → nombre
        const newNames: Record<string, string> = {};
        sports.forEach((sport, index) => {
          if (sport) {
            newNames[sportIds[index]] = sport.details.name;
          }
        });

        setSportNames(newNames);
      } catch (error) {
        console.error("Error loading sport names:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSportNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportIds.join(',')]);

  /**
   * Obtener el nombre de un deporte por su ID
   * Retorna el ID si no se encuentra el nombre
   */
  const getSportName = useCallback((sportId: string): string => {
    return sportNames[sportId] || sportId;
  }, [sportNames]);

  return {
    sportNames,
    getSportName,
    loading,
  };
};
