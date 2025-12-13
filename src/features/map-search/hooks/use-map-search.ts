import { useQuery, useQueryClient } from '@/src/lib/react-query';
import { GeoPoint } from "@/src/types/geopoint";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BaseMapSearchFilters,
  MapSearchState,
} from "../types/map-types";
import {
  sortResults,
  transformToSearchResults,
} from "../utils/map-helpers";

/**
 * Configuración del hook de búsqueda en mapa
 */
export interface UseMapSearchConfig<T, F> {
  // Función de búsqueda que se ejecuta para obtener los items
  searchFunction: (filters: F, userLocation: GeoPoint | undefined) => Promise<T[]>;
  
  // Función para extraer la ubicación de un item
  getLocation: (item: T) => GeoPoint;
  
  // Funciones opcionales para ordenamiento
  getters?: {
    getRating?: (item: T) => number;
    getName?: (item: T) => string;
    getDate?: (item: T) => Date;
  };
  
  // Configuración inicial
  initialFilters?: F;
  autoSearch?: boolean; // Si debe buscar automáticamente al inicializar
  debounceMs?: number; // Tiempo de debounce para búsqueda (default: 300ms)
}

/**
 * Resultado del hook de búsqueda en mapa
 */
export interface UseMapSearchResult<T, F> {
  // Estado
  state: MapSearchState<T>;
  filters: F;
  userLocation: GeoPoint | undefined;
  
  // Acciones
  search: () => Promise<void>;
  updateFilters: (newFilters: Partial<F>) => void;
  resetFilters: () => void;
  setUserLocation: (location: GeoPoint | undefined) => void;
  
  // Utilidades
  isSearching: boolean;
  hasResults: boolean;
  isEmpty: boolean;
}

/**
 * Hook genérico para búsqueda en mapa
 * 
 * @template T - Tipo de entidad (Spot, Event, etc.)
 * @template F - Tipo de filtros (debe extender BaseMapSearchFilters)
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   filters,
 *   search,
 *   updateFilters
 * } = useMapSearch<Spot, SpotMapSearchFilters>({
 *   searchFunction: async (filters, userLocation) => {
 *     return await spotRepository.searchSpots(filters, userLocation);
 *   },
 *   getLocation: (spot) => spot.details.location,
 *   getters: {
 *     getRating: (spot) => spot.details.overallRating,
 *     getName: (spot) => spot.details.name,
 *     getDate: (spot) => spot.metadata.createdAt,
 *   },
 * });
 * ```
 */
export const useMapSearch = <T, F = BaseMapSearchFilters>(
  config: UseMapSearchConfig<T, F>
): UseMapSearchResult<T, F> => {
  const {
    searchFunction,
    getLocation,
    getters = {},
    initialFilters,
    autoSearch = false,
    debounceMs = 300,
  } = config;

  // Estado de búsqueda
  const [state, setState] = useState<MapSearchState<T>>({
    results: [],
    isLoading: false,
    error: null,
    totalResults: 0,
    hasMore: false,
  });

  // Filtros
  const [filters, setFilters] = useState<F>(
    initialFilters || ({
      searchQuery: "",
      sortBy: "distance",
      sortOrder: "asc",
    } as F)
  );

  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState<GeoPoint | undefined>(
    undefined
  );

  // Timer para debounce
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  // Debounced filters to avoid firing queries too often
  const [debouncedFilters, setDebouncedFilters] = useState<F>(filters);

  /**
   * Ejecuta la búsqueda
   */
  const search = useCallback(async () => {
    // Usar React Query para refetch (esta función simplemente invalida la query)
    queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'mapSearch' });
  }, [filters, userLocation, searchFunction, getLocation, getters]);

  /**
   * Actualiza los filtros y ejecuta búsqueda con debounce
   */
  const updateFilters = useCallback(
    (newFilters: Partial<F>) => {
      setFilters((prev) => {
        const updated = { ...prev, ...newFilters };
        return updated;
      });

      // Cancelar timeout anterior
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Ejecutar búsqueda con debounce solo para cambios en searchQuery
      const timeout = setTimeout(() => {
        setDebouncedFilters(prev => ({ ...prev, ...newFilters } as F));
      }, debounceMs);
      if (searchTimeout) clearTimeout(searchTimeout);
      setSearchTimeout(timeout);
    },
    [searchTimeout, debounceMs]
  );

  /**
   * Resetea los filtros al estado inicial
   */
  const resetFilters = useCallback(() => {
    setFilters(
      initialFilters || ({
        searchQuery: "",
        sortBy: "distance",
        sortOrder: "asc",
      } as F)
    );
  }, [initialFilters]);

  /**
   * Efecto para búsqueda automática inicial
   */
  useEffect(() => {
    if (autoSearch) {
      // trigger initial fetch via react-query by setting debounced filters
      setDebouncedFilters(filters);
    }
    // Solo ejecutar una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSearch]);

  // Query: ejecutar búsqueda cuando cambian debouncedFilters o userLocation
  const queryKey = useMemo(() => ['mapSearch', debouncedFilters, userLocation], [debouncedFilters, userLocation]);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const items = await searchFunction(debouncedFilters, userLocation);
      let results = transformToSearchResults(items, getLocation, userLocation);
      const baseFilters = debouncedFilters as unknown as BaseMapSearchFilters;
      if (baseFilters.sortBy) {
        results = sortResults(results, baseFilters.sortBy, baseFilters.sortOrder, getters);
      }
      return results;
    },
    enabled: !!debouncedFilters,
  });

  // Keep the component state in sync with query
  useEffect(() => {
    if (query.isLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      return;
    }
    if (query.isError) {
      setState(prev => ({ ...prev, isLoading: false, error: (query.error as Error)?.message || 'Error desconocido' }));
      return;
    }
    if (query.data) {
      setState({ results: query.data, isLoading: false, error: null, totalResults: query.data.length, hasMore: false });
    }
  }, [query.data, query.isLoading, query.isError, query.error]);

  /**
   * Limpiar timeout al desmontar
   */
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    state,
    filters,
    userLocation,
    search,
    updateFilters,
    resetFilters,
    setUserLocation,
    isSearching: state.isLoading,
    hasResults: state.results.length > 0,
    isEmpty: !state.isLoading && state.results.length === 0,
  };
};
