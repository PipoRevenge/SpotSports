import { Spot } from "@/src/entities/spot/model/spot";
import { useCallback, useEffect, useState } from "react";
import { SpotSearchFilters } from "../components/spot-search/spot-search-filter-modal";

interface UseSpotSearchProps {
  initialFilters?: Partial<SpotSearchFilters>;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
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
  maxDistance: 10,
  minRating: 0,
  onlyVerified: false,
};

/**
 * Hook para búsqueda de spots
 * Maneja la lógica de búsqueda, filtrado y cálculo de distancias
 */
export const useSpotSearch = ({
  initialFilters,
  userLocation,
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

  // Filtrar spots según los criterios
  const applyFilters = useCallback((spotsToFilter: Spot[]): Spot[] => {
    let result = [...spotsToFilter];

    // Filtro por texto de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (spot) =>
          spot.details.name.toLowerCase().includes(query) ||
          spot.details.description.toLowerCase().includes(query)
      );
    }

    // Filtro por deportes
    if (filters.sports.length > 0) {
      const sportIds = filters.sports.map((s) => s.id);
      result = result.filter((spot) =>
        spot.details.availableSports.some((sportId) =>
          sportIds.includes(sportId)
        )
      );
    }

    // Filtro por rating
    if (filters.minRating > 0) {
      result = result.filter(
        (spot) => spot.details.overallRating >= filters.minRating
      );
    }

    // Filtro por verificación
    if (filters.onlyVerified) {
      result = result.filter((spot) => spot.metadata.isVerified);
    }

    // Filtro por distancia
    if (userLocation && filters.maxDistance > 0) {
      result = result.filter((spot) => {
        const distance = calculateDistance(spot);
        return distance !== undefined && distance <= filters.maxDistance;
      });
    }

    // Ordenar por distancia si hay ubicación del usuario
    if (userLocation) {
      result.sort((a, b) => {
        const distA = calculateDistance(a) || Infinity;
        const distB = calculateDistance(b) || Infinity;
        return distA - distB;
      });
    }

    return result;
  }, [searchQuery, filters, userLocation, calculateDistance]);

  // Buscar spots (simulado - aquí iría la llamada a la API)
  const searchSpots = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Reemplazar con llamada real a la API
      // const response = await spotRepository.searchSpots({ query: searchQuery, filters });
      
      // Simulación de datos
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Aquí deberías obtener los datos de Firebase/API
      const mockSpots: Spot[] = [
        // Datos de ejemplo - reemplazar con datos reales
      ];

      setSpots(mockSpots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar spots");
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  // Resetear filtros
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Aplicar filtros cuando cambien los spots o los criterios de filtrado
  useEffect(() => {
    const filtered = applyFilters(spots);
    setFilteredSpots(filtered);
  }, [spots, searchQuery, filters, userLocation, applyFilters]);

  // Buscar spots al montar el componente
  useEffect(() => {
    searchSpots();
  }, []);

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
