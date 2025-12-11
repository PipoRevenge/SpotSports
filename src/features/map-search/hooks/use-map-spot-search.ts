import { sportRepository, spotRepository } from "@/src/api/repositories";

import { Sport as SportEntity } from "@/src/entities/sport/model/sport";
import { Spot } from "@/src/entities/spot/model/spot";
import { SpotSearchFilters } from '@/src/features/spot/types/spot-search-types';
import { DifficultyLevel } from "@/src/types/difficulty";
import { useCallback, useEffect, useState } from "react";
import { Region } from "react-native-maps";
import { calculateDistance, calculateSearchArea } from "../utils/map-helpers";

// Caché simple en memoria para spots
const spotCache = new Map<string, { spot: Spot; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene un spot del caché si está disponible y no ha expirado
 */
const getCachedSpot = (spotId: string): Spot | null => {
  const cached = spotCache.get(spotId);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    spotCache.delete(spotId);
    return null;
  }
  
  return cached.spot;
};

/**
 * Guarda un spot en el caché
 */
const cacheSpot = (spot: Spot): void => {
  spotCache.set(spot.id, {
    spot,
    timestamp: Date.now()
  });
};

/**
 * Mapea DifficultyLevel del frontend al formato del repositorio
 */
const mapDifficultyToRepoFormat = (difficulty: DifficultyLevel): 'easy' | 'intermediate' | 'hard' => {
  switch (difficulty) {
    case 'Beginner':
      return 'easy';
    case 'Intermediate':
      return 'intermediate';
    case 'Advanced':
    case 'Expert':
      return 'hard';
    default:
      return 'easy';
  }
};


interface UseMapSpotSearchProps {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  initialFilters?: Partial<SpotSearchFilters>;
  autoSearch?: boolean;
}

interface UseMapSpotSearchReturn {
  // Datos
  spots: Spot[];
  filteredSpots: Spot[];
  loading: boolean;
  error: string | null;
  
  // Búsqueda
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchSpots: () => void;
  
  // Filtros
  filters: SpotSearchFilters;
  setFilters: (filters: SpotSearchFilters) => void;
  resetFilters: () => void;
  
  // Ordenamiento
  sortBy: 'distance' | 'rating' | 'name';
  setSortBy: (sortBy: 'distance' | 'rating' | 'name') => void;
  
  // Mapa
  mapRegion: Region | undefined;
  setMapRegion: (region: Region) => void;
  shouldCenterOnUser: boolean;
  
  // Utilidades
  calculateDistance: (spot: Spot) => number | undefined;
  getSportName: (sportId: string) => string;
  sportsMap: Map<string, string>;
  loadingSports: boolean;
  
  // Actualización
  refetchSpot: (spotId: string) => Promise<void>;
}

const DEFAULT_FILTERS: SpotSearchFilters = {
  sports: [],
  sportCriteria: [],
  maxDistance: undefined,
  minRating: 0,
  onlyVerified: false,
};

/**
 * Hook integrado para búsqueda de spots en mapa
 * 
 * Responsabilidades:
 * - Gestiona la región visible del mapa
 * - Calcula automáticamente el área de búsqueda basado en la región visible
 * - Si hay maxDistance definido en filtros, lo usa en vez del área visible
 * - Maneja la búsqueda de spots y el mapeo de nombres de deportes
 * 
 * Lógica de búsqueda:
 * - CON maxDistance: Busca en círculo desde ubicación del usuario con ese radio
 * - SIN maxDistance: Busca en el área visible del mapa (región actual)
 */
export const useMapSpotSearch = ({
  userLocation,
  initialFilters,
  autoSearch = true,
}: UseMapSpotSearchProps = {}): UseMapSpotSearchReturn => {
  // ==================== ESTADO ====================
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  const [filters, setFilters] = useState<SpotSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Estado del mapa
  const [mapRegion, setMapRegionState] = useState<Region | undefined>(undefined);
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(true);

  // Estado de deportes
  const [sportsMap, setSportsMap] = useState<Map<string, string>>(new Map());
  const [loadingSports, setLoadingSports] = useState(false);

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Calcula la distancia entre un spot y la ubicación del usuario
   */
  const calculateSpotDistance = useCallback((spot: Spot): number | undefined => {
    if (!userLocation) return undefined;
    return calculateDistance(userLocation, spot.details.location);
  }, [userLocation]);

  /**
   * Obtiene el nombre de un deporte por su ID
   */
  const getSportName = useCallback(
    (sportId: string): string => {
      return sportsMap.get(sportId) || sportId;
    },
    [sportsMap]
  );

  // ==================== BÚSQUEDA ====================

  /**
   * Ejecuta la búsqueda de spots
   * 
   * Lógica:
   * - Si hay maxDistance en filtros: busca desde ubicación del usuario con ese radio
   * - Si NO hay maxDistance pero hay región del mapa: busca en el área visible
   * - Si no hay ninguno: busca sin filtro de ubicación
   */
  const searchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let searchLocation: { latitude: number; longitude: number } | undefined;
      let searchRadius: number | undefined;

      // Determinar ubicación y radio de búsqueda
      if (filters.maxDistance !== undefined) {
        // CASO 1: Usuario especificó distancia máxima -> buscar desde su ubicación
        searchLocation = userLocation;
        searchRadius = filters.maxDistance;
      } else if (mapRegion) {
        // CASO 2: No hay maxDistance -> buscar en área visible del mapa
        const area = calculateSearchArea(mapRegion);
        searchLocation = area.centerLocation;
        searchRadius = area.calculatedRadius;
      } else {
        // CASO 3: No hay ni maxDistance ni región -> usar ubicación del usuario sin radio
        searchLocation = userLocation;
        searchRadius = undefined;
      }

      // Construir filtros para el repositorio
      const repoFilters = {
        searchQuery: searchQuery.trim() || undefined,
        location: searchLocation,
        maxDistance: searchRadius,
        sportIds: filters.sports.map(s => s.id),
        sportCriteria: filters.sportCriteria.map(criteria => ({
          sportId: criteria.sportId,
          difficulty: criteria.difficulty ? mapDifficultyToRepoFormat(criteria.difficulty) : undefined,
          minRating: criteria.minRating,
        })),
        minRating: filters.minRating,
        onlyVerified: filters.onlyVerified,
        sortBy: 'distance' as const,
        sortOrder: 'asc' as const,
        limit: 100,
      };

      // Llamar al repositorio
      const results = await spotRepository.searchSpots(repoFilters);
      
      setSpots(results);
      setFilteredSpots(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar spots");
      setSpots([]);
      setFilteredSpots([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, userLocation, mapRegion]);

  /**
   * Resetea los filtros
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setSortBy('distance');
  }, []);

  /**
   * Actualiza la región del mapa
   */
  const setMapRegion = useCallback((region: Region) => {
    setMapRegionState(region);

    // Después de la primera vez, no centramos más en el usuario
    if (shouldCenterOnUser) {
      setShouldCenterOnUser(false);
    }
  }, [shouldCenterOnUser]);

  /**
   * Actualiza un spot específico en la lista de spots
   * Útil para refrescar un spot después de crear una review
   */
  const refetchSpot = useCallback(async (spotId: string) => {
    try {
      // Primero verificar si está en caché y no ha expirado
      const cachedSpot = getCachedSpot(spotId);
      if (cachedSpot) {
        // Actualizar con datos en caché inmediatamente
        setSpots(prevSpots => {
          const index = prevSpots.findIndex(s => s.id === spotId);
          if (index === -1) return prevSpots;
          
          const newSpots = [...prevSpots];
          newSpots[index] = cachedSpot;
          return newSpots;
        });

        setFilteredSpots(prevFiltered => {
          const index = prevFiltered.findIndex(s => s.id === spotId);
          if (index === -1) return prevFiltered;
          
          const newFiltered = [...prevFiltered];
          newFiltered[index] = cachedSpot;
          return newFiltered;
        });
      }
      
      // Buscar el spot actualizado en segundo plano
      const updatedSpot = await spotRepository.getSpotById(spotId);
      
      if (!updatedSpot) {
        console.log(`[useMapSpotSearch] Spot ${spotId} not found during refetch`);
        return;
      }

      // Guardar en caché
      cacheSpot(updatedSpot);

      // Actualizar en la lista de spots
      setSpots(prevSpots => {
        const index = prevSpots.findIndex(s => s.id === spotId);
        if (index === -1) {
          // El spot no está en la lista actual, no hacer nada
          return prevSpots;
        }
        
        const newSpots = [...prevSpots];
        newSpots[index] = updatedSpot;
        return newSpots;
      });

      // También actualizar en filteredSpots
      setFilteredSpots(prevFiltered => {
        const index = prevFiltered.findIndex(s => s.id === spotId);
        if (index === -1) {
          return prevFiltered;
        }
        
        const newFiltered = [...prevFiltered];
        newFiltered[index] = updatedSpot;
        return newFiltered;
      });
    } catch (err) {
      // Error silencioso según requerimientos
      console.log(`[useMapSpotSearch] Error refetching spot ${spotId}:`, err);
    }
  }, []);

  // ==================== EFECTOS ====================

  /**
   * Cargar deportes al inicializar
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
      } catch {
        // Error silencioso - los deportes se cargarán en el próximo intento
      } finally {
        setLoadingSports(false);
      }
    };

    loadSports();
  }, []);

  /**
   * Ordenar spots cuando cambia el criterio de ordenamiento
   */
  useEffect(() => {
    if (spots.length === 0) return;

    const sorted = [...spots].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          if (!userLocation) return 0;
          const distA = calculateDistance(userLocation, a.details.location);
          const distB = calculateDistance(userLocation, b.details.location);
          return distA - distB;
        
        case 'rating':
          return b.details.overallRating - a.details.overallRating;
        
        case 'name':
          return a.details.name.localeCompare(b.details.name);
        
        default:
          return 0;
      }
    });

    setFilteredSpots(sorted);
  }, [sortBy, spots, userLocation]);

  /**
   * Búsqueda automática cuando cambia la región del mapa
   * Solo si NO hay maxDistance definido (búsqueda en área visible)
   */
  useEffect(() => {
    if (!autoSearch || !mapRegion) return;

    // Solo buscar automáticamente si NO hay maxDistance
    if (filters.maxDistance === undefined) {
      // Debounce de 1 segundo
      const timeout = setTimeout(() => {
        searchSpots();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [mapRegion, autoSearch, filters.maxDistance, searchSpots]);

  /**
   * Búsqueda automática inicial cuando se obtiene ubicación del usuario
   */
  useEffect(() => {
    if (autoSearch && userLocation && !mapRegion) {
      searchSpots();
    }
  }, [autoSearch, userLocation, mapRegion, searchSpots]);

  return {
    spots,
    filteredSpots,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchSpots,
    filters,
    setFilters,
    resetFilters,
    sortBy,
    setSortBy,
    mapRegion,
    setMapRegion,
    shouldCenterOnUser,
    calculateDistance: calculateSpotDistance,
    getSportName,
    sportsMap,
    loadingSports,
    refetchSpot,
  };
};
