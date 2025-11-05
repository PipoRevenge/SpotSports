import { SportRepositoryImpl } from "@/src/api/repositories/implementations/sport-repository-impl";
import { Sport as SportEntity } from "@/src/entities/sport/model/sport";
import { useCallback, useEffect, useState } from "react";
import { SpotSearchFilters } from "../components/spot-search/spot-search-filter-modal";
import { useSpotSearch } from "./use-spot-search";

// Crear instancia del repositorio de deportes
const sportRepository = new SportRepositoryImpl();

interface UseSpotMapSearchProps {
  initialFilters?: Partial<SpotSearchFilters>;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  searchLocation?: {
    latitude: number;
    longitude: number;
  };
  searchRadius?: number;
  autoSearch?: boolean;
}

interface UseSpotMapSearchReturn extends ReturnType<typeof useSpotSearch> {
  getSportName: (sportId: string) => string;
  sportsMap: Map<string, string>;
  loadingSports: boolean;
}

/**
 * Hook extendido para búsqueda de spots en mapa
 * Extiende useSpotSearch agregando funcionalidad para obtener nombres de deportes
 */
export const useSpotMapSearch = (props: UseSpotMapSearchProps = {}): UseSpotMapSearchReturn => {
  // Usar el hook base de búsqueda de spots
  const spotSearch = useSpotSearch(props);

  // Estado para almacenar el mapeo de sportId -> sportName
  const [sportsMap, setSportsMap] = useState<Map<string, string>>(new Map());
  const [loadingSports, setLoadingSports] = useState(false);

  /**
   * Cargar todos los deportes al inicializar
   */
  useEffect(() => {
    const loadSports = async () => {
      setLoadingSports(true);
      try {
        const sports = await sportRepository.getAllSports();
        const map = new Map<string, string>();
        sports.forEach((sport: SportEntity) => {
          map.set(sport.id, sport.details.name);
        });
        setSportsMap(map);
        console.log(`[useSpotMapSearch] Loaded ${map.size} sports`);
      } catch (error) {
        console.error("[useSpotMapSearch] Error loading sports:", error);
      } finally {
        setLoadingSports(false);
      }
    };

    loadSports();
  }, []);

  /**
   * Obtiene el nombre de un deporte por su ID
   * Si no encuentra el nombre, retorna el ID
   */
  const getSportName = useCallback(
    (sportId: string): string => {
      return sportsMap.get(sportId) || sportId;
    },
    [sportsMap]
  );

  return {
    ...spotSearch,
    getSportName,
    sportsMap,
    loadingSports,
  };
};
