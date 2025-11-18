import { Comment } from "@/src/entities/review/comment";
import { Review, ReviewDetails, ReviewSport } from "@/src/entities/review/review";
import { firestore, storage } from "@/src/lib/firebase-config";
import { ref as dbRef, getDatabase, push } from "firebase/database";
import {
  addDoc,
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
  updateDoc,
  where
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

/**
 * Implementación del repositorio de reviews usando Firestore
 * 
 * Estructura de datos en Firestore según firebase_structure_review_restructure.txt:
 * - reviews/{reviewId} - Review principal en colección raíz con spotId y userId
 * - reviews/{reviewId}/votes/{userId} - Votos (likes/dislikes) como subcolección
 * - reviews/{reviewId}/comments/{commentId} - Comentarios como subcolección
 * - sportRatings - Map dentro del documento review (key: sportId)
 * - spot_sport_metrics/{idMetric} - Métricas agregadas (spots + sports)
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
        // NUEVA ESTRUCTURA: reviews está en la colección raíz
        const reviewRef = doc(firestore, `reviews/${reviewId}`);
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
        
        if (isUpdate && existingReviewDoc.data()) {
          const existingData = existingReviewDoc.data() as FirestoreReviewData;
          previousRating = existingData.rating || 0;
          previousSportRatings = existingData.sportRatings || {};
        }

        // 1.3. Leer las métricas existentes para cada deporte
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

        // 2.1. Crear review principal usando la nueva estructura
        // Usar mediaUrls en vez de storagePaths para guardar URLs directamente
        const firestoreReviewData = createFirestoreReviewData(
          userId,
          spotId,
          reviewData.content,
          reviewData.rating,
          reviewData.reviewSports,
          mediaUrls // Usar URLs de descarga directamente en gallery
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
            const spotDocRef = doc(firestore, 'spots', spotId);
            const sportDocRef = doc(firestore, 'sports', sportReview.sportId);
            
            const newMetricData: FirestoreSpotSportMetrics = {
              spot_ref: spotDocRef,
              sport_ref: sportDocRef,
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
   */
  async getReviewById(reviewId: string, spotId?: string): Promise<Review | null> {
    try {
      // NUEVA ESTRUCTURA: reviews está en la colección raíz
      const reviewRef = doc(firestore, `reviews/${reviewId}`);
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
      // NUEVA ESTRUCTURA: reviews está en la colección raíz, filtramos por spotId
      const reviewsRef = collection(firestore, `reviews`);
      const q = query(
        reviewsRef,
        where("spotId", "==", spotId),
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
          mediaUrls = await this.getReviewMediaUrls(spotId, docSnapshot.id, data.gallery);
        }
        
        const reviewDataWithUrls = { ...data, gallery: mediaUrls };
        reviews.push(mapFirestoreToReview(docSnapshot.id, reviewDataWithUrls));
      }

      return reviews;
    } catch (error) {
      console.error("[ReviewRepository] Error getting reviews by spot:", error);
      throw new Error("Failed to get reviews");
    }
  }

  /**
   * Obtiene todas las reviews de un usuario
   */
  async getReviewsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Review[]> {
    try {
      // NUEVA ESTRUCTURA: reviews está en la colección raíz, filtramos por userId
      const reviewsRef = collection(firestore, `reviews`);
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
      
      // Obtener review existente - NUEVA ESTRUCTURA: colección raíz
      const reviewRef = doc(firestore, `reviews/${reviewId}`);
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
   * Obtiene los comentarios de una review con paginación
   */
  async getComments(
    reviewId: string,
    page: number,
    pageSize: number
  ): Promise<{ comments: Comment[]; total: number }> {
    try {
      const commentsRef = collection(firestore, "reviews", reviewId, "comments");
      
      // Consulta para obtener el total de comentarios no eliminados
      const totalQuery = query(
        commentsRef,
        where("isDeleted", "==", false)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      // Consulta paginada - obtener todos los comentarios ordenados
      const allCommentsQuery = query(
        commentsRef,
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(allCommentsQuery);
      
      // Aplicar paginación manualmente
      const offset = (page - 1) * pageSize;
      const allComments: Comment[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        allComments.push({
          id: doc.id,
          createdBy: data.createdBy,
          content: data.content,
          likesCount: data.likesCount || 0,
          dislikesCount: data.dislikesCount || 0,
          reports: data.reports || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          isDeleted: data.isDeleted || false,
        });
      });

      // Retornar solo la página solicitada
      const comments = allComments.slice(offset, offset + pageSize);

      return { comments, total };
    } catch (error) {
      console.error("[ReviewRepository] Error getting comments:", error);
      throw new Error("Failed to get comments");
    }
  }

  /**
   * Añade un comentario a una review
   */
  async addComment(
    reviewId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    try {
      const now = Timestamp.now();

      const commentData = {
        createdBy: userId,
        content,
        likesCount: 0,
        dislikesCount: 0,
        reports: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };

      // Dejar que Firestore genere el ID automáticamente usando addDoc
      const commentsCollectionRef = collection(firestore, "reviews", reviewId, "comments");
      const newCommentRef = await addDoc(commentsCollectionRef, commentData);
      const commentId = newCommentRef.id;

      // Actualizar el contador de comentarios
      const reviewRef = doc(firestore, "reviews", reviewId);
      await updateDoc(reviewRef, {
        commentsCount: increment(1),
      });

      return {
        id: commentId,
        createdBy: userId,
        content,
        likesCount: 0,
        dislikesCount: 0,
        reports: 0,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        isDeleted: false,
      };
    } catch (error) {
      console.error("[ReviewRepository] Error adding comment:", error);
      throw new Error("Failed to add comment");
    }
  }

  /**
   * Elimina un comentario (soft delete)
   */
  async deleteComment(reviewId: string, commentId: string): Promise<void> {
    try {
      const now = Timestamp.now();

      await runTransaction(firestore, async (transaction) => {
        const commentRef = doc(firestore, "reviews", reviewId, "comments", commentId);
        const reviewRef = doc(firestore, "reviews", reviewId);

        transaction.update(commentRef, {
          isDeleted: true,
          updatedAt: now,
        });

        transaction.update(reviewRef, {
          commentsCount: increment(-1),
        });
      });
    } catch (error) {
      console.error("[ReviewRepository] Error deleting comment:", error);
      throw new Error("Failed to delete comment");
    }
  }

  /**
   * Vota en un comentario (like o dislike)
   */
  async voteComment(
    reviewId: string,
    commentId: string,
    userId: string,
    isLike: boolean
  ): Promise<void> {
    try {
      const voteRef = doc(firestore, `reviews/${reviewId}/comments/${commentId}/votes/${userId}`);
      const commentRef = doc(firestore, `reviews/${reviewId}/comments/${commentId}`);

      await runTransaction(firestore, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        const commentDoc = await transaction.get(commentRef);

        if (!commentDoc.exists()) {
          throw new Error(`Comment ${commentId} not found`);
        }

        const currentLikesCount = commentDoc.data()?.likesCount || 0;
        const currentDislikesCount = commentDoc.data()?.dislikesCount || 0;

        if (!voteDoc.exists()) {
          // Nuevo voto
          transaction.set(voteRef, {
            isLike,
            createdAt: Timestamp.now(),
          });

          // Incrementar contador correspondiente
          if (isLike) {
            transaction.update(commentRef, { likesCount: increment(1) });
          } else {
            transaction.update(commentRef, { dislikesCount: increment(1) });
          }
        } else {
          // Voto existente - cambiar voto
          const previousVote = voteDoc.data()?.isLike;

          if (previousVote !== isLike) {
            // Actualizar el voto
            transaction.update(voteRef, { isLike });

            // Ajustar contadores
            if (isLike) {
              transaction.update(commentRef, {
                likesCount: increment(1),
                dislikesCount: increment(-1),
              });
            } else {
              transaction.update(commentRef, {
                likesCount: increment(-1),
                dislikesCount: increment(1),
              });
            }
          }
        }
      });
    } catch (error) {
      console.error("[ReviewRepository] Error voting comment:", error);
      throw new Error("Failed to vote comment");
    }
  }

  /**
   * Elimina el voto de un comentario
   */
  async removeCommentVote(
    reviewId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    try {
      const voteRef = doc(firestore, `reviews/${reviewId}/comments/${commentId}/votes/${userId}`);
      const commentRef = doc(firestore, `reviews/${reviewId}/comments/${commentId}`);

      await runTransaction(firestore, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);

        if (!voteDoc.exists()) {
          return;
        }

        const voteData = voteDoc.data();
        transaction.delete(voteRef);

        // Decrementar contador correspondiente
        if (voteData.isLike) {
          transaction.update(commentRef, { likesCount: increment(-1) });
        } else {
          transaction.update(commentRef, { dislikesCount: increment(-1) });
        }
      });
    } catch (error) {
      console.error("[ReviewRepository] Error removing comment vote:", error);
      throw new Error("Failed to remove comment vote");
    }
  }

  /**
   * Obtiene el voto de un usuario en un comentario
   */
  async getCommentVote(
    reviewId: string,
    commentId: string,
    userId: string
  ): Promise<boolean | null> {
    try {
      const voteRef = doc(firestore, `reviews/${reviewId}/comments/${commentId}/votes/${userId}`);
      const voteDoc = await getDoc(voteRef);

      if (!voteDoc.exists()) {
        return null;
      }

      return voteDoc.data()?.isLike ?? null;
    } catch (error) {
      console.error("[ReviewRepository] Error getting comment vote:", error);
      return null;
    }
  }

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
   * Vota en una review (like o dislike)
   * Crea o actualiza el voto en la subcolección votes
   * NUEVA ESTRUCTURA: reviews/{reviewId}/votes/{userId}
   */
  async voteReview(spotId: string, reviewId: string, userId: string, isLike: boolean): Promise<void> {
    try {
      const voteRef = doc(firestore, `reviews/${reviewId}/votes/${userId}`);
      const reviewRef = doc(firestore, `reviews/${reviewId}`);

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
   * NUEVA ESTRUCTURA: reviews/{reviewId}/votes/{userId}
   */
  async removeVote(spotId: string, reviewId: string, userId: string): Promise<void> {
    try {
      const voteRef = doc(firestore, `reviews/${reviewId}/votes/${userId}`);
      const reviewRef = doc(firestore, `reviews/${reviewId}`);

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
   * NUEVA ESTRUCTURA: reviews/{reviewId}/votes/{userId}
   */
  async getUserVote(spotId: string, reviewId: string, userId: string): Promise<boolean | null> {
    try {
      const voteRef = doc(firestore, `reviews/${reviewId}/votes/${userId}`);
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
