import { sportRepository } from '@/src/api/repositories';
import { useCallback, useEffect, useState } from 'react';
import { SportCategory, SportFilters, SportState, UseSportsSearchOptions } from '../types/sport-types';
import { SPORT_ERROR_MESSAGES, SPORT_SEARCH_CONFIG } from '../utils/sport-constants';
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

  const [state, setState] = useState<SportState>({
    sports: [],
    loading: false,
    error: null,
    searchResults: [],
    searchLoading: false,
    searchError: null,
  });

  /**
   * Carga todos los deportes activos, opcionalmente filtrados por categoría
   */
  const loadSports = useCallback(async (category?: SportCategory) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const sports = category 
        ? await sportRepository.getActiveSportsByCategory(category)
        : await sportRepository.getActiveSports();
        
      const simpleSports = sports.map(toSimpleSport);
      
      setState(prev => ({
        ...prev,
        sports: simpleSports,
        loading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error al cargar deportes:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || SPORT_ERROR_MESSAGES.LOAD_ERROR,
      }));
    }
  }, []);

  /**
   * Busca deportes por nombre
   */
  const searchSports = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, searchResults: [], searchLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, searchLoading: true, searchError: null }));
    
    try {
      const results = await sportRepository.searchSportsByName(query);
      const simpleResults = results.map(toSimpleSport);
      
      setState(prev => ({
        ...prev,
        searchResults: simpleResults,
        searchLoading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error al buscar deportes:', error);
      setState(prev => ({
        ...prev,
        searchLoading: false,
        searchError: error.message || SPORT_ERROR_MESSAGES.SEARCH_ERROR,
      }));
    }
  }, []);

  /**
   * Busca deportes con filtros aplicados
   */
  const searchWithFilters = useCallback(async (searchFilters: SportFilters) => {
    setFilters(searchFilters);
    
    const { query, category } = searchFilters;
    
    // Si no hay filtros, limpiar resultados
    if (!query?.trim() && !category) {
      setState(prev => ({ 
        ...prev, 
        searchResults: [], 
        searchLoading: false,
        searchError: null,
      }));
      return;
    }
    
    setState(prev => ({ ...prev, searchLoading: true, searchError: null }));
    
    try {
      // Usar el nuevo método de búsqueda con filtros del repositorio
      const results = await sportRepository.searchSportsWithFilters({ query, category });
      const simpleResults = results.map(toSimpleSport);
      
      setState(prev => ({
        ...prev,
        searchResults: simpleResults,
        searchLoading: false,
      }));
    } catch (error: any) {
      console.error('❌ Error al buscar deportes con filtros:', error);
      setState(prev => ({
        ...prev,
        searchLoading: false,
        searchError: error.message || SPORT_ERROR_MESSAGES.SEARCH_ERROR,
      }));
    }
  }, []);

  /**
   * Actualiza el filtro de categoría
   */
  const setCategory = useCallback((category?: SportCategory) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, category };
      searchWithFilters(newFilters);
      return newFilters;
    });
  }, [searchWithFilters]);

  /**
   * Actualiza el filtro de búsqueda
   */
  const setQuery = useCallback((query?: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, query };
      searchWithFilters(newFilters);
      return newFilters;
    });
  }, [searchWithFilters]);

  /**
   * Busca deportes con debounce
   */
  const debouncedSearch = useCallback((query: string) => {
    const timeoutId = setTimeout(() => {
      searchSports(query);
    }, searchDelay);

    return () => clearTimeout(timeoutId);
  }, [searchSports, searchDelay]);

  /**
   * Resetea los resultados de búsqueda
   */
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchResults: [],
      searchLoading: false,
      searchError: null,
    }));
  }, []);

  /**
   * Recarga los deportes
   */
  const reload = useCallback(() => {
    loadSports();
  }, [loadSports]);

  // Cargar deportes automáticamente
  useEffect(() => {
    if (autoLoad) {
      loadSports();
    }
  }, [autoLoad, loadSports]);

  return {
    // Estado
    sports: state.sports,
    loading: state.loading,
    error: state.error,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,
    searchError: state.searchError,
    filters,
    
    // Acciones
    loadSports,
    searchSports,
    searchWithFilters,
    setCategory,
    setQuery,
    debouncedSearch,
    clearSearch,
    reload,
  };
};