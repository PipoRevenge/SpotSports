import { Review, ReviewDetails, ReviewSport } from "@/src/entities/review/model/review";
import { firestore, storage } from "@/src/lib/firebase-config";
import { ref as dbRef, getDatabase, push } from "firebase/database";
import {
  collection,
  collectionGroup,
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
  writeBatch
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { IReviewRepository } from "../interfaces/i-review-repository";
import {
  createFirestoreReviewData,
  FirestoreReviewData,
  FirestoreSportRating,
  FirestoreSpotSportMetrics,
  mapFirestoreToReview
} from "../mappers/review-mapper";
import { voteRepository } from "./vote-repository-impl";

/**
 * Implementación del repositorio de reviews usando Firestore
 * 
 * Estructura de datos en Firestore según firebase_structure.txt:
 * - spots/{spotId}/reviews/{reviewId} - Review como subcolección del spot
 * - spots/{spotId}/reviews/{reviewId}/votes/{userId} - Votos (likes/dislikes) como subcolección
 * - spots/{spotId}/reviews/{reviewId}/comments/{commentId} - Comentarios como subcolección
 * - sportRatings - Map dentro del documento review (key: sportId)
 * - spots/{spotId}/sport_metrics/{sportId} - Métricas agregadas por deporte
 * - Las imágenes/videos se guardan en: /spots/{spotId}/reviews/{reviewId}/
 */
export class ReviewRepositoryImpl implements IReviewRepository {
  /**
   * Crea una nueva review siguiendo la estructura de Firebase
   * El reviewId será una combinación de userId_spotId para permitir una review por usuario por spot
   */
  async createReview(userId: string, reviewData: ReviewDetails): Promise<Review> {
    try {
      // Crear reviewId único combinando userId y spotId
      const reviewId = `${userId}_${reviewData.spotId}`;
      
      // Subir archivos multimedia si existen
      let mediaUrls: string[] = [];
      if (reviewData.media && reviewData.media.length > 0) {
        try {
          console.log('[ReviewRepository] Processing', reviewData.media.length, 'media files...');
          
          // Separar archivos ya en Storage de archivos locales nuevos
          const { local, remote } = this.separateLocalAndRemoteMedia(reviewData.media);
          
          console.log('[ReviewRepository] Already in Storage:', remote.length);
          console.log('[ReviewRepository] New files to upload:', local.length);
          
          // Subir solo los archivos locales nuevos
          if (local.length > 0) {
            const newUrls = await this.uploadReviewMedia(
              reviewData.spotId,
              reviewId,
              local
            );
            mediaUrls = [...remote, ...newUrls];
          } else {
            // Solo archivos remotos, no hay nada que subir
            mediaUrls = remote;
          }
          
          console.log('[ReviewRepository] Media processing successful. Total URLs:', mediaUrls.length);
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
        // ESTRUCTURA: reviews es subcolección de spots
        const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
        const existingReviewDoc = await transaction.get(reviewRef);
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
        let previousSportRatings: { [sportId: string]: FirestoreSportRating } = {};
        let existingCounts = {
          likesCount: 0,
          dislikesCount: 0,
          commentsCount: 0,
          reports: 0,
        };
        
        if (isUpdate && existingReviewDoc.data()) {
          const existingData = existingReviewDoc.data() as FirestoreReviewData;
          previousRating = existingData.rating || 0;
          previousSportRatings = existingData.sportRatings || {};
          // Preservar contadores existentes
          existingCounts = {
            likesCount: existingData.likesCount || 0,
            dislikesCount: existingData.dislikesCount || 0,
            commentsCount: existingData.commentsCount || 0,
            reports: existingData.reports || 0,
          };
        }

        // 1.3. Leer las métricas existentes para cada deporte
        const metricsData: Map<string, { ref: any; data: FirestoreSpotSportMetrics | null }> = new Map();
        
        for (const sportReview of reviewData.reviewSports) {
          // sport_metrics es subcolección de spots: spots/{spotId}/sport_metrics/{sportId}
          const sportMetricRef = doc(firestore, `spots/${spotId}/sport_metrics/${sportReview.sportId}`);
          const sportMetricDoc = await transaction.get(sportMetricRef);
          
          if (sportMetricDoc.exists()) {
            metricsData.set(sportReview.sportId, {
              ref: sportMetricRef,
              data: sportMetricDoc.data() as FirestoreSpotSportMetrics
            });
          } else {
            metricsData.set(sportReview.sportId, {
              ref: sportMetricRef,
              data: null
            });
          }
        }

        // 1.4. Si es update, leer métricas de deportes que fueron ELIMINADOS
        const removedSportsMetrics: Map<string, { ref: any; data: FirestoreSpotSportMetrics }> = new Map();
        
        if (isUpdate) {
          const currentSportIds = new Set(reviewData.reviewSports.map(s => s.sportId));
          const previousSportIds = Object.keys(previousSportRatings);
          
          for (const previousSportId of previousSportIds) {
            if (!currentSportIds.has(previousSportId)) {
              // Este deporte fue eliminado de la review
              // sport_metrics es subcolección de spots: spots/{spotId}/sport_metrics/{sportId}
              const sportMetricRef = doc(firestore, `spots/${spotId}/sport_metrics/${previousSportId}`);
              const sportMetricDoc = await transaction.get(sportMetricRef);
              
              if (sportMetricDoc.exists()) {
                removedSportsMetrics.set(previousSportId, {
                  ref: sportMetricRef,
                  data: sportMetricDoc.data() as FirestoreSpotSportMetrics
                });
              }
            }
          }
        }

        // ============================================================
        // FASE 2: TODAS LAS ESCRITURAS DESPUÉS
        // ============================================================

        // 2.1. Crear review principal usando la nueva estructura
        // Usar mediaUrls en vez de storagePaths para guardar URLs directamente
        const firestoreReviewData = createFirestoreReviewData(
          userId,
          spotId,
          reviewData.content,
          reviewData.rating,
          reviewData.reviewSports,
          mediaUrls, // Usar URLs de descarga directamente en gallery
          isUpdate ? existingCounts : undefined // Preservar contadores si es update
        );
        
        transaction.set(reviewRef, firestoreReviewData);

        // 2.2. Actualizar o crear spot_sport_metrics y determinar nuevos deportes
        const newSports: string[] = [];
        
        for (const sportReview of reviewData.reviewSports) {
          const metricInfo = metricsData.get(sportReview.sportId);
          if (!metricInfo) continue;

          if (metricInfo.data) {
            // ACTUALIZAR métricas existentes
            if (isUpdate) {
              // Obtener el rating previo de este deporte en la review anterior
              const previousSportRating = previousSportRatings[sportReview.sportId];
              const previousRatingValue = previousSportRating?.sportRating || sportReview.sportRating;
              const previousDifficulty = previousSportRating?.difficulty || sportReview.difficulty;
              
              console.log(`[ReviewRepository] Recalculating metrics for sport ${sportReview.sportId}:`, {
                previousRating: previousRatingValue,
                newRating: sportReview.sportRating,
                previousDifficulty,
                newDifficulty: sportReview.difficulty,
              });
              
              // Usar sumas para recalcular: (suma_total - valor_viejo + valor_nuevo) / count
              const currentCount = metricInfo.data.review_count || 1;
              const currentRatingSum = metricInfo.data.sum_rating || (metricInfo.data.avg_rating * currentCount);
              const currentDifficultySum = metricInfo.data.sum_difficulty || (metricInfo.data.avg_difficulty * currentCount);
              
              const newRatingSum = currentRatingSum - previousRatingValue + sportReview.sportRating;
              const newDifficultySum = currentDifficultySum - previousDifficulty + sportReview.difficulty;
              
              const newAvgRating = newRatingSum / currentCount;
              const newAvgDifficulty = newDifficultySum / currentCount;
              
              transaction.update(metricInfo.ref, {
                avg_rating: newAvgRating,
                avg_difficulty: newAvgDifficulty,
                sum_rating: newRatingSum,
                sum_difficulty: newDifficultySum,
                updatedAt: now,
              });
            } else {
              // NUEVA review: incrementar métricas
              const currentCount = metricInfo.data.review_count || 0;
              const currentRatingSum = metricInfo.data.sum_rating || 0;
              const currentDifficultySum = metricInfo.data.sum_difficulty || 0;

              const newCount = currentCount + 1;
              const newRatingSum = currentRatingSum + sportReview.sportRating;
              const newDifficultySum = currentDifficultySum + sportReview.difficulty;
              
              const newAvgRating = newRatingSum / newCount;
              const newAvgDifficulty = newDifficultySum / newCount;

              transaction.update(metricInfo.ref, {
                review_count: newCount,
                avg_rating: newAvgRating,
                avg_difficulty: newAvgDifficulty,
                sum_rating: newRatingSum,
                sum_difficulty: newDifficultySum,
                updatedAt: now,
              });
            }
          } else {
            // Crear nuevas métricas - deporte nuevo en este spot
            // La ubicación es spots/{spotId}/sport_metrics/{sportId}
            // spot_ref y sport_ref son implícitos en el path
            
            const newMetricData: FirestoreSpotSportMetrics = {
              avg_rating: sportReview.sportRating,
              avg_difficulty: sportReview.difficulty,
              review_count: 1,
              sum_rating: sportReview.sportRating,
              sum_difficulty: sportReview.difficulty,
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

        // 2.2.5. Manejar deportes ELIMINADOS de la review (solo en updates)
        const sportsToRemoveFromSpot: string[] = [];
        
        for (const [removedSportId, metricInfo] of removedSportsMetrics.entries()) {
          const previousSportRating = previousSportRatings[removedSportId];
          if (!previousSportRating) continue;
          
          const currentCount = metricInfo.data.review_count || 1;
          const currentRatingSum = metricInfo.data.sum_rating || 0;
          const currentDifficultySum = metricInfo.data.sum_difficulty || 0;
          
          if (currentCount <= 1) {
            // Era la única review de este deporte, ELIMINAR la métrica
            console.log(`[ReviewRepository] Deleting metric for sport ${removedSportId} (no more reviews)`);
            transaction.delete(metricInfo.ref);
            sportsToRemoveFromSpot.push(removedSportId);
          } else {
            // Aún hay otras reviews, DECREMENTAR la métrica
            const newCount = currentCount - 1;
            const newRatingSum = currentRatingSum - previousSportRating.sportRating;
            const newDifficultySum = currentDifficultySum - previousSportRating.difficulty;
            
            const newAvgRating = newRatingSum / newCount;
            const newAvgDifficulty = newDifficultySum / newCount;
            
            console.log(`[ReviewRepository] Updating metric for removed sport ${removedSportId}:`, {
              oldCount: currentCount,
              newCount,
              newAvgRating,
              newAvgDifficulty,
            });
            
            transaction.update(metricInfo.ref, {
              review_count: newCount,
              avg_rating: newAvgRating,
              avg_difficulty: newAvgDifficulty,
              sum_rating: newRatingSum,
              sum_difficulty: newDifficultySum,
              updatedAt: now,
            });
          }
        }

        // 2.3. Actualizar spot: contador y rating
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
        
        // Eliminar deportes que ya no tienen reviews (solo en updates)
        if (sportsToRemoveFromSpot.length > 0) {
          const updatedAvailableSports = currentAvailableSports.filter(
            (sportId: string) => !sportsToRemoveFromSpot.includes(sportId)
          );
          spotUpdates.availableSports = updatedAvailableSports;
          console.log(`[ReviewRepository] Removing sports from spot:`, sportsToRemoveFromSpot);
        }

        transaction.update(spotRef, spotUpdates);

        // 2.4. Actualizar contador de reviews del usuario (solo si es nueva)
        if (!isUpdate) {
          transaction.update(userRef, {
            reviewsCount: increment(1),
          });
        }

        // 2.5. Retornar la review creada
        return mapFirestoreToReview(reviewId, firestoreReviewData);
      });
    } catch (error) {
      console.error("[ReviewRepository] Error creating review:", error);
      throw new Error("Failed to create review");
    }
  }

  /**
   * Obtiene una review por su ID
   * Requiere spotId para acceder a la subcolección correcta
   */
  async getReviewById(reviewId: string, spotId?: string): Promise<Review | null> {
    try {
      // Si no tenemos spotId, intentamos extraerlo del reviewId (formato: userId_spotId)
      let effectiveSpotId = spotId;
      if (!effectiveSpotId) {
        const parts = reviewId.split('_');
        if (parts.length >= 2) {
          effectiveSpotId = parts.slice(1).join('_'); // En caso de que spotId contenga _
        }
      }
      
      if (!effectiveSpotId) {
        console.error('[ReviewRepository] spotId is required to get review');
        return null;
      }
      
      // ESTRUCTURA: reviews es subcolección de spots
      const reviewRef = doc(firestore, `spots/${effectiveSpotId}/reviews/${reviewId}`);
      const reviewDoc = await getDoc(reviewRef);

      if (!reviewDoc.exists()) {
        return null;
      }

      const reviewData = reviewDoc.data() as FirestoreReviewData;

      // Convertir rutas de Storage a URLs completas
      let mediaUrls: string[] = [];
      if (reviewData.gallery && reviewData.gallery.length > 0) {
        mediaUrls = await this.getReviewMediaUrls(reviewData.spotId, reviewId, reviewData.gallery);
      }

      // Actualizar gallery con URLs completas antes de mapear
      const reviewDataWithUrls = { ...reviewData, gallery: mediaUrls };
      
      return mapFirestoreToReview(reviewDoc.id, reviewDataWithUrls);
    } catch (error) {
      console.error("[ReviewRepository] Error getting review:", error);
      return null;
    }
  }

  /**
   * Obtiene la review de un usuario para un spot específico
   */
  async getUserReviewForSpot(userId: string, spotId: string): Promise<Review | null> {
    // El reviewId es la combinación de userId_spotId
    const reviewId = `${userId}_${spotId}`;
    const review = await this.getReviewById(reviewId);
    
    // Verificar que la review sea del spot correcto (seguridad adicional)
    if (review && review.details.spotId === spotId) {
      return review;
    }
    
    return null;
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
      console.log('[ReviewRepository] Loading reviews for spot:', spotId, 'limit:', limit, 'offset:', offset);
      
      // ESTRUCTURA: reviews es subcolección de spots
      const reviewsRef = collection(firestore, `spots/${spotId}/reviews`);
      const q = query(
        reviewsRef,
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const allReviews: Review[] = [];

      console.log('[ReviewRepository] Found', querySnapshot.size, 'reviews in total');

      // Cargar cada review con URLs de media
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as FirestoreReviewData;
        
        // Convertir rutas de Storage a URLs
        let mediaUrls: string[] = [];
        if (data.gallery && data.gallery.length > 0) {
          mediaUrls = await this.getReviewMediaUrls(spotId, docSnapshot.id, data.gallery);
        }
        
        const reviewDataWithUrls = { ...data, gallery: mediaUrls };
        allReviews.push(mapFirestoreToReview(docSnapshot.id, reviewDataWithUrls));
      }

      // Aplicar paginación manual
      const paginatedReviews = allReviews.slice(offset, offset + limit);
      
      console.log('[ReviewRepository] Returning', paginatedReviews.length, 'reviews (offset:', offset, 'limit:', limit, ')');

      return paginatedReviews;
    } catch (error) {
      console.error("[ReviewRepository] Error getting reviews by spot:", error);
      throw new Error("Failed to get reviews");
    }
  }

  /**
   * Obtiene todas las reviews de un usuario
   * Usa collectionGroup query para buscar en todas las subcollections de reviews
   */
  async getReviewsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Review[]> {
    try {
      // Usar collectionGroup para buscar en todas las subcollections 'reviews'
      const reviewsRef = collectionGroup(firestore, 'reviews');
      const q = query(
        reviewsRef,
        where("userId", "==", userId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        firestoreLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      // Cargar cada review con URLs de media
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as FirestoreReviewData;
        
        // Convertir rutas de Storage a URLs
        let mediaUrls: string[] = [];
        if (data.gallery && data.gallery.length > 0) {
          mediaUrls = await this.getReviewMediaUrls(data.spotId, docSnapshot.id, data.gallery);
        }
        
        const reviewDataWithUrls = { ...data, gallery: mediaUrls };
        reviews.push(mapFirestoreToReview(docSnapshot.id, reviewDataWithUrls));
      }

      return reviews;
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
      
      // Obtener review existente - ESTRUCTURA: subcolección de spots
      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }

      const existingData = reviewDoc.data() as FirestoreReviewData;
      
      // Manejar actualización de medios (ahora gallery con URLs completas)
      let finalMediaUrls: string[] = existingData.gallery || [];
      
      if (updates.media) {
        const { local, remote } = this.separateLocalAndRemoteMedia(updates.media);
        console.log('[ReviewRepository] Local media to upload:', local.length);
        console.log('[ReviewRepository] Remote media (already uploaded):', remote.length);
        
        // remote ya contiene URLs completas, mantenerlas tal cual
        const remoteUrls = remote;
        
        // Detectar archivos eliminados
        // Necesitamos comparar URLs, normalizándolas si es necesario
        const existingUrls = existingData.gallery || [];
        const normalizeUrl = (url: string) => {
          // Si es una ruta de Storage, convertirla a un identificador comparable
          if (!url.startsWith('http')) {
            return url;
          }
          // Extraer el path de Storage de la URL para comparar
          try {
            const match = url.match(/\/o\/(.+?)(\?|$)/);
            if (match) {
              return decodeURIComponent(match[1]);
            }
          } catch {
            // Si no se puede parsear, usar la URL completa
          }
          return url;
        };
        
        const currentUrlsSet = new Set(remoteUrls.map(normalizeUrl));
        const urlsToDelete: string[] = [];
        
        for (const existingUrl of existingUrls) {
          const normalized = normalizeUrl(existingUrl);
          if (!currentUrlsSet.has(normalized)) {
            // Esta URL fue eliminada, extraer la ruta de Storage para eliminar
            if (existingUrl.startsWith('http')) {
              try {
                const match = existingUrl.match(/\/o\/(.+?)(\?|$)/);
                if (match) {
                  const storagePath = decodeURIComponent(match[1]);
                  urlsToDelete.push(storagePath);
                }
              } catch {
                console.warn('[ReviewRepository] Could not extract storage path from:', existingUrl);
              }
            } else {
              // Ya es una ruta de Storage
              urlsToDelete.push(existingUrl);
            }
          }
        }
        
        // Eliminar archivos de Storage que ya no están en la review
        if (urlsToDelete.length > 0) {
          console.log('[ReviewRepository] Deleting removed media files:', urlsToDelete.length);
          await this.deleteMediaFiles(urlsToDelete);
        }
        
        // Subir solo los medios locales nuevos (uploadReviewMedia devuelve URLs completas)
        let newMediaUrls: string[] = [];
        if (local.length > 0) {
          newMediaUrls = await this.uploadReviewMedia(spotId, reviewId, local);
        }
        
        // Combinar URLs: medios ya subidos + nuevos medios subidos (todo URLs completas)
        finalMediaUrls = [...remoteUrls, ...newMediaUrls];
        
        console.log('[ReviewRepository] Final media URLs:', {
          existing: remoteUrls.length,
          new: newMediaUrls.length,
          total: finalMediaUrls.length,
          deleted: urlsToDelete.length
        });
      }

      // Extraer reviewSports del sportRatings map existente
      const existingReviewSports: ReviewSport[] = [];
      if (existingData.sportRatings) {
        for (const sportId in existingData.sportRatings) {
          const sportRating = existingData.sportRatings[sportId];
          existingReviewSports.push({
            sportId,
            sportRating: sportRating.sportRating,
            difficulty: sportRating.difficulty,
            comment: sportRating.content || "",
          });
        }
      }

      // Construir ReviewDetails completo con los cambios
      const fullReviewData: ReviewDetails = {
        spotId,
        content: updates.content ?? existingData.content,
        rating: updates.rating ?? existingData.rating,
        reviewSports: updates.reviewSports ?? existingReviewSports,
        media: finalMediaUrls, // Usar URLs completas en vez de paths
      };

      // Extraer userId del reviewId (formato: userId_spotId)
      const userId = reviewId.split('_')[0];
      
      // Re-crear la review (esto actualizará todo incluyendo métricas)
      console.log('[ReviewRepository] Re-creating review with updated data...');
      return await this.createReview(userId, fullReviewData);
      
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
   * Elimina una review permanentemente
   * Actualiza todas las métricas relacionadas:
   * - ELIMINA la review de la colección
   * - ELIMINA todos los comentarios de la review
   * - Actualiza/elimina spot_sport_metrics
   * - Actualiza overallRating y reviewsCount del spot
   * - Actualiza reviewsCount del usuario
   * - Elimina archivos multimedia de Storage
   */
  async deleteReview(reviewId: string, spotId: string): Promise<void> {
    try {
      console.log('[ReviewRepository] Deleting review:', reviewId, 'from spot:', spotId);
      
      // Primero leer la review para obtener las URLs de multimedia (antes de la transacción)
      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
      const initialReviewDoc = await getDoc(reviewRef);
      
      if (!initialReviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const initialReviewData = initialReviewDoc.data() as FirestoreReviewData;
      const mediaUrls = initialReviewData.gallery || [];
      
      // Ejecutar la transacción de eliminación
      await runTransaction(firestore, async (transaction) => {
        const now = Timestamp.now();
        
        // ============================================================
        // FASE 1: LECTURAS
        // ============================================================
        
        // 1.1. Leer la review a eliminar - ESTRUCTURA: subcolección de spots
        const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
        const reviewDoc = await transaction.get(reviewRef);
        
        if (!reviewDoc.exists()) {
          throw new Error('Review not found');
        }
        
        const reviewData = reviewDoc.data() as FirestoreReviewData;
        
        // Verificar que pertenece al spot correcto
        if (reviewData.spotId !== spotId) {
          throw new Error('Review does not belong to this spot');
        }
        
        const userId = reviewData.userId;
        const reviewRating = reviewData.rating;
        const sportRatings = reviewData.sportRatings || {};
        
        // 1.2. Leer el spot
        const spotRef = doc(firestore, `spots/${spotId}`);
        const spotDoc = await transaction.get(spotRef);
        
        if (!spotDoc.exists()) {
          throw new Error('Spot not found');
        }
        
        const spotData = spotDoc.data();
        const currentReviewsCount = spotData.reviewsCount || 0;
        const currentOverallRating = spotData.overallRating || 0;
        const currentAvailableSports = spotData.availableSports || [];
        
        // 1.3. Leer el usuario
        const userRef = doc(firestore, `users/${userId}`);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          console.warn('[ReviewRepository] User not found:', userId);
        }
        
        // 1.4. Leer métricas de todos los deportes de la review
        const sportsMetrics: Map<string, { ref: any; data: FirestoreSpotSportMetrics }> = new Map();
        const sportsToRemove: string[] = [];
        
        for (const sportId in sportRatings) {
          // sport_metrics es subcolección de spots: spots/{spotId}/sport_metrics/{sportId}
          const sportMetricRef = doc(firestore, `spots/${spotId}/sport_metrics/${sportId}`);
          const sportMetricDoc = await transaction.get(sportMetricRef);
          
          if (sportMetricDoc.exists()) {
            sportsMetrics.set(sportId, {
              ref: sportMetricRef,
              data: sportMetricDoc.data() as FirestoreSpotSportMetrics
            });
          }
        }
        
        // ============================================================
        // FASE 2: ESCRITURAS
        // ============================================================
        
        // 2.1. ELIMINAR la review permanentemente (NO soft delete)
        transaction.delete(reviewRef);
        
        // 2.2. Actualizar/eliminar métricas de deportes
        for (const [sportId, metricInfo] of sportsMetrics.entries()) {
          const sportRating = sportRatings[sportId];
          const currentCount = metricInfo.data.review_count || 1;
          const currentRatingSum = metricInfo.data.sum_rating || 0;
          const currentDifficultySum = metricInfo.data.sum_difficulty || 0;
          
          if (currentCount <= 1) {
            // Era la única review de este deporte, ELIMINAR la métrica
            console.log(`[ReviewRepository] Deleting metric for sport ${sportId} (was last review)`);
            transaction.delete(metricInfo.ref);
            sportsToRemove.push(sportId);
          } else {
            // Aún hay otras reviews, DECREMENTAR la métrica
            const newCount = currentCount - 1;
            const newRatingSum = currentRatingSum - sportRating.sportRating;
            const newDifficultySum = currentDifficultySum - sportRating.difficulty;
            
            const newAvgRating = newRatingSum / newCount;
            const newAvgDifficulty = newDifficultySum / newCount;
            
            console.log(`[ReviewRepository] Updating metric for sport ${sportId}:`, {
              oldCount: currentCount,
              newCount,
              newAvgRating,
              newAvgDifficulty,
            });
            
            transaction.update(metricInfo.ref, {
              review_count: newCount,
              avg_rating: newAvgRating,
              avg_difficulty: newAvgDifficulty,
              sum_rating: newRatingSum,
              sum_difficulty: newDifficultySum,
              updatedAt: now,
            });
          }
        }
        
        // 2.3. Actualizar el spot
        if (currentReviewsCount > 0) {
          const newReviewsCount = currentReviewsCount - 1;
          let newOverallRating = 0;
          
          if (newReviewsCount > 0) {
            // Recalcular rating sin esta review
            const totalRating = currentOverallRating * currentReviewsCount;
            const adjustedTotal = totalRating - reviewRating;
            newOverallRating = adjustedTotal / newReviewsCount;
          }
          
          const spotUpdates: any = {
            reviewsCount: newReviewsCount,
            overallRating: newOverallRating,
            updatedAt: now,
          };
          
          // Eliminar deportes que ya no tienen reviews
          if (sportsToRemove.length > 0) {
            const updatedAvailableSports = currentAvailableSports.filter(
              (sportId: string) => !sportsToRemove.includes(sportId)
            );
            spotUpdates.availableSports = updatedAvailableSports;
            console.log('[ReviewRepository] Removing sports from spot:', sportsToRemove);
          }
          
          transaction.update(spotRef, spotUpdates);
        }
        
        // 2.4. Decrementar contador de reviews del usuario
        if (userDoc.exists()) {
          const currentUserReviewsCount = userDoc.data().reviewsCount || 0;
          if (currentUserReviewsCount > 0) {
            transaction.update(userRef, {
              reviewsCount: currentUserReviewsCount - 1,
            });
          }
        }
        
        console.log('[ReviewRepository] Review deleted successfully');
      });
      
      // ============================================================
      // FASE 3: ELIMINAR COMENTARIOS Y MULTIMEDIA (fuera de transacción)
      // ============================================================
      
      // 3.1. Eliminar todos los comentarios de la review
      try {
        // ESTRUCTURA: comentarios en spots/{spotId}/reviews/{reviewId}/comments
        const commentsRef = collection(firestore, `spots/${spotId}/reviews/${reviewId}/comments`);
        const commentsSnapshot = await getDocs(commentsRef);
        
        if (!commentsSnapshot.empty) {
          console.log(`[ReviewRepository] Deleting ${commentsSnapshot.size} comments`);
          const deleteBatch = writeBatch(firestore);
          
          commentsSnapshot.docs.forEach(commentDoc => {
            deleteBatch.delete(commentDoc.ref);
          });
          
          await deleteBatch.commit();
          console.log('[ReviewRepository] Comments deleted successfully');
        }
      } catch (error) {
        console.error('[ReviewRepository] Error deleting comments:', error);
        // No lanzar error, continuar con la eliminación de multimedia
      }
      
      // 3.2. Eliminar archivos multimedia de Storage
      // Esto se hace después porque no es crítico si falla
      if (mediaUrls.length > 0) {
        const storagePaths: string[] = [];
        
        for (const url of mediaUrls) {
          if (url.startsWith('http')) {
            try {
              const match = url.match(/\/o\/(.+?)(\?|$)/);
              if (match?.[1]) {
                const storagePath = decodeURIComponent(match[1]);
                storagePaths.push(storagePath);
              }
            } catch {
              console.warn('[ReviewRepository] Could not extract storage path from:', url);
            }
          } else {
            storagePaths.push(url);
          }
        }
        
        if (storagePaths.length > 0) {
          console.log('[ReviewRepository] Deleting media files:', storagePaths.length);
          await this.deleteMediaFiles(storagePaths);
        }
      }
      
    } catch (error) {
      console.error("[ReviewRepository] Error deleting review:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to delete review");
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

  // NOTE: Comment methods removed - use commentRepository directly:
  // - commentRepository.getCommentsByParent(`spots/${spotId}/reviews/${reviewId}`, page, pageSize)
  // - commentRepository.addComment(`spots/${spotId}/reviews/${reviewId}`, ...)
  // - commentRepository.deleteComment(`spots/${spotId}/reviews/${reviewId}`, commentId)
  //
  // NOTE: Vote methods removed - use voteRepository directly:
  // - voteRepository.vote(`spots/${spotId}/reviews/${reviewId}`, userId, isLike)
  // - voteRepository.removeVote(`spots/${spotId}/reviews/${reviewId}`, userId)
  // - voteRepository.getUserVote(`spots/${spotId}/reviews/${reviewId}`, userId)

  /**
   * Sube archivos multimedia de una review a Firebase Storage
   * Ruta: reviews/{reviewId}/
   * Nombre de archivo: uuid.ext
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

      const downloadUrls: string[] = [];

      for (let i = 0; i < mediaUris.length; i++) {
        const mediaUri = mediaUris[i];
        
        console.log(`[ReviewRepository] Processing file ${i + 1}/${mediaUris.length}:`, {
          uri: mediaUri,
          isLocal: mediaUri.startsWith('file://') || mediaUri.startsWith('content://'),
          isHttp: mediaUri.startsWith('http'),
        });
        
        // Determinar extensión del archivo
        const extension = this.getFileExtension(mediaUri);
        
        // Generar ID único usando Firebase
        const uniqueId = push(dbRef(getDatabase())).key || `${Date.now()}_${i}`;
        
        // Crear nombre del archivo: uniqueId.ext según estructura de Firebase Storage
        const fileName = `${uniqueId}${extension}`;
        
        // Crear ruta de Storage: reviews/{reviewId}/{fileName}
        const storagePath = `reviews/${reviewId}/${fileName}`;
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
          
          console.log(`[ReviewRepository] ✓ Successfully uploaded file ${i + 1}/${mediaUris.length}`);
          
          // Obtener URL de descarga
          const downloadUrl = await getDownloadURL(storageRef);
          downloadUrls.push(downloadUrl);
          console.log(`File uploaded successfully. URL: ${downloadUrl}`);
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

      console.log(`[ReviewRepository] ✓ All ${downloadUrls.length} files uploaded successfully`);
      return downloadUrls;
    } catch (error) {
      console.error('[ReviewRepository] Error uploading review media:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   * - Rutas de Storage (reviews/..., spots/...) → Ya en Firebase Storage (remote)
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
      // Rutas de Storage (empiezan con "reviews/" o "spots/") → Ya subidos
      else if (uri.startsWith('reviews/') || uri.startsWith('spots/')) {
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

  // ==================== VOTE METHODS ====================

  /**
   * Vota en una review (like o dislike)
   * Delega al voteRepository usando el path correcto
   */
  async voteReview(spotId: string, reviewId: string, userId: string, isLike: boolean): Promise<void> {
    const reviewPath = `spots/${spotId}/reviews/${reviewId}`;
    return await voteRepository.vote(reviewPath, userId, isLike);
  }

  /**
   * Elimina el voto de un usuario en una review
   */
  async removeReviewVote(spotId: string, reviewId: string, userId: string): Promise<void> {
    const reviewPath = `spots/${spotId}/reviews/${reviewId}`;
    return await voteRepository.removeVote(reviewPath, userId);
  }

  /**
   * Obtiene el voto actual de un usuario en una review
   */
  async getReviewVote(spotId: string, reviewId: string, userId: string): Promise<boolean | null> {
    const reviewPath = `spots/${spotId}/reviews/${reviewId}`;
    return await voteRepository.getUserVote(reviewPath, userId);
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
