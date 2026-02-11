import { sportRepository, spotRepository } from "@/src/api/repositories";

import { Sport as SportEntity } from "@/src/entities/sport/model/sport";
import { Spot } from "@/src/entities/spot/model/spot";
import { SpotSearchFilters } from '@/src/features/spot/types/spot-search-types';
import { useQuery, useQueryClient } from '@/src/lib/react-query';
import { DifficultyLevel } from "@/src/types/difficulty";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const queryClient = useQueryClient();
  // ==================== ESTADO ====================
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedRegion, setAppliedRegion] = useState<Region | undefined>(undefined);
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
  // useQuery-based repoFilters to fetch spots
  const repoFilters = useMemo(() => {
    let searchLocation: { latitude: number; longitude: number } | undefined;
    let searchRadius: number | undefined;

    if (filters.maxDistance !== undefined) {
      searchLocation = userLocation;
      searchRadius = filters.maxDistance;
    } else if (appliedRegion) {
      const area = calculateSearchArea(appliedRegion);
      searchLocation = area.centerLocation;
      searchRadius = area.calculatedRadius;
    } else {
      searchLocation = userLocation;
      searchRadius = undefined;
    }

    return {
      searchQuery: appliedQuery.trim() || undefined,
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
  }, [appliedQuery, filters, userLocation, appliedRegion]);

  const spotsQuery = useQuery({
    queryKey: ['spots', repoFilters],
    queryFn: async () => await spotRepository.searchSpots(repoFilters),
    enabled: true,
  });

  const searchSpots = useCallback(async () => {
    setAppliedQuery(searchQuery);
    setAppliedRegion(mapRegion);
    // Invalidate or refetch spots query
    await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'spots' });
  }, [searchQuery, mapRegion, queryClient]);

  /**
   * Resetea los filtros
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setAppliedQuery("");
    setSortBy('distance');
  }, []);

  /**
   * Actualiza la región del mapa
   */
  const setMapRegion = useCallback((region: Region) => {
    setMapRegionState(region);

    // Solo dejamos de centrar en el usuario cuando ya tenemos su ubicación
    // (evita que onRegionChangeComplete con la región por defecto desactive el centrado)
    if (shouldCenterOnUser && userLocation) {
      setShouldCenterOnUser(false);
    }
  }, [shouldCenterOnUser, userLocation]);

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
  const sportsQuery = useQuery({
    queryKey: ['sports', 'all'],
    queryFn: async () => await sportRepository.getAllSports(),
    enabled: true,
  });

  // Keep a small local state for the sports map
  useEffect(() => {
    setLoadingSports(sportsQuery.isLoading);
    if (!sportsQuery.data) return;

    const map = new Map<string, string>();

    // react-query cache might hold either an array of SportEntity (from repo) or a Map (from a Map hook)
    // We handle both to avoid runtime errors when the cached value shape differs.
    if (Array.isArray(sportsQuery.data)) {
      (sportsQuery.data as SportEntity[]).forEach((sport) => {
        if (sport && sport.id && sport.details && sport.details.name) map.set(sport.id, sport.details.name);
      });
    } else if ((sportsQuery.data as any)?.get && typeof (sportsQuery.data as any).get === 'function') {
      // Map<id, SimpleSport> or Map<id, string>
      (sportsQuery.data as Map<string, any>).forEach((value, key) => {
        if (!value) return;
        if (typeof value === 'string') map.set(key, value);
        else if (value.name) map.set(key, value.name);
        else if (value.details?.name) map.set(key, value.details.name);
      });
    } else {
      // Fallback: try treating it as an iterable
      try {
        for (const sport of (sportsQuery.data as any)) {
          if (sport && sport.id && (sport.details?.name || sport.name)) {
            map.set(sport.id, sport.details?.name || sport.name);
          }
        }
      } catch (_e) {
        // ignore
      }
    }

    setSportsMap(map);
  }, [sportsQuery.data, sportsQuery.isLoading]);

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
   * Sincronizar searchQuery con appliedQuery si autoSearch está activado
   */
  useEffect(() => {
    if (autoSearch && searchQuery !== appliedQuery) {
      const timeout = setTimeout(() => {
        setAppliedQuery(searchQuery);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery, autoSearch, appliedQuery]);

  /**
   * Búsqueda automática inicial cuando se obtiene ubicación del usuario
   */
  useEffect(() => {
    if (autoSearch && userLocation && !mapRegion) {
      if (shouldCenterOnUser) {
        setMapRegionState({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
      searchSpots();
    }
  }, [autoSearch, userLocation, mapRegion, searchSpots, shouldCenterOnUser]);

  // Keep local state derived from react-query result
  useEffect(() => {
    setLoading(spotsQuery.isLoading);
    setError(spotsQuery.isError ? (spotsQuery.error as Error)?.message || 'Error al buscar spots' : null);
    if (spotsQuery.data) {
      setSpots(spotsQuery.data);
      setFilteredSpots(spotsQuery.data);
    }
  }, [spotsQuery.data, spotsQuery.isLoading, spotsQuery.isError, spotsQuery.error]);

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
