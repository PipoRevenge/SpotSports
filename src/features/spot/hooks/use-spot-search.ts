import { SpotRepositoryImpl } from "@/src/api/repositories/implementations/spot-repository-impl";
import { Spot } from "@/src/entities/spot/model/spot";
import { useCallback, useEffect, useState } from "react";
import { SpotSearchFilters } from "../components/spot-search/spot-search-filter-modal";

// Crear instancia del repositorio
const spotRepository = new SpotRepositoryImpl();

interface UseSpotSearchProps {
  initialFilters?: Partial<SpotSearchFilters>;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  searchLocation?: {
    latitude: number;
    longitude: number;
  };
  searchRadius?: number; // Radio de búsqueda en km (para búsqueda en área visible)
  autoSearch?: boolean; // Si debe buscar automáticamente al montar
}

interface UseSpotSearchReturn {
  spots: Spot[];
  filteredSpots: Spot[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: SpotSearchFilters;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: SpotSearchFilters) => void;
  resetFilters: () => void;
  searchSpots: () => void;
  calculateDistance: (spot: Spot) => number | undefined;
}

const DEFAULT_FILTERS: SpotSearchFilters = {
  sports: [],
  sportCriteria: [],
  maxDistance: undefined, // Sin filtro de distancia por defecto
  minRating: 0,
  onlyVerified: false,
};

/**
 * Hook para búsqueda de spots
 * Maneja la lógica de búsqueda usando el repositorio de Firebase
 */
export const useSpotSearch = ({
  initialFilters,
  userLocation,
  searchLocation,
  searchRadius,
  autoSearch = true,
}: UseSpotSearchProps = {}): UseSpotSearchReturn => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SpotSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  // Calcular distancia entre dos coordenadas (fórmula de Haversine)
  const calculateDistance = useCallback((spot: Spot): number | undefined => {
    if (!userLocation) return undefined;

    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(spot.details.location.latitude - userLocation.latitude);
    const dLon = toRad(spot.details.location.longitude - userLocation.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.latitude)) *
        Math.cos(toRad(spot.details.location.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }, [userLocation]);

  // Buscar spots usando el repositorio
  const searchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useSpotSearch] Iniciando búsqueda...');
      console.log('[useSpotSearch] Filtros:', filters);
      console.log('[useSpotSearch] Ubicación del usuario:', userLocation);
      console.log('[useSpotSearch] Ubicación de búsqueda:', searchLocation);
      console.log('[useSpotSearch] Radio de búsqueda:', searchRadius);
      console.log('[useSpotSearch] Query de búsqueda:', searchQuery);

      // Determinar la ubicación y distancia a usar
      // Si hay searchLocation y searchRadius, usarlos (búsqueda en área visible)
      // Si no, usar userLocation y maxDistance del filtro (búsqueda normal)
      const effectiveLocation = searchLocation || userLocation;
      const effectiveDistance = searchRadius || filters.maxDistance;

      console.log('[useSpotSearch] Ubicación efectiva:', effectiveLocation);
      console.log('[useSpotSearch] Distancia efectiva:', effectiveDistance);

      // Construir filtros para el repositorio
      const repoFilters = {
        searchQuery: searchQuery.trim() || undefined,
        location: effectiveLocation,
        maxDistance: effectiveDistance,
        sportIds: filters.sports.map(s => s.id),
        sportCriteria: filters.sportCriteria,
        minRating: filters.minRating,
        onlyVerified: filters.onlyVerified,
        sortBy: 'distance' as const,
        sortOrder: 'asc' as const,
        limit: 100, // Límite inicial
      };

      // Llamar al repositorio
      const results = await spotRepository.searchSpots(repoFilters);
      
      console.log(`[useSpotSearch] Búsqueda completada: ${results.length} spots encontrados`);
      
      setSpots(results);
      setFilteredSpots(results);
    } catch (err) {
      console.error('[useSpotSearch] Error en búsqueda:', err);
      setError(err instanceof Error ? err.message : "Error al buscar spots");
      setSpots([]);
      setFilteredSpots([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, userLocation, searchLocation, searchRadius]);

  // Resetear filtros
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  }, []);

  // Buscar spots cuando cambian ciertos parámetros (pero NO el searchQuery ni filters)
  useEffect(() => {
    if (autoSearch) {
      searchSpots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, searchLocation, searchRadius, autoSearch]);

  return {
    spots,
    filteredSpots,
    loading,
    error,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
    searchSpots,
    calculateDistance,
  };
};
