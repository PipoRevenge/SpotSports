import { useCallback, useMemo, useState } from "react";
import type { SpotSearchFilters } from "../components/spot-search/spot-search-filter-modal";

const DEFAULT_FILTERS: SpotSearchFilters = {
  sports: [],
  sportCriteria: [],
  maxDistance: undefined,
  minRating: 0,
  onlyVerified: false,
};

interface UseSpotFiltersProps {
  initialFilters?: Partial<SpotSearchFilters>;
  onFiltersChange?: (filters: SpotSearchFilters) => void;
}

interface UseSpotFiltersReturn {
  filters: SpotSearchFilters;
  setFilters: (filters: SpotSearchFilters) => void;
  updateFilters: (newFilters: Partial<SpotSearchFilters>) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
}

/**
 * Hook para manejar la lógica de filtros de spots
 * 
 * Responsabilidades:
 * - Gestiona el estado de los filtros de búsqueda
 * - Calcula la cantidad de filtros activos
 * - Proporciona métodos para actualizar y resetear filtros
 * 
 * @example
 * ```tsx
 * const { filters, setFilters, resetFilters, activeFiltersCount } = useSpotFilters({
 *   initialFilters: { maxDistance: 5 }
 * });
 * ```
 */
export const useSpotFilters = ({
  initialFilters,
  onFiltersChange,
}: UseSpotFiltersProps = {}): UseSpotFiltersReturn => {
  const [filters, setFiltersState] = useState<SpotSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  /**
   * Actualiza los filtros (sin notificar al callback para evitar race conditions)
   */
  const setFilters = useCallback(
    (newFilters: SpotSearchFilters) => {
      console.log('[useSpotFilters] setFilters called with:', JSON.stringify(newFilters, null, 2));
      setFiltersState(newFilters);
      // No llamar onFiltersChange aquí - dejar que el componente controle cuándo buscar
    },
    []
  );

  /**
   * Actualiza filtros parcialmente (sin notificar al callback para evitar race conditions)
   */
  const updateFilters = useCallback(
    (newFilters: Partial<SpotSearchFilters>) => {
      console.log('[useSpotFilters] updateFilters called with:', JSON.stringify(newFilters, null, 2));
      setFiltersState((prevFilters) => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        console.log('[useSpotFilters] Updated filters:', JSON.stringify(updatedFilters, null, 2));
        // No llamar onFiltersChange aquí - dejar que el componente controle cuándo buscar
        return updatedFilters;
      });
    },
    []
  );

  /**
   * Resetea los filtros a sus valores por defecto
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, [setFilters]);

  /**
   * Calcula la cantidad de filtros activos
   */
  const activeFiltersCount = useMemo(() => {
    return [
      filters.maxDistance !== undefined,
      filters.minRating && filters.minRating > 0,
      filters.sports && filters.sports.length > 0,
      filters.onlyVerified === true,
      filters.sportCriteria && filters.sportCriteria.length > 0,
    ].filter(Boolean).length;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    activeFiltersCount,
  };
};
