import { sportRepository } from '@/src/api/repositories';
import { useCallback, useEffect, useState } from 'react';
import { SportSimple, SportState, UseSportsSearchOptions } from '../types/sport-types';

/**
 * Hook para buscar y gestionar deportes desde la API
 */
export const useSearchSports = (options: UseSportsSearchOptions = {}) => {
  const {
    autoLoad = true,
    searchDelay = 300
  } = options;

  const [state, setState] = useState<SportState>({
    sports: [],
    loading: false,
    error: null,
    searchResults: [],
    searchLoading: false,
    searchError: null,
  });

  /**
   * Convierte Sport del dominio a SportSimple para la UI
   */
  const toSimpleSport = useCallback((sport: any): SportSimple => ({
    id: sport.id,
    name: sport.details.name,
  }), []);

  /**
   * Carga todos los deportes activos
   */
  const loadSports = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const sports = await sportRepository.getActiveSports();
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
        error: error.message || 'Error al cargar deportes',
      }));
    }
  }, [toSimpleSport]);

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
        searchError: error.message || 'Error al buscar deportes',
      }));
    }
  }, [toSimpleSport]);

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
    
    // Acciones
    loadSports,
    searchSports,
    debouncedSearch,
    clearSearch,
    reload,
  };
};