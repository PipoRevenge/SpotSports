import { SportSpotRating, Spot, SpotDetails } from '@/src/entities/spot/model/spot';
import { firestore, storage } from '@/src/lib/firebase-config';
import { GeoPoint } from '@/src/types/geopoint';
import { ref as dbRef, getDatabase, push } from 'firebase/database';
import { addDoc, collection, doc, GeoPoint as FirebaseGeoPoint, limit as firestoreLimit, getDoc, getDocs, increment, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { distanceBetween, geohashForLocation, geohashQueryBounds } from 'geofire-common';
import { ISpotRepository, SpotSearchFilters } from '../interfaces/i-spot-repository';
import { SpotMapper } from '../mappers/spot-mapper';


/**
 * Implementación del repositorio de spots usando Firebase Firestore
 */
export class SpotRepositoryImpl implements ISpotRepository {
  private readonly COLLECTION_NAME = 'spots';
  // CHANGED: sport_metrics is now a subcollection under spots
  // Path: spots/{spotId}/sport_metrics/{sportId}

  /**
   * Crear un nuevo spot
   */
  async createSpot(spotData: SpotDetails, userId: string, username: string): Promise<string> {
    try {
      if (!spotData) {
        throw new Error('Spot data is required');
      }

      if (!spotData.name || spotData.name.trim().length === 0) {
        throw new Error('Spot name is required');
      }

      if (!spotData.location || !spotData.location.latitude || !spotData.location.longitude) {
        throw new Error('Valid location is required');
      }

      if (!userId || userId.trim().length === 0) {
        throw new Error('User ID is required');
      }

      if (!username || username.trim().length === 0) {
        throw new Error('Username is required');
      }

      const spotDataWithoutMedia = {
        ...spotData,
        media: []
      };

      const geohash = await this.createGeohash(spotData.location);
      
      // Crear referencia al usuario
      const userRef = doc(firestore, `users/${userId}`);

      const firestoreData = {
        name: spotDataWithoutMedia.name,
        description: spotDataWithoutMedia.description,
        gallery: [], // NUEVA ESTRUCTURA: gallery en lugar de media
        availableSports: spotDataWithoutMedia.availableSports || [],
        location: new FirebaseGeoPoint(
          spotDataWithoutMedia.location.latitude,
          spotDataWithoutMedia.location.longitude
        ),
        geohash: geohash,
        overallRating: spotDataWithoutMedia.overallRating || 0,
        contactPhone: spotDataWithoutMedia.contactInfo?.phone || "",
        contactEmail: spotDataWithoutMedia.contactInfo?.email || "",
        contactWebsite: spotDataWithoutMedia.contactInfo?.website || "",
        isVerified: false,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userRef, // NUEVA ESTRUCTURA: referencia en lugar de string
        reviewsCount: 0,
        visitsCount: 0,
        discussionsCount: 0,
      };

      const cleanedData = this.removeUndefinedFields(firestoreData);
      const spotsCollection = collection(firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(spotsCollection, cleanedData);
      const spotId = docRef.id;

      if (spotData.availableSports && spotData.availableSports.length > 0) {
        await this.createSpotSportMetrics(spotId, spotData.availableSports);
      }

      if (spotData.media && spotData.media.length > 0) {
        const galleryUrls = await this.uploadSpotMedia(spotId, userId, spotData.media);
        
        // Actualizar el documento del spot con las URLs de la galería
        const spotRef = doc(firestore, this.COLLECTION_NAME, spotId);
        await updateDoc(spotRef, {
          gallery: galleryUrls,
          updatedAt: Timestamp.now()
        });
      }

      return spotId;

    } catch (error) {
      console.error('Error creating spot:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to create spot: ${error.message}`);
      } else {
        throw new Error('Failed to create spot: Unknown error');
      }
    }
  }

  /**
   * Obtener spot por ID
   */
  async getSpotById(id: string): Promise<Spot | null> {
    try {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new Error('Valid spot ID is required');
      }

      const spotDoc = doc(firestore, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(spotDoc);

      if (!docSnap.exists()) {
        return null;
      }

      const spotData = docSnap.data() as any;
      const mediaUrls = await this.getSpotMediaUrls(id);
      spotData.media = mediaUrls;

      return SpotMapper.fromFirebase(id, spotData);

    } catch (error) {
      console.error('Error getting spot by ID:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to get spot: ${error.message}`);
      } else {
        throw new Error('Failed to get spot: Unknown error');
      }
    }
  }

  /**
   * Obtener solo los contadores del spot (optimizado para actualizaciones rápidas)
   */
  async getSpotCounters(id: string): Promise<{ favoritesCount: number; visitedCount: number; wantToVisitCount: number; reviewsCount: number; discussionsCount?: number; } | null> {
    try {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new Error('Valid spot ID is required');
      }

      const spotDoc = doc(firestore, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(spotDoc);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        favoritesCount: data.favoritesCount || 0,
        visitedCount: data.visitedCount || 0,
        wantToVisitCount: data.wantToVisitCount || 0,
        reviewsCount: data.reviewsCount || 0,
        discussionsCount: data.discussionsCount || 0,
      };

    } catch (error) {
      console.error('Error getting spot counters:', error);
      return null;
    }
  }

  /**
   * Obtener calificaciones de deportes para un spot
   * UPDATED: Now uses subcollection spots/{spotId}/sport_metrics/{sportId}
   */
  async getSportRatings(spotId: string): Promise<SportSpotRating[]> {
    try {
      if (!spotId || typeof spotId !== 'string' || spotId.trim().length === 0) {
        throw new Error('Valid spot ID is required');
      }

      // NEW STRUCTURE: sport_metrics is a subcollection under spots
      const metricsRef = collection(firestore, `spots/${spotId}/sport_metrics`);
      const metricsSnap = await getDocs(metricsRef);
      const ratings: SportSpotRating[] = [];

      for (const metricDoc of metricsSnap.docs) {
        const metricData = metricDoc.data();
        // The document ID is the sportId
        const sportId = metricDoc.id;
        
        // Get sport info from sports collection
        const sportRef = doc(firestore, `sports/${sportId}`);
        const sportSnap = await getDoc(sportRef);
        if (sportSnap.exists()) {
          const sportData = sportSnap.data() as { name?: string; description?: string };
          
          ratings.push({
            sportId: sportId,
            sportName: sportData.name || 'Unknown Sport',
            sportDescription: sportData.description || 'No description available',
            rating: metricData.avg_rating || 0,
            difficulty: metricData.avg_difficulty || 0,
          });
        }
      }

      return ratings;

    } catch (error) {
      console.error('Error getting sport ratings:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to get sport ratings: ${error.message}`);
      } else {
        throw new Error('Failed to get sport ratings: Unknown error');
      }
    }
  }

  private async createGeohash(location: GeoPoint): Promise<string> {
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Valid location is required');
    }

    const geohash = geohashForLocation([location.latitude, location.longitude]);
    return geohash;
  }

  /**
   * Crear documentos en sport_metrics subcollection para cada deporte disponible
   * Uses sportId as document ID for easy access and updates
   * Path: spots/{spotId}/sport_metrics/{sportId}
   */
  private async createSpotSportMetrics(spotId: string, sportIds: string[]): Promise<void> {
    try {
      // Create a document for each sport using sportId as the document ID
      const createPromises = sportIds.map(async (sportId) => {
        const metricData = {
          avg_difficulty: 0,
          avg_rating: 0,
          review_count: 0,
          sum_difficulty: 0,
          sum_rating: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        // Use setDoc with sportId as document ID - creates or overwrites
        const metricDocRef = doc(firestore, `spots/${spotId}/sport_metrics/${sportId}`);
        await setDoc(metricDocRef, metricData, { merge: true });
        
        console.log(`Created/updated sport_metrics for sport: ${sportId}`);
      });
      
      await Promise.all(createPromises);
    } catch (error) {
      console.error('Error creating spot sport metrics:', error);
      throw new Error(`Failed to create spot sport metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subir archivos multimedia a Storage y retornar las URLs
   */
  private async uploadSpotMedia(spotId: string, userId: string, mediaUris: string[]): Promise<string[]> {
    try {
      const galleryUrls: string[] = [];
      
      // Subir cada archivo
      for (let i = 0; i < mediaUris.length; i++) {
        const mediaUri = mediaUris[i];
        
        // Determinar extensión del archivo
        const extension = this.getFileExtension(mediaUri);
        
        // Generar ID único usando Firebase
        const uniqueId = push(dbRef(getDatabase())).key || `${Date.now()}_${i}`;
        
        // Crear nombre del archivo: (uniqueId)_n.ext según estructura de Firebase Storage
        const fileName = `${uniqueId}_${i}${extension}`;
        
        // Crear referencia en Storage: spots/spotId/gallery/fileName
        const storageRef = ref(storage, `spots/${spotId}/gallery/${fileName}`);
        
        // Descargar el archivo desde la URI local
        const response = await fetch(mediaUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch media file: ${mediaUri}`);
        }
        
        const blob = await response.blob();
        
        // Subir a Storage
        console.log(`Uploading file ${i + 1}/${mediaUris.length}: ${fileName}`);
        await uploadBytes(storageRef, blob);
        
        // Obtener URL de descarga
        const downloadUrl = await getDownloadURL(storageRef);
        galleryUrls.push(downloadUrl);
        console.log(`File uploaded successfully. URL: ${downloadUrl}`);
      }
      
      return galleryUrls;
    } catch (error) {
      console.error('Error uploading spot media:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtener extensión del archivo desde la URI
   */
  private getFileExtension(uri: string): string {
    // Intentar obtener la extensión del final de la URI
    const match = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (match && match[1]) {
      return `.${match[1].toLowerCase()}`;
    }
    
    // Si no se puede determinar, usar .jpg por defecto para imágenes
    // En una implementación más robusta, podrías verificar el tipo MIME
    return '.jpg';
  }

  /**
   * Remover campos undefined de un objeto (Firebase no acepta undefined)
   */
  private removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    
    for (const key in obj) {
      if (obj[key] !== undefined) {
        const value = obj[key];
        
        // No procesar recursivamente objetos especiales de Firebase (Timestamp, GeoPoint, DocumentReference, etc.)
        // Verificamos si tiene métodos específicos de estos objetos o si es una instancia de Date
        const isFirebaseTimestamp = value && typeof value === 'object' && ('toDate' in value || 'toMillis' in value);
        const isFirebaseGeoPoint = value && typeof value === 'object' && ('latitude' in value && 'longitude' in value && value.constructor?.name === 'GeoPoint');
        const isFirebaseDocumentReference = value && typeof value === 'object' && ('firestore' in value || 'path' in value || value.constructor?.name === 'DocumentReference');
        const isDate = value && typeof value === 'object' && (value.constructor?.name === 'Date' || Object.prototype.toString.call(value) === '[object Date]');
        const isArray = Array.isArray(value);
        
        if (typeof value === 'object' && 
            value !== null && 
            !isArray &&
            !isFirebaseTimestamp &&
            !isFirebaseGeoPoint &&
            !isFirebaseDocumentReference &&
            !isDate) {
          // Recursivamente limpiar objetos anidados normales
          cleaned[key] = this.removeUndefinedFields(value);
        } else {
          // Mantener el valor tal cual (incluyendo Timestamp, GeoPoint, DocumentReference, Date, arrays, primitivos)
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned as T;
  }

  /**
   * Obtener URLs de las imágenes de un spot desde Storage
   */
  private async getSpotMediaUrls(spotId: string): Promise<string[]> {
    try {
      // Crear referencia a la carpeta gallery del spot
      const mediaFolderRef = ref(storage, `spots/${spotId}/gallery`);
      
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
  }

  /**
   * Buscar spots con filtros
   */
  async searchSpots(filters: SpotSearchFilters): Promise<Spot[]> {
    try {
      console.log('[SpotRepository] Iniciando búsqueda con filtros:', filters);

      let spots: Spot[] = [];

      // Si hay filtro de ubicación y distancia, usar geohash para búsqueda eficiente
      if (filters.location && filters.maxDistance) {
        spots = await this.searchSpotsByLocation(filters);
      } else {
        // Búsqueda sin filtro de ubicación
        spots = await this.searchSpotsWithoutLocation(filters);
      }

      // Aplicar filtros adicionales en memoria (más flexible)
      spots = await this.applyInMemoryFilters(spots, filters);

      // Ordenar resultados
      spots = this.sortSpots(spots, filters);

      // Aplicar límite si existe
      if (filters.limit && filters.limit > 0) {
        const offset = filters.offset || 0;
        spots = spots.slice(offset, offset + filters.limit);
      }

      console.log(`[SpotRepository] Búsqueda completada. ${spots.length} spots encontrados`);
      return spots;

    } catch (error) {
      console.error('Error searching spots:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to search spots: ${error.message}`);
      } else {
        throw new Error('Failed to search spots: Unknown error');
      }
    }
  }

  /**
   * Buscar spots por ubicación usando geohash
   */
  private async searchSpotsByLocation(filters: SpotSearchFilters): Promise<Spot[]> {
    if (!filters.location || !filters.maxDistance) {
      return [];
    }

    const center = [filters.location.latitude, filters.location.longitude] as [number, number];
    const radiusInM = filters.maxDistance * 1000; // Convertir km a metros

    // Generar los bounds de geohash para la búsqueda
    const bounds = geohashQueryBounds(center, radiusInM);
    const spotsCollection = collection(firestore, this.COLLECTION_NAME);
    
    // Ejecutar queries para cada bound en paralelo
    const queryPromises = bounds.map(async (b) => {
      const q = query(
        spotsCollection,
        orderBy('geohash'),
        where('geohash', '>=', b[0]),
        where('geohash', '<=', b[1])
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs;
    });

    const snapshots = await Promise.all(queryPromises);
    const allDocs = snapshots.flat();

    // Convertir documentos a spots y filtrar por distancia exacta
    const spots: Spot[] = [];
    
    for (const docSnap of allDocs) {
      try {
        const spotData = docSnap.data() as any;
        const spotLocation = spotData.location as FirebaseGeoPoint;
        
        // Calcular distancia exacta
        const distanceInKm = distanceBetween(
          [spotLocation.latitude, spotLocation.longitude],
          center
        );
        
        // Solo incluir si está dentro del radio
        if (distanceInKm <= filters.maxDistance) {
          // Cargar las URLs de media
          const mediaUrls = await this.getSpotMediaUrls(docSnap.id);
          spotData.media = mediaUrls;
          
          const spot = SpotMapper.fromFirebase(docSnap.id, spotData);
          spots.push(spot);
        }
      } catch (error) {
        console.error(`Error processing spot ${docSnap.id}:`, error);
        // Continuar con el siguiente spot
      }
    }

    return spots;
  }

  /**
   * Buscar spots sin filtro de ubicación
   */
  private async searchSpotsWithoutLocation(filters: SpotSearchFilters): Promise<Spot[]> {
    const spotsCollection = collection(firestore, this.COLLECTION_NAME);
    
    // Construir query base
    let q = query(spotsCollection);

    // Aplicar filtro de deportes si existe
    if (filters.sportIds && filters.sportIds.length > 0) {
      // Firebase permite 'array-contains' para un solo valor
      // Para múltiples valores, necesitamos hacer queries separados
      q = query(q, where('availableSports', 'array-contains', filters.sportIds[0]));
    }

    // Aplicar filtro de verificación
    if (filters.onlyVerified === true) {
      q = query(q, where('isVerified', '==', true));
    }

    // Aplicar límite inicial (antes de filtros en memoria)
    const initialLimit = filters.limit ? Math.max(filters.limit * 2, 50) : 50;
    q = query(q, firestoreLimit(initialLimit));

    const snapshot = await getDocs(q);
    const spots: Spot[] = [];

    for (const docSnap of snapshot.docs) {
      try {
        const spotData = docSnap.data() as any;
        
        // Cargar las URLs de media
        const mediaUrls = await this.getSpotMediaUrls(docSnap.id);
        spotData.media = mediaUrls;
        
        const spot = SpotMapper.fromFirebase(docSnap.id, spotData);
        spots.push(spot);
      } catch (error) {
        console.error(`Error processing spot ${docSnap.id}:`, error);
      }
    }

    return spots;
  }

  /**
   * Aplicar filtros en memoria (más flexible para condiciones complejas)
   */
  private async applyInMemoryFilters(spots: Spot[], filters: SpotSearchFilters): Promise<Spot[]> {
    let filtered = [...spots];
    console.log(`[SpotRepository] Aplicando filtros en memoria. Spots iniciales: ${spots.length}`);
    console.log(`[SpotRepository] Filtros recibidos:`, JSON.stringify({
      searchQuery: filters.searchQuery,
      sportIds: filters.sportIds,
      minRating: filters.minRating,
      onlyVerified: filters.onlyVerified,
      sportCriteria: filters.sportCriteria,
    }, null, 2));

    // Filtro por búsqueda de texto
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(spot => 
        spot.details.name.toLowerCase().includes(query) ||
        spot.details.description.toLowerCase().includes(query)
      );
      console.log(`[SpotRepository] Después de filtro de texto: ${filtered.length} spots`);
    }

    // Filtro por rating mínimo general del spot
    if (filters.minRating !== undefined && filters.minRating > 0) {
      filtered = filtered.filter(spot => 
        spot.details.overallRating >= filters.minRating!
      );
    }

    if (filters.sportIds && filters.sportIds.length > 0) {
      filtered = filtered.filter(spot => {
        return filters.sportIds!.every(sportId =>
          spot.details.availableSports.includes(sportId)
        );
      });
    }

    if (filters.onlyVerified === true) {
      filtered = filtered.filter(spot => spot.metadata.isVerified === true);
    }

    if (filters.sportCriteria && filters.sportCriteria.length > 0) {
      const spotsWithCriteria = await Promise.all(
        filtered.map(async (spot) => {
          // NEW STRUCTURE: sport_metrics is subcollection under spot
          const metricsRef = collection(firestore, `spots/${spot.id}/sport_metrics`);
          const metricsSnap = await getDocs(metricsRef);
          const spotMetrics = new Map<string, { difficulty: number; quality: number }>();
          
          for (const metricDoc of metricsSnap.docs) {
            const metricData = metricDoc.data();
            // Document ID is the sportId
            spotMetrics.set(metricDoc.id, {
              difficulty: metricData.avg_difficulty || 0,
              quality: metricData.avg_rating || 0,
            });
          }
          
          const matchesAnyCriteria = filters.sportCriteria!.some(criteria => {
            const metrics = spotMetrics.get(criteria.sportId);
            
            if (!metrics) {
              return false;
            }
            
            if (criteria.difficulty) {
              const difficultyMatch = this.matchesDifficulty(metrics.difficulty, criteria.difficulty);
              if (!difficultyMatch) {
                return false;
              }
            }
            
            if (criteria.minRating !== undefined && criteria.minRating > 0) {
              if (metrics.quality < criteria.minRating) {
                return false;
              }
            }
            
            return true;
          });
          
          return matchesAnyCriteria ? spot : null;
        })
      );
      
      filtered = spotsWithCriteria.filter((spot): spot is Spot => spot !== null);
    }

    return filtered;
  }
  
  /**
   * Verifica si una dificultad numérica coincide con el rango especificado
   * @param difficulty - Dificultad numérica (0-10)
   * @param targetDifficulty - Dificultad objetivo ('easy', 'intermediate', 'hard')
   */
  private matchesDifficulty(difficulty: number, targetDifficulty: 'easy' | 'intermediate' | 'hard'): boolean {
    switch (targetDifficulty) {
      case 'easy':
        return difficulty >= 0 && difficulty < 3.33;
      case 'intermediate':
        return difficulty >= 3.33 && difficulty < 6.66;
      case 'hard':
        return difficulty >= 6.66 && difficulty <= 10;
      default:
        return true;
    }
  }

  /**
   * Ordenar spots según los criterios
   */
  private sortSpots(spots: Spot[], filters: SpotSearchFilters): Spot[] {
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    const sorted = [...spots].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (a.details.overallRating - b.details.overallRating) * multiplier;
        
        case 'name':
          return a.details.name.localeCompare(b.details.name) * multiplier;
        
        case 'recent':
          return (a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime()) * multiplier;
        
        case 'distance':
          // El ordenamiento por distancia se hace en searchSpotsByLocation
          // Aquí solo mantenemos el orden si ya está ordenado por distancia
          return 0;
        
        default:
          return 0;
      }
    });

    return sorted;
  }

  async incrementActivityCounters(spotId: string, counters: { reviewsDelta?: number; favoritesDelta?: number; visitedDelta?: number; wantToVisitDelta?: number; discussionsDelta?: number; }): Promise<void> {
    try {
      const updates: Record<string, any> = { updatedAt: Timestamp.now() };

      if (counters.reviewsDelta && counters.reviewsDelta !== 0) {
        updates.reviewsCount = increment(counters.reviewsDelta);
      }
      if (counters.favoritesDelta && counters.favoritesDelta !== 0) {
        updates.favoritesCount = increment(counters.favoritesDelta);
      }
      if (counters.visitedDelta && counters.visitedDelta !== 0) {
        updates.visitedCount = increment(counters.visitedDelta);
      }
      if (counters.wantToVisitDelta && counters.wantToVisitDelta !== 0) {
        updates.wantToVisitCount = increment(counters.wantToVisitDelta);
      }
      if (counters.discussionsDelta && counters.discussionsDelta !== 0) {
        updates.discussionsCount = increment(counters.discussionsDelta);
      }

      // No updates to apply
      if (Object.keys(updates).length === 1) {
        return;
      }

      const spotRef = doc(firestore, this.COLLECTION_NAME, spotId);
      await updateDoc(spotRef, updates);
    } catch (error) {
      console.error('Error incrementing spot activity counters:', error);
      throw new Error('Unable to update spot activity counters');
    }
  }

}
