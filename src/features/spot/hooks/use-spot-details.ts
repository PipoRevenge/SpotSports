import { SportSpotRating, Spot } from '@/src/entities/spot/model/spot';
import { firestore, storage } from '@/src/lib/firebase-config';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { useEffect, useState } from 'react';

interface UseSpotDetailsResult {
  spot: Spot | null;
  sportRatings: SportSpotRating[];
  loading: boolean;
  error: string | null;
}

/**
 * Convierte un valor de Firestore a Date de forma segura
 */
const toDate = (value: any): Date => {
  if (!value) return new Date();
  
  // Si es un Timestamp de Firestore
  if (value instanceof Timestamp || (value && typeof value.toDate === 'function')) {
    return value.toDate();
  }
  
  // Si es un objeto con seconds y nanoseconds (Timestamp serializado)
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
  }
  
  // Si es una fecha válida
  if (value instanceof Date) {
    return value;
  }
  
  // Si es un string o número, intentar convertir
  try {
    return new Date(value);
  } catch {
    return new Date();
  }
};

/**
 * Hook para obtener los detalles de un spot y sus métricas de deportes
 */
export const useSpotDetails = (spotId: string | undefined): UseSpotDetailsResult => {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [sportRatings, setSportRatings] = useState<SportSpotRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spotId) {
      setLoading(false);
      return;
    }

    const fetchSpotDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el spot
        const spotRef = doc(firestore, 'spots', spotId);
        const spotSnap = await getDoc(spotRef);

        if (!spotSnap.exists()) {
          setError('Spot not found');
          setLoading(false);
          return;
        }

        const spotData = spotSnap.data();
        
        // Obtener URLs de imágenes desde Storage
        const mediaUrls = await getSpotMediaUrls(spotId);
        
        // Construir el objeto Spot
        const fetchedSpot: Spot = {
          id: spotSnap.id,
          details: {
            name: spotData.name || '',
            description: spotData.description || '',
            availableSports: spotData.availableSports || [],
            media: mediaUrls,
            location: spotData.location || { latitude: 0, longitude: 0 },
            overallRating: spotData.overallRating || 0,
            contactInfo: {
              phone: spotData.phone || '',
              email: spotData.email || '',
              website: spotData.website || '',
            },
          },
          metadata: {
            isVerified: spotData.isVerified || false,
            isActive: spotData.isActive || true,
            createdAt: toDate(spotData.createdAt),
            updatedAt: toDate(spotData.updatedAt),
            createdBy: spotData.createdBy || '',
          },
          activity: {
            reviewsCount: spotData.reviewsCount || 0,
            visitsCount: spotData.visitsCount || 0,
          },
        };

        setSpot(fetchedSpot);

        // Obtener las métricas de deportes
        const metricsQuery = query(
          collection(firestore, 'spot_sport_metrics'),
          where('spot_ref', '==', spotRef)
        );

        const metricsSnap = await getDocs(metricsQuery);
        const ratings: SportSpotRating[] = [];

        for (const metricDoc of metricsSnap.docs) {
          const metricData = metricDoc.data();
          
          // Obtener información del deporte
          const sportRef = metricData.sport_ref;
          if (sportRef) {
            const sportSnap = await getDoc(sportRef);
            if (sportSnap.exists()) {
              const sportData = sportSnap.data() as { name?: string; description?: string };
              
              ratings.push({
                sportId: sportSnap.id,
                sportName: sportData.name || 'Unknown Sport',
                sportDescription: sportData.description || 'No description available',
                rating: metricData.avg_quality || 0,
                difficulty: metricData.avg_difficulty || 0,
              });
            }
          }
        }

        setSportRatings(ratings);
      } catch (err) {
        console.error('Error fetching spot details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch spot details');
      } finally {
        setLoading(false);
      }
    };

    fetchSpotDetails();
  }, [spotId]);

  return { spot, sportRatings, loading, error };
};

/**
 * Obtener URLs de las imágenes de un spot desde Storage
 */
const getSpotMediaUrls = async (spotId: string): Promise<string[]> => {
  try {
    // Crear referencia a la carpeta de media del spot
    const mediaFolderRef = ref(storage, `spots/${spotId}/media`);
    
    // Listar todos los archivos en la carpeta
    const result = await listAll(mediaFolderRef);
    
    // Obtener las URLs de descarga de cada archivo
    const urlPromises = result.items.map(itemRef => getDownloadURL(itemRef));
    const urls = await Promise.all(urlPromises);
    
    return urls;
  } catch (error) {
    console.error('Error getting spot media URLs:', error);
    // Si hay error (por ejemplo, carpeta no existe), retornar array vacío
    return [];
  }
};
