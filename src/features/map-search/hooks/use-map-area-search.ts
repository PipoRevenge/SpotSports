import { useCallback, useEffect, useRef, useState } from "react";
import type { Region } from "react-native-maps";

interface UseMapAreaSearchProps {
  /**
   * Si debe buscar automáticamente cuando cambia la región
   * @default true
   */
  autoSearch?: boolean;
  /**
   * Tiempo de debounce en milisegundos
   * @default 1000
   */
  debounceMs?: number;
  /**
   * Margen adicional para el radio de búsqueda (1.2 = 20% extra)
   * @default 1.2
   */
  radiusMargin?: number;
  /**
   * Callback que se ejecuta cuando se calcula una nueva área de búsqueda
   */
  onAreaCalculated?: (location: { latitude: number; longitude: number }, radius: number) => void;
}

interface UseMapAreaSearchReturn {
  /**
   * Región actual del mapa
   */
  mapRegion: Region | undefined;
  /**
   * Centro de búsqueda calculado
   */
  searchLocation: { latitude: number; longitude: number } | undefined;
  /**
   * Radio de búsqueda en km
   */
  searchRadius: number | undefined;
  /**
   * Si debe centrar en la ubicación del usuario (primera vez)
   */
  shouldCenterOnUser: boolean;
  /**
   * Actualiza la región del mapa
   */
  setMapRegion: (region: Region) => void;
  /**
   * Ejecuta la búsqueda en el área visible manualmente
   */
  searchInVisibleArea: () => void;
  /**
   * Limpia la búsqueda en área visible
   */
  clearAreaSearch: () => void;
}

/**
 * Hook para manejar la lógica de búsqueda en el área visible del mapa
 * 
 * Responsabilidades:
 * - Gestiona la región visible del mapa
 * - Calcula el centro y radio de búsqueda basado en la región
 * - Debounce automático para búsquedas mientras se explora el mapa
 * - Cálculos geográficos (distancias, radio)
 * 
 * @example
 * ```tsx
 * const { mapRegion, searchLocation, searchRadius, setMapRegion } = useMapAreaSearch({
 *   autoSearch: true,
 *   onAreaCalculated: (location, radius) => {
 *     // Ejecutar búsqueda con estos parámetros
 *   }
 * });
 * ```
 */
export const useMapAreaSearch = ({
  autoSearch = true,
  debounceMs = 1000,
  radiusMargin = 1.2,
  onAreaCalculated,
}: UseMapAreaSearchProps = {}): UseMapAreaSearchReturn => {
  // Estado para guardar la región visible del mapa
  const [mapRegion, setMapRegionState] = useState<Region | undefined>(undefined);

  // Estado para controlar si debemos centrar en el usuario (solo la primera vez)
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(true);

  // Estado para la búsqueda en área visible
  const [searchLocation, setSearchLocation] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);

  const [searchRadius, setSearchRadius] = useState<number | undefined>(undefined);

  // Referencia para el timeout del debounce
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Calcula el centro y radio de búsqueda basado en la región visible del mapa
   */
  const calculateSearchArea = useCallback(
    (region: Region) => {
      // Calcular el centro de la región visible (donde está mirando el usuario)
      const centerLocation = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      // Calcular un radio aproximado basado en los deltas de la región
      // latitudeDelta ~ 111 km por grado de latitud
      // longitudeDelta varía con la latitud: ~ 111 * cos(latitude) km por grado
      const latDistance = region.latitudeDelta * 111;
      const lonDistance = region.longitudeDelta * 111 * Math.cos((region.latitude * Math.PI) / 180);

      // Usar el radio que cubra la diagonal de la región visible + margen
      const diagonalDistance = Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
      const calculatedRadius = (diagonalDistance / 2) * radiusMargin;

      return { centerLocation, calculatedRadius };
    },
    [radiusMargin]
  );

  /**
   * Ejecuta la búsqueda en el área visible del mapa
   */
  const searchInVisibleArea = useCallback(() => {
    if (!mapRegion) {
      return;
    }

    const { centerLocation, calculatedRadius } = calculateSearchArea(mapRegion);

    // Actualizar el estado
    setSearchLocation(centerLocation);
    setSearchRadius(calculatedRadius);

    // Notificar al callback externo
    onAreaCalculated?.(centerLocation, calculatedRadius);
  }, [mapRegion, calculateSearchArea, onAreaCalculated]);

  /**
   * Limpia la búsqueda en área visible
   */
  const clearAreaSearch = useCallback(() => {
    setSearchLocation(undefined);
    setSearchRadius(undefined);
  }, []);

  /**
   * Maneja el cambio de región del mapa
   */
  const setMapRegion = useCallback((region: Region) => {
    setMapRegionState(region);

    // Después de la primera vez, no centramos más en el usuario automáticamente
    if (shouldCenterOnUser) {
      setShouldCenterOnUser(false);
    }
  }, [shouldCenterOnUser]);

  /**
   * Efecto para búsqueda automática con debounce cuando cambia la región
   */
  useEffect(() => {
    if (!autoSearch || !mapRegion) return;

    // Limpiar el timeout anterior si existe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Crear un nuevo timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchInVisibleArea();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [mapRegion, autoSearch, debounceMs, searchInVisibleArea]);

  return {
    mapRegion,
    searchLocation,
    searchRadius,
    shouldCenterOnUser,
    setMapRegion,
    searchInVisibleArea,
    clearAreaSearch,
  };
};
