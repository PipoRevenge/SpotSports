import { sportRepository, spotRepository } from "@/src/api/repositories";

import { Sport as SportEntity } from "@/src/entities/sport/model/sport";
import { Spot } from "@/src/entities/spot/model/spot";
import { SpotSearchFilters } from "@/src/features/spot/components/spot-search/spot-search-filter-modal";
import { useCallback, useEffect, useState } from "react";
import { Region } from "react-native-maps";
import { calculateDistance, calculateSearchArea } from "../utils/map-helpers";


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
      console.log('[useMapSpotSearch] Iniciando búsqueda...');
      console.log('[useMapSpotSearch] Filtros:', filters);
      console.log('[useMapSpotSearch] Ubicación del usuario:', userLocation);
      console.log('[useMapSpotSearch] Región del mapa:', mapRegion);

      let searchLocation: { latitude: number; longitude: number } | undefined;
      let searchRadius: number | undefined;

      // Determinar ubicación y radio de búsqueda
      if (filters.maxDistance !== undefined) {
        // CASO 1: Usuario especificó distancia máxima -> buscar desde su ubicación
        console.log('[useMapSpotSearch] Modo: Búsqueda con maxDistance desde ubicación usuario');
        searchLocation = userLocation;
        searchRadius = filters.maxDistance;
      } else if (mapRegion) {
        // CASO 2: No hay maxDistance -> buscar en área visible del mapa
        console.log('[useMapSpotSearch] Modo: Búsqueda en área visible del mapa');
        const area = calculateSearchArea(mapRegion);
        searchLocation = area.centerLocation;
        searchRadius = area.calculatedRadius;
      } else {
        // CASO 3: No hay ni maxDistance ni región -> usar ubicación del usuario sin radio
        console.log('[useMapSpotSearch] Modo: Búsqueda desde ubicación usuario sin radio');
        searchLocation = userLocation;
        searchRadius = undefined;
      }

      console.log('[useMapSpotSearch] Ubicación efectiva:', searchLocation);
      console.log('[useMapSpotSearch] Radio efectivo:', searchRadius);

      // Construir filtros para el repositorio
      const repoFilters = {
        searchQuery: searchQuery.trim() || undefined,
        location: searchLocation,
        maxDistance: searchRadius,
        sportIds: filters.sports.map(s => s.id),
        sportCriteria: filters.sportCriteria,
        minRating: filters.minRating,
        onlyVerified: filters.onlyVerified,
        sortBy: 'distance' as const,
        sortOrder: 'asc' as const,
        limit: 100,
      };

      console.log('[useMapSpotSearch] Filtros para repositorio:', JSON.stringify(repoFilters, null, 2));

      // Llamar al repositorio
      const results = await spotRepository.searchSpots(repoFilters);
      
      console.log(`[useMapSpotSearch] Búsqueda completada: ${results.length} spots encontrados`);
      
      setSpots(results);
      setFilteredSpots(results);
    } catch (err) {
      console.error('[useMapSpotSearch] Error en búsqueda:', err);
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
    console.log('[useMapSpotSearch] setMapRegion called:', region);
    setMapRegionState(region);

    // Después de la primera vez, no centramos más en el usuario
    if (shouldCenterOnUser) {
      setShouldCenterOnUser(false);
    }
  }, [shouldCenterOnUser]);

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
        console.log(`[useMapSpotSearch] Cargados ${map.size} deportes`);
      } catch (error) {
        console.error("[useMapSpotSearch] Error cargando deportes:", error);
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
      console.log('[useMapSpotSearch] Región cambió y NO hay maxDistance -> búsqueda automática en área visible');
      
      // Debounce de 1 segundo
      const timeout = setTimeout(() => {
        searchSpots();
      }, 1000);

      return () => clearTimeout(timeout);
    } else {
      console.log('[useMapSpotSearch] Región cambió pero HAY maxDistance -> no buscar automáticamente');
    }
  }, [mapRegion, autoSearch, filters.maxDistance, searchSpots]);

  /**
   * Búsqueda automática inicial cuando se obtiene ubicación del usuario
   */
  useEffect(() => {
    if (autoSearch && userLocation && !mapRegion) {
      console.log('[useMapSpotSearch] Búsqueda inicial con ubicación del usuario');
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
  };
};
