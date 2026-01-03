import { SportSpotRating, Spot, SpotDetails } from '@/src/entities/spot/model/spot';
import { firestore, functions, storage } from '@/src/lib/firebase-config';
import { ref as dbRef, getDatabase, push } from 'firebase/database';
import { collection, doc, limit as firestoreLimit, getDoc, getDocs, increment, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
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
   * Crear un nuevo spot usando cloud function
   */
  async createSpot(spotData: SpotDetails, userId: string, username: string): Promise<string> {
    const startTime = Date.now();
    console.log('[SpotRepository:createSpot] Starting spot creation', {
      userId,
      spotName: spotData.name,
      mediaCount: spotData.media?.length || 0,
      timestamp: new Date().toISOString(),
    });

    try {
      // Validaciones en el cliente
      if (!spotData) throw new Error('Spot data is required');
      if (!spotData.name || spotData.name.trim().length === 0) throw new Error('Spot name is required');
      if (!spotData.location || !spotData.location.latitude || !spotData.location.longitude) {
        throw new Error('Valid location is required');
      }

      // Upload media files to Storage if provided
      let galleryUrls: string[] = [];
      if (spotData.media && spotData.media.length > 0) {
        console.log(`[SpotRepository:createSpot] Uploading ${spotData.media.length} media files`);
        const uploadStartTime = Date.now();
        
        // Create a temporary spot ID for media uploads
        const tempSpotId = push(dbRef(getDatabase())).key || `${Date.now()}`;
        galleryUrls = await this.uploadSpotMedia(tempSpotId, userId, spotData.media);
        
        const uploadDuration = Date.now() - uploadStartTime;
        console.log('[SpotRepository:createSpot] Media upload completed', {
          count: galleryUrls.length,
          durationMs: uploadDuration,
          urls: galleryUrls,
        });
      }

      // Call cloud function
      console.log('[SpotRepository:createSpot] Calling cloud function spots_create');
      const createSpotFn = httpsCallable(functions, 'spots_create');
      const functionCallData = {
        name: spotData.name,
        description: spotData.description,
        location: {
          lat: spotData.location.latitude,
          lng: spotData.location.longitude,
        },
        availableSports: spotData.availableSports || [],
        galleryUrls,
        contactPhone: spotData.contactInfo?.phone,
        contactEmail: spotData.contactInfo?.email,
        contactWebsite: spotData.contactInfo?.website,
      };
      
      console.log('[SpotRepository:createSpot] Function payload', {
        ...functionCallData,
        galleryUrls: `${galleryUrls.length} URLs`,
      });
      
      const functionStartTime = Date.now();
      const result = await createSpotFn(functionCallData);
      const functionDuration = Date.now() - functionStartTime;

      const { spotId } = result.data as { spotId: string; spot: any };
      const totalDuration = Date.now() - startTime;
      
      console.log('[SpotRepository:createSpot] Spot created successfully', {
        spotId,
        totalDurationMs: totalDuration,
        functionDurationMs: functionDuration,
        timestamp: new Date().toISOString(),
      });
      
      return spotId;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error('[SpotRepository:createSpot] Failed to create spot', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        userId,
        spotName: spotData.name,
        durationMs: totalDuration,
        timestamp: new Date().toISOString(),
      });
      
      if (error instanceof Error) {
        throw new Error(`Failed to create spot: ${error.message}`);
      } else {
        throw new Error('Failed to create spot: Unknown error');
      }
    }
  }

  /**
   * Update an existing spot. Uploads any new media and calls the update cloud function.
   */
  async updateSpot(spotId: string, spotData: Partial<SpotDetails>, userId: string): Promise<void> {
    if (!spotId || typeof spotId !== 'string' || spotId.trim().length === 0) {
      throw new Error('Valid spot ID is required');
    }

    try {
      const payload: any = { spotId };

      // Handle media: if spotData.media is provided, separate existing remote URLs and local URIs
      if (spotData.media && spotData.media.length > 0) {
        const existingUrls: string[] = spotData.media.filter((u: string) => typeof u === 'string' && u.startsWith('http'));
        const localUris: string[] = spotData.media.filter((u: string) => typeof u === 'string' && !u.startsWith('http'));

        let uploadedUrls: string[] = [];
        if (localUris.length > 0) {
          // Upload new files into the spot's gallery folder
          uploadedUrls = await this.uploadSpotMedia(spotId, userId, localUris);
        }

        payload.galleryUrls = [...existingUrls, ...uploadedUrls];
      }

      if (spotData.name !== undefined) payload.name = spotData.name;
      if (spotData.description !== undefined) payload.description = spotData.description;
      if (spotData.availableSports !== undefined) payload.availableSports = spotData.availableSports;
      if ((spotData as any).difficulty !== undefined) payload.difficulty = (spotData as any).difficulty;

      // Remove undefined fields
      const cleaned = this.removeUndefinedFields(payload);

      console.log('[SpotRepository:updateSpot] Calling cloud function spots_update with', {
        ...cleaned,
        galleryUrls: cleaned.galleryUrls ? `${cleaned.galleryUrls.length} URLs` : undefined,
      });

      const updateFn = httpsCallable(functions, 'spots_update');
      await updateFn(cleaned);

      console.log('[SpotRepository:updateSpot] Spot updated successfully', { spotId });
    } catch (error) {
      console.error('[SpotRepository:updateSpot] Failed to update spot', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        spotId,
        userId,
        timestamp: new Date().toISOString(),
      });
      throw new Error(error instanceof Error ? error.message : 'Failed to update spot');
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
      // Removed getSpotMediaUrls call to rely on Firestore data
      // const mediaUrls = await this.getSpotMediaUrls(id);
      // spotData.galleryUrls = mediaUrls;

      if (spotData.createdBy && typeof spotData.createdBy === 'object') {
        const extracted = SpotMapper.extractCreatedBy(spotData.createdBy);
        if (extracted) {
          // Normalize locally to avoid propagating DocumentReference shapes through the app
          spotData.createdBy = extracted;
          console.info('[SpotRepository:getSpotById] Normalized createdBy to string', { spotId: id, createdBy: extracted });
        } else {
          console.warn('[SpotRepository:getSpotById] Spot has non-string createdBy in Firestore and could not be normalized', { spotId: id, createdByRaw: spotData.createdBy });
        }
      }

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

  /**
   * Subir archivos multimedia a Storage y retornar las URLs
   * Solo usado para subir archivos antes de crear/actualizar spots
   */
  private async uploadSpotMedia(spotId: string, userId: string, mediaUris: string[]): Promise<string[]> {
    const galleryUrls: string[] = [];
    
    try {
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
      console.error('[SpotRepository:uploadSpotMedia] Media upload failed', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        spotId,
        userId,
        mediaCount: mediaUris.length,
        uploadedCount: galleryUrls.length,
        timestamp: new Date().toISOString(),
      });
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
   * Buscar spots usando cloud function
   */
  async searchSpots(filters: SpotSearchFilters): Promise<Spot[]> {
    try {
      console.log('[SpotRepository] Iniciando búsqueda con filtros:', filters);

      // Use cloud function if location-based search is requested
      if (filters.location && filters.maxDistance) {
        const searchSpotsFn = httpsCallable(functions, 'spots_search');
        const result = await searchSpotsFn({
          location: {
            lat: filters.location.latitude,
            lng: filters.location.longitude,
          },
          radiusKm: filters.maxDistance,
          sports: filters.sportIds,
          minRating: filters.minRating,
          limit: filters.limit || 50,
        });

        const { spots: spotData } = result.data as { spots: any[] };
        let spots = spotData.map((data: any) => SpotMapper.fromFirebase(data.id, data));
        
        // Apply text filter in memory since cloud function doesn't support it yet
        if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
          const query = filters.searchQuery.toLowerCase().trim();
          spots = spots.filter(spot => 
            spot.details.name.toLowerCase().includes(query) ||
            spot.details.description.toLowerCase().includes(query)
          );
        }
        
        console.log(`[SpotRepository] Búsqueda completada. ${spots.length} spots encontrados`);
        return spots;
      }

      // Fallback to local search for non-location queries
      let spots = await this.searchSpotsWithoutLocation(filters);
      spots = await this.applyInMemoryFilters(spots, filters);
      spots = this.sortSpots(spots, filters);

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
   * Buscar spots sin filtro de ubicación (fallback para búsquedas no geoespaciales)
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
        // Removed getSpotMediaUrls call to rely on Firestore data
        // const mediaUrls = await this.getSpotMediaUrls(docSnap.id);
        // spotData.galleryUrls = mediaUrls;
        
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
