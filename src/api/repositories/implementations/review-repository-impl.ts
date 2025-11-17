import { Review, ReviewDetails, ReviewSport } from "@/src/entities/review/review";
import { firestore, storage } from "@/src/lib/firebase-config";
import {
  collection,
  doc,
  limit as firestoreLimit,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { IReviewRepository } from "../interfaces/i-review-repository";
import {
  createFirestoreReviewData,
  createFirestoreSportReviewData,
  FirestoreReviewData,
  FirestoreSportReviewData,
  FirestoreSpotSportMetrics,
  mapFirestoreToReview,
  mapFirestoreToReviewSport,
} from "../mappers/review-mapper";

/**
 * Implementación del repositorio de reviews usando Firestore
 * 
 * Estructura de datos en Firestore según firebase_structure.txt:
 * - spots/{spotId}/reviews/{reviewId} - Review principal con contenido y rating general
 * - spots/{spotId}/sport_review/{sportReviewId} - Calificaciones específicas por deporte
 * - spot_sport_metrics/{idMetric} - Métricas agregadas (spots + sports)
 * - Las imágenes/videos se guardan en: /spots/{spotId}/reviews/{reviewId}/
 */
export class ReviewRepositoryImpl implements IReviewRepository {
  /**
   * Crea una nueva review siguiendo la estructura de Firebase
   * El reviewId será igual al userId para permitir una sola review por usuario por spot
   */
  async createReview(userId: string, reviewData: ReviewDetails): Promise<Review> {
    try {
      // Usar el userId como reviewId para permitir solo una review por usuario por spot
      const reviewId = userId;
      
      // Subir archivos multimedia si existen
      let mediaStoragePaths: string[] = [];
      if (reviewData.media && reviewData.media.length > 0) {
        try {
          console.log('[ReviewRepository] Processing', reviewData.media.length, 'media files...');
          
          // Separar archivos ya en Storage de archivos locales nuevos
          const { local, remote } = this.separateLocalAndRemoteMedia(reviewData.media);
          
          console.log('[ReviewRepository] Already in Storage:', remote.length);
          console.log('[ReviewRepository] New files to upload:', local.length);
          
          // Subir solo los archivos locales nuevos
          if (local.length > 0) {
            const newPaths = await this.uploadReviewMedia(
              reviewData.spotId,
              reviewId,
              local
            );
            mediaStoragePaths = [...remote, ...newPaths];
          } else {
            // Solo archivos remotos, no hay nada que subir
            mediaStoragePaths = remote;
          }
          
          console.log('[ReviewRepository] Media processing successful. Total paths:', mediaStoragePaths.length);
        } catch (uploadError) {
          console.error('[ReviewRepository] Media upload failed:', uploadError);
          throw new Error(`Failed to upload media files. Please check:
1. Firebase Storage emulator is running
2. Network connection is stable
3. File permissions are correct

Original error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
      
      return await runTransaction(firestore, async (transaction) => {
        const now = Timestamp.now();
        const spotId = reviewData.spotId;

        // ============================================================
        // FASE 1: TODAS LAS LECTURAS PRIMERO (requerimiento de Firestore)
        // ============================================================

        // 1.0. Verificar si ya existe una review de este usuario en este spot
        const reviewsCollectionRef = collection(firestore, `spots/${spotId}/reviews`);
        const existingReviewRef = doc(reviewsCollectionRef, reviewId);
        const existingReviewDoc = await transaction.get(existingReviewRef);
        const isUpdate = existingReviewDoc.exists();

        // 1.1. Leer el spot para verificar que existe
        const spotRef = doc(firestore, `spots/${spotId}`);
        const spotDoc = await transaction.get(spotRef);

        if (!spotDoc.exists()) {
          throw new Error(`Spot ${spotId} not found`);
        }

        const spotData = spotDoc.data();
        const currentOverallRating = spotData.overallRating || 0;
        const currentReviewsCount = spotData.reviewsCount || 0;
        const currentAvailableSports = spotData.availableSports || [];

        // 1.2. Leer el usuario para actualizar contador
        const userRef = doc(firestore, `users/${userId}`);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error(`User ${userId} not found`);
        }

        // Si es actualización, obtener el rating anterior para recalcular
        let previousRating = 0;
        if (isUpdate && existingReviewDoc.data()) {
          previousRating = existingReviewDoc.data().rating || 0;
        }

        // 1.3. Si es actualización, leer todos los sport_review anteriores
        const previousSportReviewsMap: Map<string, FirestoreSportReviewData> = new Map();
        if (isUpdate && existingReviewDoc.data()) {
          const existingData = existingReviewDoc.data() as FirestoreReviewData;
          const previousSportReviewIds = existingData.refSportReviews || [];
          
          for (const prevSportReviewId of previousSportReviewIds) {
            const prevSportReviewRef = doc(firestore, `spots/${spotId}/sport_review/${prevSportReviewId}`);
            const prevSportReviewDoc = await transaction.get(prevSportReviewRef);
            
            if (prevSportReviewDoc.exists()) {
              const prevData = prevSportReviewDoc.data() as FirestoreSportReviewData;
              previousSportReviewsMap.set(prevData.sportId, prevData);
            }
          }
        }

        // 1.4. Leer las métricas existentes para cada deporte
        const metricsData: Map<string, { ref: any; data: FirestoreSpotSportMetrics | null }> = new Map();
        
        for (const sportReview of reviewData.reviewSports) {
          const spotDocRef = doc(firestore, 'spots', spotId);
          const sportDocRef = doc(firestore, 'sports', sportReview.sportId);
          
          const metricsQuery = query(
            collection(firestore, 'spot_sport_metrics'),
            where('spot_ref', '==', spotDocRef),
            where('sport_ref', '==', sportDocRef),
            firestoreLimit(1)
          );

          const metricsSnapshot = await getDocs(metricsQuery);
          
          if (!metricsSnapshot.empty) {
            const metricDoc = metricsSnapshot.docs[0];
            const metricRef = doc(firestore, `spot_sport_metrics/${metricDoc.id}`);
            metricsData.set(sportReview.sportId, {
              ref: metricRef,
              data: metricDoc.data() as FirestoreSpotSportMetrics
            });
          } else {
            metricsData.set(sportReview.sportId, {
              ref: doc(collection(firestore, 'spot_sport_metrics')),
              data: null
            });
          }
        }

        // ============================================================
        // FASE 2: TODAS LAS ESCRITURAS DESPUÉS
        // ============================================================

        // 2.1. Usar la referencia de review
        const newReviewRef = existingReviewRef;

        // 2.2. Crear o actualizar documentos sport_review con referencia a la review
        const sportReviewIds: string[] = [];
        
        // Si es actualización, obtener los IDs de sport_review existentes
        let existingSportReviewIds: string[] = [];
        if (isUpdate && existingReviewDoc.data()) {
          existingSportReviewIds = (existingReviewDoc.data() as FirestoreReviewData).refSportReviews || [];
        }

        for (let i = 0; i < reviewData.reviewSports.length; i++) {
          const sportReview = reviewData.reviewSports[i];
          const sportReviewCollectionRef = collection(firestore, `spots/${spotId}/sport_review`);
          
          // Si es actualización y tenemos un ID existente para este índice, reutilizarlo
          let sportReviewDocRef;
          let sportReviewId;
          
          if (isUpdate && i < existingSportReviewIds.length) {
            // Reutilizar el documento existente
            sportReviewId = existingSportReviewIds[i];
            sportReviewDocRef = doc(sportReviewCollectionRef, sportReviewId);
          } else {
            // Crear nuevo documento (para nuevas reviews o deportes adicionales)
            sportReviewDocRef = doc(sportReviewCollectionRef);
            sportReviewId = sportReviewDocRef.id;
          }
          
          const sportReviewData = createFirestoreSportReviewData(
            newReviewRef, // Referencia directa a la review
            sportReview.sportId,
            sportReview.sportRating,
            sportReview.difficulty,
            sportReview.comment
          );
          
          transaction.set(sportReviewDocRef, sportReviewData);
          sportReviewIds.push(sportReviewId);
        }
        
        // Si es actualización y se eliminaron deportes, borrar los sport_review sobrantes
        if (isUpdate && existingSportReviewIds.length > reviewData.reviewSports.length) {
          const idsToDelete = existingSportReviewIds.slice(reviewData.reviewSports.length);
          for (const idToDelete of idsToDelete) {
            const docToDelete = doc(firestore, `spots/${spotId}/sport_review/${idToDelete}`);
            transaction.delete(docToDelete);
          }
        }

        // 2.3. Actualizar o crear spot_sport_metrics y determinar nuevos deportes
        const newSports: string[] = [];
        
        for (const sportReview of reviewData.reviewSports) {
          const metricInfo = metricsData.get(sportReview.sportId);
          if (!metricInfo) continue;

          if (metricInfo.data) {
            // ACTUALIZAR métricas existentes
            if (isUpdate) {
              // Obtener el rating previo de este deporte en la review anterior
              // Usamos el Map que llenamos en FASE 1 (todas las lecturas ya están hechas)
              const previousSportReview = previousSportReviewsMap.get(sportReview.sportId);
              const previousSportRating = previousSportReview?.sportRating || sportReview.sportRating;
              const previousDifficulty = previousSportReview?.difficulty || sportReview.difficulty;
              
              console.log(`[ReviewRepository] Recalculating metrics for sport ${sportReview.sportId}:`, {
                previousRating: previousSportRating,
                newRating: sportReview.sportRating,
                previousDifficulty,
                newDifficulty: sportReview.difficulty,
              });
              
              // Recalcular usando: (suma_total - valor_viejo + valor_nuevo) / count
              const currentCount = metricInfo.data.review_count || 1;
              const currentQualitySum = (metricInfo.data.avg_quality || 0) * currentCount;
              const currentDifficultySum = (metricInfo.data.avg_difficulty || 0) * currentCount;
              
              const newAvgQuality = (currentQualitySum - previousSportRating + sportReview.sportRating) / currentCount;
              const newAvgDifficulty = (currentDifficultySum - previousDifficulty + sportReview.difficulty) / currentCount;
              
              transaction.update(metricInfo.ref, {
                avg_quality: newAvgQuality,
                avg_difficulty: newAvgDifficulty,
                updatedAt: now,
              });
            } else {
              // NUEVA review: incrementar métricas
              const currentCount = metricInfo.data.review_count || 0;
              const currentQualitySum = (metricInfo.data.avg_quality || 0) * currentCount;
              const currentDifficultySum = (metricInfo.data.avg_difficulty || 0) * currentCount;

              const newCount = currentCount + 1;
              const newAvgQuality = (currentQualitySum + sportReview.sportRating) / newCount;
              const newAvgDifficulty = (currentDifficultySum + sportReview.difficulty) / newCount;

              transaction.update(metricInfo.ref, {
                review_count: newCount,
                avg_quality: newAvgQuality,
                avg_difficulty: newAvgDifficulty,
                updatedAt: now,
              });
            }
          } else {
            // Crear nuevas métricas - deporte nuevo en este spot
            const spotDocRef = doc(firestore, 'spots', spotId);
            const sportDocRef = doc(firestore, 'sports', sportReview.sportId);
            
            const newMetricData: FirestoreSpotSportMetrics = {
              spot_ref: spotDocRef,
              sport_ref: sportDocRef,
              avg_quality: sportReview.sportRating,
              avg_difficulty: sportReview.difficulty,
              review_count: 1,
              createdAt: now,
              updatedAt: now,
            };

            transaction.set(metricInfo.ref, newMetricData);
            
            // Añadir a la lista de deportes nuevos si no está en availableSports
            if (!currentAvailableSports.includes(sportReview.sportId)) {
              newSports.push(sportReview.sportId);
            }
          }
        }

        // 2.4. Crear review principal con referencia al usuario y rutas de Storage
        const firestoreReviewData = createFirestoreReviewData(
          userId,
          reviewData.content,
          reviewData.rating,
          sportReviewIds,
          mediaStoragePaths // Usar rutas de Storage en lugar de URIs locales
        );
        
        transaction.set(newReviewRef, firestoreReviewData);

        // 2.5. Actualizar spot: contador y rating
        // Si es actualización, recalcular el rating considerando el cambio
        let newReviewsCount = currentReviewsCount;
        let newOverallRating = currentOverallRating;
        
        if (isUpdate) {
          // Actualización: recalcular rating
          const totalRating = currentOverallRating * currentReviewsCount;
          const adjustedTotal = totalRating - previousRating + reviewData.rating;
          newOverallRating = adjustedTotal / currentReviewsCount;
        } else {
          // Nueva review: incrementar contador y recalcular rating
          newReviewsCount = currentReviewsCount + 1;
          newOverallRating = ((currentOverallRating * currentReviewsCount) + reviewData.rating) / newReviewsCount;
        }
        
        const spotUpdates: any = {
          overallRating: newOverallRating,
          updatedAt: now,
        };

        // Solo incrementar contador si es nueva review
        if (!isUpdate) {
          spotUpdates.reviewsCount = increment(1);
        }

        // Añadir nuevos deportes si los hay
        if (newSports.length > 0) {
          spotUpdates.availableSports = [...currentAvailableSports, ...newSports];
        }

        transaction.update(spotRef, spotUpdates);

        // 2.6. Actualizar contador de reviews del usuario (solo si es nueva)
        if (!isUpdate) {
          transaction.update(userRef, {
            reviewsCount: increment(1),
          });

          // 2.7. Crear referencia en la subcolección de reviews del usuario
          const userReviewRef = doc(firestore, `users/${userId}/reviews/${reviewId}`);
          transaction.set(userReviewRef, {
            reviewRef: newReviewRef, // Referencia directa a la review del spot
            createdAt: now,
          });
        }

        // 2.8. Retornar la review creada
        return mapFirestoreToReview(reviewId, firestoreReviewData, reviewData.reviewSports, spotId);
      });
    } catch (error) {
      console.error("[ReviewRepository] Error creating review:", error);
      throw new Error("Failed to create review");
    }
  }

  /**
   * Obtiene una review por su ID y spotId
   */
  async getReviewById(reviewId: string, spotId?: string): Promise<Review | null> {
    try {
      if (!spotId) {
        throw new Error("getReviewById requires spotId");
      }

      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
      const reviewDoc = await getDoc(reviewRef);

      if (!reviewDoc.exists()) {
        return null;
      }

      const reviewData = reviewDoc.data() as FirestoreReviewData;

      // Cargar los sport_reviews asociados
      const sportReviews = await this.loadSportReviews(spotId, reviewData.refSportReviews);

      // Convertir rutas de Storage a URLs completas
      let mediaUrls: string[] = [];
      if (reviewData.media && reviewData.media.length > 0) {
        mediaUrls = await this.getReviewMediaUrls(spotId, reviewId, reviewData.media);
      }

      return mapFirestoreToReview(reviewDoc.id, { ...reviewData, media: mediaUrls }, sportReviews, spotId);
    } catch (error) {
      console.error("[ReviewRepository] Error getting review:", error);
      return null;
    }
  }

  /**
   * Obtiene la review de un usuario para un spot específico
   */
  async getUserReviewForSpot(userId: string, spotId: string): Promise<Review | null> {
    // Como el reviewId es igual al userId, simplemente llamamos a getReviewById
    return this.getReviewById(userId, spotId);
  }

  /**
   * Carga los sport_reviews desde sus IDs
   */
  private async loadSportReviews(spotId: string, sportReviewIds: string[]): Promise<ReviewSport[]> {
    const sportReviews: ReviewSport[] = [];

    for (const sportReviewId of sportReviewIds) {
      const sportReviewRef = doc(firestore, `spots/${spotId}/sport_review/${sportReviewId}`);
      const sportReviewDoc = await getDoc(sportReviewRef);

      if (sportReviewDoc.exists()) {
        const data = sportReviewDoc.data() as FirestoreSportReviewData;
        sportReviews.push(mapFirestoreToReviewSport(data));
      }
    }

    return sportReviews;
  }

  /**
   * Obtiene todas las reviews de un spot
   */
  async getReviewsBySpot(
    spotId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Review[]> {
    try {
      const reviewsRef = collection(firestore, `spots/${spotId}/reviews`);
      const q = query(
        reviewsRef,
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        firestoreLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      // Cargar cada review con sus sport_reviews
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as FirestoreReviewData;
        const sportReviews = await this.loadSportReviews(spotId, data.refSportReviews);
        reviews.push(mapFirestoreToReview(docSnapshot.id, data, sportReviews));
      }

      return reviews;
    } catch (error) {
      console.error("[ReviewRepository] Error getting reviews by spot:", error);
      throw new Error("Failed to get reviews");
    }
  }

  /**
   * Obtiene todas las reviews de un usuario
   * Nota: Esta funcionalidad requeriría una colección adicional users/{userId}/reviews
   * que no está en la estructura actual de Firebase
   */
  async getReviewsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Review[]> {
    try {
      // TODO: Implementar cuando se defina la estructura de user reviews
      // Por ahora, lanzamos un error indicando que no está implementado
      throw new Error("getReviewsByUser not yet implemented - requires user reviews collection");
    } catch (error) {
      console.error("[ReviewRepository] Error getting reviews by user:", error);
      throw new Error("Failed to get user reviews");
    }
  }

  /**
   * Actualiza una review existente
   * 
   * IMPORTANTE: Este método re-crea la review usando createReview() porque:
   * 1. Necesita recalcular todas las métricas (spot_sport_metrics)
   * 2. Debe manejar cambios en deportes calificados (crear/actualizar sport_review)
   * 3. createReview ya maneja tanto creación como actualización (detecta si existe)
   * 4. Mantiene consistencia en la lógica de cálculo de métricas
   */
  async updateReview(
    reviewId: string,
    spotId: string,
    updates: Partial<ReviewDetails>
  ): Promise<Review> {
    try {
      console.log('[ReviewRepository] Updating review:', reviewId, 'for spot:', spotId);
      
      // Obtener review existente
      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }

      const existingData = reviewDoc.data() as FirestoreReviewData;
      
      // Manejar actualización de medios
      let finalMediaPaths: string[] = existingData.media || [];
      
      if (updates.media) {
        const { local, remote } = this.separateLocalAndRemoteMedia(updates.media);
        console.log('[ReviewRepository] Local media to upload:', local.length);
        console.log('[ReviewRepository] Remote media (already uploaded):', remote.length);
        
        // Convertir URLs remotas de vuelta a rutas de Storage
        const remotePaths = remote.map(url => {
          // Si ya es una ruta de Storage, mantenerla
          if (!url.startsWith('http')) {
            return url;
          }
          // Si es URL de Firebase Storage, extraer la ruta
          // Formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?...
          try {
            const match = url.match(/\/o\/(.+?)(\?|$)/);
            if (match) {
              return decodeURIComponent(match[1]);
            }
          } catch {
            console.warn('[ReviewRepository] Could not extract path from URL:', url);
          }
          return url;
        });
        
        // Detectar archivos eliminados (estaban en existingData.media pero NO en remotePaths)
        const existingPaths = existingData.media || [];
        const pathsToDelete = existingPaths.filter(existingPath => 
          !remotePaths.includes(existingPath)
        );
        
        // Eliminar archivos de Storage que ya no están en la review
        if (pathsToDelete.length > 0) {
          console.log('[ReviewRepository] Deleting removed media files:', pathsToDelete.length);
          await this.deleteMediaFiles(pathsToDelete);
        }
        
        // Subir solo los medios locales nuevos
        let newMediaPaths: string[] = [];
        if (local.length > 0) {
          newMediaPaths = await this.uploadReviewMedia(spotId, reviewId, local);
        }
        
        // Combinar rutas: medios ya subidos + nuevos medios subidos
        finalMediaPaths = [...remotePaths, ...newMediaPaths];
      }

      // Construir ReviewDetails completo con los cambios
      const fullReviewData: ReviewDetails = {
        spotId,
        content: updates.content ?? existingData.content,
        rating: updates.rating ?? existingData.rating,
        reviewSports: updates.reviewSports ?? await this.loadSportReviews(spotId, existingData.refSportReviews),
        media: finalMediaPaths,
      };

      // Re-crear la review (esto actualizará todo incluyendo métricas)
      console.log('[ReviewRepository] Re-creating review with updated data...');
      return await this.createReview(reviewId, fullReviewData);
      
    } catch (error) {
      console.error("[ReviewRepository] Error updating review:", error);
      
      // Propagar el error original si tiene mensaje útil
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Failed to update review");
    }
  }

  /**
   * Elimina una review (soft delete)
   * TODO: Implementar lógica de eliminación con soft delete
   */
  async deleteReview(reviewId: string, spotId: string): Promise<void> {
    try {
      // TODO: Implementar soft delete
      // 1. Actualizar campo isDeleted = true en la review
      // 2. Decrementar contadores en spot_sport_metrics
      // 3. Actualizar métricas del spot
      
      console.log("[ReviewRepository] Delete review not yet implemented:", reviewId, spotId);
      throw new Error("Delete review functionality not yet implemented");
    } catch (error) {
      console.error("[ReviewRepository] Error deleting review:", error);
      throw new Error("Failed to delete review");
    }
  }

  /**
   * Da like a una review
   */
  async likeReview(reviewId: string, userId: string): Promise<void> {
    try {
      // TODO: Implementar sistema de likes (requiere spotId)
      throw new Error("Like review not yet implemented");
    } catch (error) {
      console.error("[ReviewRepository] Error liking review:", error);
      throw new Error("Failed to like review");
    }
  }

  /**
   * Elimina el like de una review
   */
  async unlikeReview(reviewId: string, userId: string): Promise<void> {
    try {
      // TODO: Implementar
      throw new Error("Unlike review not yet implemented");
    } catch (error) {
      console.error("[ReviewRepository] Error unliking review:", error);
      throw new Error("Failed to unlike review");
    }
  }

  /**
   * Reporta una review
   */
  async reportReview(
    reviewId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      // TODO: Implementar sistema de reportes
      throw new Error("Report review not yet implemented");
    } catch (error) {
      console.error("[ReviewRepository] Error reporting review:", error);
      throw new Error("Failed to report review");
    }
  }

  /**
   * Sube archivos multimedia de una review a Firebase Storage
   * Ruta: spots/{spotId}/reviews/{reviewId}/
   * Nombre de archivo: {reviewId}_0.jpg, {reviewId}_1.jpg, etc.
   */
  async uploadReviewMedia(spotId: string, reviewId: string, mediaUris: string[]): Promise<string[]> {
    try {
      if (!mediaUris || mediaUris.length === 0) {
        return [];
      }

      console.log('[ReviewRepository] Upload diagnostics:', {
        spotId,
        reviewId,
        fileCount: mediaUris.length,
        storageConfig: storage.app.options.storageBucket,
      });

      const storagePaths: string[] = [];

      for (let i = 0; i < mediaUris.length; i++) {
        const mediaUri = mediaUris[i];
        const fileNumber = i;
        
        console.log(`[ReviewRepository] Processing file ${i + 1}/${mediaUris.length}:`, {
          uri: mediaUri,
          isLocal: mediaUri.startsWith('file://') || mediaUri.startsWith('content://'),
          isHttp: mediaUri.startsWith('http'),
        });
        
        // Determinar extensión del archivo
        const extension = this.getFileExtension(mediaUri);
        
        // Crear nombre del archivo: reviewId_n.ext (ej: abc123_0.jpg, abc123_1.jpg)
        const fileName = `${reviewId}_${fileNumber}${extension}`;
        
        // Crear ruta de Storage: spots/{spotId}/reviews/{reviewId}/{fileName}
        const storagePath = `spots/${spotId}/reviews/${reviewId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        try {
          // Descargar el archivo desde la URI local
          console.log('[ReviewRepository] Fetching file from URI...');
          const response = await fetch(mediaUri);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Verificar que el blob tenga contenido
          if (!blob || blob.size === 0) {
            throw new Error('Empty file blob');
          }
          
          console.log(`[ReviewRepository] Uploading ${blob.size} bytes (type: ${blob.type}) to: ${storagePath}`);
          
          // Subir a Storage
          await uploadBytes(storageRef, blob);
          
          console.log(`[ReviewRepository] ✓ Successfully uploaded file ${fileNumber + 1}/${mediaUris.length}`);
          
          // Guardar la ruta de Storage (sin gs://bucket/)
          storagePaths.push(storagePath);
        } catch (fileError) {
          console.error(`[ReviewRepository] ✗ Error uploading file ${i}:`, {
            uri: mediaUri,
            storagePath,
            error: fileError,
            errorName: fileError instanceof Error ? fileError.name : 'Unknown',
            errorMessage: fileError instanceof Error ? fileError.message : 'Unknown error',
            stack: fileError instanceof Error ? fileError.stack : undefined,
          });
          
          // Agregar contexto más específico según el tipo de error
          let errorMessage = `Failed to upload file ${i + 1}`;
          if (fileError instanceof Error) {
            if (fileError.message.includes('Network request failed')) {
              errorMessage += ': Firebase Storage emulator may not be running. Please start it with "firebase emulators:start"';
            } else {
              errorMessage += `: ${fileError.message}`;
            }
          }
          
          throw new Error(errorMessage);
        }
      }

      console.log(`[ReviewRepository] ✓ All ${storagePaths.length} files uploaded successfully`);
      return storagePaths;
    } catch (error) {
      console.error('[ReviewRepository] Error uploading review media:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Vota en una review (like o dislike)
   * Crea o actualiza el voto en la subcolección votes
   */
  async voteReview(spotId: string, reviewId: string, userId: string, isLike: boolean): Promise<void> {
    try {
      const voteRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}/votes/${userId}`);
      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);

      await runTransaction(firestore, async (transaction) => {
        // Leer el voto actual y la review
        const voteDoc = await transaction.get(voteRef);
        const reviewDoc = await transaction.get(reviewRef);

        if (!reviewDoc.exists()) {
          throw new Error('Review not found');
        }

        const currentLikes = reviewDoc.data().likes || 0;
        const currentDislikes = reviewDoc.data().dislikes || 0;

        let likesChange = 0;
        let dislikesChange = 0;

        if (voteDoc.exists()) {
          // El usuario ya votó, actualizar el voto
          const previousVote = voteDoc.data().isLike;
          
          if (previousVote !== isLike) {
            // Cambió de like a dislike o viceversa
            if (isLike) {
              likesChange = 1;
              dislikesChange = -1;
            } else {
              likesChange = -1;
              dislikesChange = 1;
            }
          }
          // Si el voto es el mismo, no hacer nada (ya está votado)
        } else {
          // Nuevo voto
          if (isLike) {
            likesChange = 1;
          } else {
            dislikesChange = 1;
          }
        }

        // Actualizar el voto
        transaction.set(voteRef, {
          isLike,
          createdAt: Timestamp.now(),
        });

        // Actualizar los contadores en la review
        transaction.update(reviewRef, {
          likes: currentLikes + likesChange,
          dislikes: currentDislikes + dislikesChange,
        });
      });
    } catch (error) {
      console.error('[ReviewRepository] Error voting review:', error);
      throw new Error(`Failed to vote review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Elimina el voto de una review
   */
  async removeVote(spotId: string, reviewId: string, userId: string): Promise<void> {
    try {
      const voteRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}/votes/${userId}`);
      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);

      await runTransaction(firestore, async (transaction) => {
        // Leer el voto actual y la review
        const voteDoc = await transaction.get(voteRef);
        const reviewDoc = await transaction.get(reviewRef);

        if (!reviewDoc.exists()) {
          throw new Error('Review not found');
        }

        if (!voteDoc.exists()) {
          // No hay voto que eliminar
          return;
        }

        const wasLike = voteDoc.data().isLike;
        const currentLikes = reviewDoc.data().likes || 0;
        const currentDislikes = reviewDoc.data().dislikes || 0;

        // Eliminar el voto
        transaction.delete(voteRef);

        // Actualizar los contadores
        if (wasLike) {
          transaction.update(reviewRef, {
            likes: Math.max(0, currentLikes - 1),
          });
        } else {
          transaction.update(reviewRef, {
            dislikes: Math.max(0, currentDislikes - 1),
          });
        }
      });
    } catch (error) {
      console.error('[ReviewRepository] Error removing vote:', error);
      throw new Error(`Failed to remove vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene el voto de un usuario en una review
   */
  async getUserVote(spotId: string, reviewId: string, userId: string): Promise<boolean | null> {
    try {
      const voteRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}/votes/${userId}`);
      const voteDoc = await getDoc(voteRef);

      if (!voteDoc.exists()) {
        return null;
      }

      return voteDoc.data().isLike;
    } catch (error) {
      console.error('[ReviewRepository] Error getting user vote:', error);
      return null;
    }
  }

  /**
   * Obtener extensión del archivo desde la URI
   */
  private getFileExtension(uri: string): string {
    // Intentar obtener la extensión del final de la URI
    const match = uri.match(/\.(\w+)(\?|$)/);
    if (match && match[1]) {
      return `.${match[1]}`;
    }
    
    // Si no se puede determinar, usar .jpg por defecto para imágenes
    return '.jpg';
  }

  /**
   * Convierte rutas de Storage a URLs completas de descarga
   * Si ya son URLs completas, las devuelve tal cual
   */
  private async getReviewMediaUrls(spotId: string, reviewId: string, mediaPaths: string[]): Promise<string[]> {
    try {
      const urls = await Promise.all(
        mediaPaths.map(async (path) => {
          // Si ya es una URL completa, devolverla directamente
          if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
          }
          
          // Si es una ruta de Storage, obtener URL de descarga
          try {
            const storageRef = ref(storage, path);
            const url = await getDownloadURL(storageRef);
            return url;
          } catch (error) {
            console.warn('[ReviewRepository] Error getting download URL for:', path, error);
            return path; // Devolver path original si falla
          }
        })
      );
      
      return urls;
    } catch (error) {
      console.error('[ReviewRepository] Error getting review media URLs:', error);
      return mediaPaths; // Devolver paths originales si falla todo
    }
  }

  /**
   * Elimina archivos de Firebase Storage
   * @param storagePaths - Array de rutas de Storage a eliminar
   */
  private async deleteMediaFiles(storagePaths: string[]): Promise<void> {
    try {
      const deletePromises = storagePaths.map(async (path) => {
        try {
          const fileRef = ref(storage, path);
          await deleteObject(fileRef);
          console.log('[ReviewRepository] Deleted file from Storage:', path);
        } catch (error) {
          // Si el archivo no existe, no es un error crítico
          console.warn('[ReviewRepository] Could not delete file (may not exist):', path, error);
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('[ReviewRepository] Error deleting media files:', error);
      // No lanzar error, solo registrar - la actualización puede continuar
    }
  }

  /**
   * Separa medios locales (para subir) de URLs remotas (ya subidas)
   * Detecta:
   * - URLs HTTP/HTTPS → Ya en Firebase Storage (remote)
   * - Rutas de Storage (spots/...) → Ya en Firebase Storage (remote)
   * - URIs locales (file://, content://) → Archivos nuevos (local)
   */
  private separateLocalAndRemoteMedia(mediaUris: string[]): { local: string[]; remote: string[] } {
    const local: string[] = [];
    const remote: string[] = [];

    for (const uri of mediaUris) {
      // URLs HTTP/HTTPS → Ya subidos
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        remote.push(uri);
      } 
      // Rutas de Storage (empiezan con "spots/") → Ya subidos
      else if (uri.startsWith('spots/')) {
        remote.push(uri);
      }
      // URIs locales → Archivos nuevos
      else if (uri.startsWith('file://') || uri.startsWith('content://')) {
        local.push(uri);
      } 
      // Por defecto, tratar como local
      else {
        console.warn('[ReviewRepository] Unknown URI format, treating as local:', uri);
        local.push(uri);
      }
    }

    console.log('[ReviewRepository] separateLocalAndRemoteMedia result:', {
      totalUris: mediaUris.length,
      localCount: local.length,
      remoteCount: remote.length,
    });

    return { local, remote };
  }
}

/**
 * Singleton del repositorio de reviews
 */
let reviewRepositoryInstance: ReviewRepositoryImpl | null = null;

export const getReviewRepository = (): IReviewRepository => {
  if (!reviewRepositoryInstance) {
    reviewRepositoryInstance = new ReviewRepositoryImpl();
  }
  return reviewRepositoryInstance;
};
