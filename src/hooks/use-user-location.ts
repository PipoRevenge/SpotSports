import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

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

  const requestLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (__DEV__) console.log('[useUserLocation] Requesting location permissions...');

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        if (__DEV__) console.log('[useUserLocation] Permission denied');
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      if (__DEV__) console.log('[useUserLocation] Permission granted, getting current position...');

      try {
        // Intentar obtener ubicación actual con timeout
        const currentLocation = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Location timeout')), 10000)
          )
        ]);

        if (currentLocation) {
          if (__DEV__) console.log('[useUserLocation] Got current position:', currentLocation.coords);
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        }
      } catch (locationError) {
        if (__DEV__) console.warn('[useUserLocation] getCurrentPositionAsync failed, trying last known location...', locationError);
        
        // Intentar obtener la última ubicación conocida como fallback
        try {
          const lastKnownLocation = await Location.getLastKnownPositionAsync({
            maxAge: 300000, // 5 minutos
            requiredAccuracy: 1000, // 1km
          });

          if (lastKnownLocation) {
            if (__DEV__) console.log('[useUserLocation] Using last known position:', lastKnownLocation.coords);
            setLocation({
              latitude: lastKnownLocation.coords.latitude,
              longitude: lastKnownLocation.coords.longitude,
            });
          } else {
            // No last known position available: set user-friendly error and return
            setError('Could not obtain location. Ensure location services are enabled on your device.');
            setIsLoading(false);
            return;
          }
        } catch (fallbackError) {
          if (__DEV__) console.error('[useUserLocation] Last known location also failed:', fallbackError);
          // Provide a user-friendly error and stop without throwing to avoid noisy stack traces
          setError('Could not obtain location. If you\'re using an emulator, set a simulated GPS location.');
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      if (__DEV__) console.error('[useUserLocation] Error getting user location:', err);
      setError(err instanceof Error ? err.message : 'Error getting location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return {
    location,
    error,
    isLoading,
    requestLocation,
  };
};
