import { spotRepository } from "@/src/api/repositories";
import { useUserLocation } from "@/src/hooks/use-user-location";
import { useQueryClient } from "@/src/lib/react-query";
import { GeoPoint } from "@/src/types/geopoint";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Region } from "react-native-maps";

/**
 * Genera una clave discreta para la región del mapa
 * Redondea las coordenadas para evitar fragmentación del cache
 * 
 * @param region - Región del mapa
 * @param precision - Decimales de precisión (default: 3 = ~111m)
 * @returns string - Clave de región discretizada
 */
const regionToKey = (region: Region | null, precision: number = 3): string => {
  if (!region) return "no-region";
  
  const round = (n: number) => Number(n.toFixed(precision));
  
  return [
    round(region.latitude),
    round(region.longitude),
    round(region.latitudeDelta),
    round(region.longitudeDelta)
  ].join(':');
};

/**
 * Calcula el bounding box de una región
 */
const regionToBounds = (region: Region | null): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null => {
  if (!region) return null;
  
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLng: region.longitude - region.longitudeDelta / 2,
    maxLng: region.longitude + region.longitudeDelta / 2,
  };
};

/**
 * Contexto para gestionar el estado de búsqueda en mapa y ubicación de usuario
 * 
 * Responsabilidades:
 * - Gestionar la ubicación del usuario de forma centralizada
 * - Mantener la región visible del mapa
 * - Proporcionar funciones de navegación (centrar en usuario, etc.)
 * - Facilitar el prefetch de datos de spots
 * 
 * Este contexto NO maneja:
 * - Búsqueda de spots (ver useMapSpotSearch)
 * - Detalles completos de spots (ver SelectedSpotContext)
 * - Filtros de búsqueda (manejados por componentes/hooks específicos)
 */

interface MapSearchContextValue {
  // ===== USER LOCATION =====
  /**
   * Ubicación actual del usuario
   */
  userLocation: GeoPoint | null;
  
  /**
   * Estado de carga de la ubicación
   */
  isLoadingUserLocation: boolean;
  
  /**
   * Error al obtener la ubicación
   */
  locationError: string | null;
  
  /**
   * Solicita la ubicación del usuario (útil si autoRequest=false)
   */
  requestUserLocation: () => Promise<void>;
  
  // ===== MAP REGION =====
  /**
   * Región visible actual del mapa
   */
  visibleRegion: Region | null;
  
  /**
   * Actualiza la región visible (con debounce interno)
   */
  setVisibleRegion: (region: Region) => void;
  
  /**
   * Clave de región discretizada (para usar en queryKeys)
   */
  regionKey: string;
  
  /**
   * Bounds de la región actual
   */
  regionBounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
  
  // ===== NAVIGATION HELPERS =====
  /**
   * Si el mapa debe seguir la ubicación del usuario
   */
  followsUserLocation: boolean;
  
  /**
   * Activa/desactiva el seguimiento de ubicación
   */
  setFollowsUserLocation: (follows: boolean) => void;
  
  /**
   * Centra el mapa en la ubicación del usuario
   */
  centerOnUser: () => void;
  
  // ===== PREFETCH UTILITIES =====
  /**
   * Pre-carga datos básicos de un spot (para markers/callouts)
   */
  prefetchSpotBasic: (spotId: string) => Promise<void>;
  
  /**
   * Pre-carga datos completos de un spot (para navegación)
   */
  prefetchSpotFull: (spotId: string) => Promise<void>;
}

const MapSearchContext = createContext<MapSearchContextValue | undefined>(undefined);

interface MapSearchProviderProps {
  children: React.ReactNode;
  /**
   * Si debe solicitar ubicación automáticamente al montar
   * @default true
   */
  autoRequestLocation?: boolean;
}

/**
 * Provider del contexto de Búsqueda en Mapa y Ubicación
 * Centraliza la gestión de ubicación del usuario y estado del mapa
 */
export const MapSearchProvider: React.FC<MapSearchProviderProps> = ({
  children,
  autoRequestLocation = true
}) => {
  const queryClient = useQueryClient();
  
  // Hook de ubicación del usuario (llamado una sola vez en el provider)
  const {
    location: userLocation,
    isLoading: isLoadingUserLocation,
    error: locationError,
    requestLocation: requestUserLocation,
  } = useUserLocation(autoRequestLocation);
  
  // Estado de región visible del mapa
  const [visibleRegion, setVisibleRegionState] = useState<Region | null>(null);
  
  // Estado de seguimiento de ubicación
  const [followsUserLocation, setFollowsUserLocation] = useState<boolean>(false);
  
  /**
   * Actualiza la región visible
   * En el futuro podemos añadir debounce aquí si es necesario
   */
  const setVisibleRegion = useCallback((region: Region) => {
    setVisibleRegionState(region);
  }, []);
  
  /**
   * Calcula la clave de región discretizada para cache
   */
  const regionKey = useMemo(() => {
    return regionToKey(visibleRegion);
  }, [visibleRegion]);
  
  /**
   * Calcula los bounds de la región actual
   */
  const regionBounds = useMemo(() => {
    return regionToBounds(visibleRegion);
  }, [visibleRegion]);
  
  /**
   * Centra el mapa en la ubicación del usuario
   * Retorna la región objetivo para que el componente de mapa la anime
   */
  const centerOnUser = useCallback(() => {
    if (!userLocation) {
      console.warn('[MapSearchContext] Cannot center on user: location not available');
      return;
    }
    
    const targetRegion: Region = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.05, // ~5.5km
      longitudeDelta: 0.05,
    };
    
    setVisibleRegion(targetRegion);
  }, [userLocation, setVisibleRegion]);
  
  /**
   * Pre-carga datos básicos de un spot
   * Útil para mejorar UX en hover/press de markers
   */
  const prefetchSpotBasic = useCallback(async (spotId: string) => {
    try {
      console.log('[MapSearchContext] Prefetching basic data for spot:', spotId);
      
      await queryClient.prefetchQuery({
        queryKey: ['spot', spotId],
        queryFn: async () => {
          const spot = await spotRepository.getSpotById(spotId);
          if (!spot) throw new Error(`Spot ${spotId} not found`);
          return spot;
        },
        staleTime: 10 * 60_000, // 10 min - datos básicos son bastante estables
      });
      
      console.log('[MapSearchContext] Prefetch complete for spot:', spotId);
    } catch (error) {
      console.error('[MapSearchContext] Error prefetching spot:', error);
    }
  }, [queryClient]);
  
  /**
   * Pre-carga datos completos de un spot (incluye datos del spot)
   * Útil antes de navegar a la página de detalles
   * Las reviews se cargarán por el SelectedSpotContext al navegar
   */
  const prefetchSpotFull = useCallback(async (spotId: string) => {
    try {
      console.log('[MapSearchContext] Prefetching full data for spot:', spotId);
      
      // Prefetch del spot completo con sport ratings
      await queryClient.prefetchQuery({
        queryKey: ['spot', spotId],
        queryFn: async () => {
          const spot = await spotRepository.getSpotById(spotId);
          if (!spot) throw new Error(`Spot ${spotId} not found`);
          return spot;
        },
        staleTime: 5 * 60_000, // 5 min
      });
      
      // Prefetch de sport ratings
      await queryClient.prefetchQuery({
        queryKey: ['spot', spotId, 'sport-ratings'],
        queryFn: async () => {
          const ratings = await spotRepository.getSportRatings(spotId);
          return ratings;
        },
        staleTime: 5 * 60_000,
      });
      
      console.log('[MapSearchContext] Full prefetch complete for spot:', spotId);
    } catch (error) {
      console.error('[MapSearchContext] Error prefetching full spot data:', error);
    }
  }, [queryClient]);
  
  const value: MapSearchContextValue = {
    // User location
    userLocation,
    isLoadingUserLocation,
    locationError,
    requestUserLocation,
    
    // Map region
    visibleRegion,
    setVisibleRegion,
    regionKey,
    regionBounds,
    
    // Navigation
    followsUserLocation,
    setFollowsUserLocation,
    centerOnUser,
    
    // Prefetch
    prefetchSpotBasic,
    prefetchSpotFull,
  };
  
  return (
    <MapSearchContext.Provider value={value}>
      {children}
    </MapSearchContext.Provider>
  );
};

/**
 * Hook para usar el contexto de Búsqueda en Mapa y Ubicación
 * Lanza un error si se usa fuera del MapSearchProvider
 */
export const useMapSearch = (): MapSearchContextValue => {
  const context = useContext(MapSearchContext);
  if (!context) {
    throw new Error("useMapSearch must be used within MapSearchProvider");
  }
  return context;
};
