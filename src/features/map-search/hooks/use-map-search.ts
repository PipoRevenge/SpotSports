import { GeoPoint } from "@/src/types/geopoint";
import { useCallback, useEffect, useState } from "react";
import {
    BaseMapSearchFilters,
    MapSearchState,
    SearchFunction,
} from "../types/map-types";
import {
    sortResults,
    transformToSearchResults,
} from "../utils/map-helpers";

/**
 * Configuración del hook de búsqueda en mapa
 */
export interface UseMapSearchConfig<T, F extends BaseMapSearchFilters> {
  // Función de búsqueda que se ejecuta para obtener los items
  searchFunction: SearchFunction<T, F>;
  
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
export interface UseMapSearchResult<T, F extends BaseMapSearchFilters> {
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
export const useMapSearch = <T, F extends BaseMapSearchFilters>(
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

  /**
   * Ejecuta la búsqueda
   */
  const search = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Ejecutar función de búsqueda
      const items = await searchFunction(filters, userLocation);

      // Transformar items a resultados con ubicación y distancia
      let results = transformToSearchResults(items, getLocation, userLocation);

      // El filtro de distancia ya fue aplicado en el backend/repositorio
      // NO aplicar filtros adicionales aquí para evitar duplicación

      // Ordenar resultados
      if (filters.sortBy) {
        results = sortResults(results, filters.sortBy, filters.sortOrder, getters);
      }

      setState({
        results,
        isLoading: false,
        error: null,
        totalResults: results.length,
        hasMore: false, // Por ahora no soportamos paginación
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }));
    }
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
      if ("searchQuery" in newFilters) {
        const timeout = setTimeout(() => {
          // Timeout expirado - la búsqueda se ejecutará vía efecto
        }, debounceMs);
        setSearchTimeout(timeout);
      }
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
      search();
    }
    // Solo ejecutar una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSearch]);

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
