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

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setIsLoading(false);
        return;
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener ubicación');
      console.error('Error getting user location:', err);
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
