import { spotRepository } from '@/src/api/repositories';
import { SportSpotRating, Spot } from '@/src/entities/spot/model/spot';
import { useCallback, useEffect, useState } from 'react';

// Caché simple en memoria para detalles de spot y ratings
const spotDetailsCache = new Map<string, { 
  spot: Spot; 
  ratings: SportSpotRating[]; 
  timestamp: number 
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene detalles del caché si está disponible y no ha expirado
 */
const getCachedDetails = (spotId: string): { spot: Spot; ratings: SportSpotRating[] } | null => {
  const cached = spotDetailsCache.get(spotId);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    spotDetailsCache.delete(spotId);
    return null;
  }
  
  return { spot: cached.spot, ratings: cached.ratings };
};

/**
 * Guarda detalles en el caché
 */
const cacheDetails = (spotId: string, spot: Spot, ratings: SportSpotRating[]): void => {
  spotDetailsCache.set(spotId, {
    spot,
    ratings,
    timestamp: Date.now()
  });
};

interface UseSpotDetailsResult {
  spot: Spot | null;
  sportRatings: SportSpotRating[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para obtener los detalles de un spot y sus métricas de deportes
 */
export const useSpotDetails = (spotId: string | undefined): UseSpotDetailsResult => {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [sportRatings, setSportRatings] = useState<SportSpotRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpotDetails = useCallback(async () => {
    if (!spotId) {
      setLoading(false);
      return;
    }

    try {
      // Primero verificar si está en caché
      const cachedData = getCachedDetails(spotId);
      
      if (cachedData) {
        // Usar datos en caché inmediatamente
        setSpot(cachedData.spot);
        setSportRatings(cachedData.ratings);
        setLoading(false);
        setError(null);
        
        // Continuar con fetch en segundo plano para actualizar
        // pero no bloquear la UI
      } else {
        setLoading(true);
        setError(null);
      }

      // Obtener el spot usando el repositorio
      const fetchedSpot = await spotRepository.getSpotById(spotId);

      if (!fetchedSpot) {
        setError('Spot not found');
        setLoading(false);
        return;
      }

      // Obtener las métricas de deportes usando el repositorio
      const ratings = await spotRepository.getSportRatings(spotId);

      // Guardar en caché
      cacheDetails(spotId, fetchedSpot, ratings);

      setSpot(fetchedSpot);
      setSportRatings(ratings);

    } catch (err) {
      console.error('Error fetching spot details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spot details');
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  const refetch = useCallback(() => {
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  useEffect(() => {
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  return { spot, sportRatings, loading, error, refetch };
};
