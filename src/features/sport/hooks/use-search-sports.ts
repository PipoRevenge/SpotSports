import { sportRepository } from '@/src/api/repositories';
import { useQuery, useQueryClient } from '@/src/lib/react-query';
import { useCallback, useMemo, useState } from 'react';
import { SportCategory, SportFilters, UseSportsSearchOptions } from '../types/sport-types';
import { SPORT_SEARCH_CONFIG } from '../utils/sport-constants';
import { toSimpleSport } from '../utils/sport-helpers';

/**
 * Hook para buscar y gestionar deportes desde la API
 * Maneja toda la lógica de negocio relacionada con la búsqueda de deportes con filtros
 */
export const useSearchSports = (options: UseSportsSearchOptions = {}) => {
  const {
    autoLoad = true,
    searchDelay = SPORT_SEARCH_CONFIG.DEFAULT_SEARCH_DELAY,
    defaultFilters = {}
  } = options;
  
  const [filters, setFilters] = useState<SportFilters>(defaultFilters);
  const queryClient = useQueryClient();

  const activeSportsQuery = useQuery({
    queryKey: ['sports', 'active', filters.category ?? 'all'],
    enabled: autoLoad,
    meta: { persist: true },
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const sports = filters.category
        ? await sportRepository.getActiveSportsByCategory(filters.category as SportCategory)
        : await sportRepository.getActiveSports();
      return sports.map(toSimpleSport);
    },
  });

  const searchEnabled = useMemo(() => {
    const hasQuery = !!filters.query?.trim();
    return hasQuery || !!filters.category;
  }, [filters.category, filters.query]);

  const searchQuery = useQuery({
    queryKey: ['sports', 'search', filters],
    enabled: searchEnabled,
    staleTime: 5 * 60_000,
    meta: { persist: true },
    queryFn: async () => {
      const { query, category } = filters;
      const results = await sportRepository.searchSportsWithFilters({ query, category });
      return results.map(toSimpleSport);
    },
  });

  /**
   * Actualiza el filtro de categoría
   */
  const setCategory = useCallback((category?: SportCategory) => {
    setFilters(prevFilters => ({ ...prevFilters, category }));
  }, []);

  /**
   * Actualiza el filtro de búsqueda
   */
  const setQuery = useCallback((query?: string) => {
    setFilters(prevFilters => ({ ...prevFilters, query }));
  }, []);

  /**
   * Busca deportes con debounce
   */
  const debouncedSearch = useCallback((query: string) => {
    const timeoutId = setTimeout(() => {
      setQuery(query);
    }, searchDelay);

    return () => clearTimeout(timeoutId);
  }, [searchDelay, setQuery]);

  /**
   * Resetea los resultados de búsqueda
   */
  const clearSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, query: undefined }));
    queryClient.removeQueries({ queryKey: ['sports', 'search'] });
  }, [queryClient]);

  /**
   * Recarga los deportes
   */
  const reload = useCallback(async () => {
    await Promise.all([
      activeSportsQuery.refetch(),
      searchEnabled ? searchQuery.refetch() : Promise.resolve()
    ]);
  }, [activeSportsQuery, searchEnabled, searchQuery]);

  return {
    // Estado
    sports: activeSportsQuery.data ?? [],
    loading: activeSportsQuery.isLoading || activeSportsQuery.isFetching,
    error: activeSportsQuery.error ? (activeSportsQuery.error as Error).message : null,
    searchResults: searchEnabled ? searchQuery.data ?? [] : [],
    searchLoading: searchEnabled && (searchQuery.isLoading || searchQuery.isFetching),
    searchError: searchQuery.error ? (searchQuery.error as Error).message : null,
    filters,
    
    // Acciones
    searchSports: setQuery,
    searchWithFilters: setFilters,
    setCategory,
    setQuery,
    debouncedSearch,
    clearSearch,
    reload,
  };
};