import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseUserLocationReturn {
  location: UserLocation | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => Promise<void>;
}

/**
 * Hook para obtener la ubicación actual del usuario
 * Solicita permisos y retorna las coordenadas
 */
export const useUserLocation = (autoRequest: boolean = false): UseUserLocationReturn => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[useUserLocation] Requesting location permissions...');

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('[useUserLocation] Permission denied');
        setError('Permiso de ubicación denegado');
        setIsLoading(false);
        return;
      }

      console.log('[useUserLocation] Permission granted, getting current position...');

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('[useUserLocation] Got current position:', currentLocation.coords);
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (err) {
      console.error('[useUserLocation] Error getting user location:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener ubicación');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  return {
    location,
    error,
    isLoading,
    requestLocation,
  };
};
