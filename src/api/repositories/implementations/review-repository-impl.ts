import { Review, ReviewDetails } from "@/src/entities/review/model/review";
import { firestore, functions, storage } from "@/src/lib/firebase-config";
import { ReviewFilters, ReviewSortOptions, shouldApplyCreatedByMe } from '@/src/types/filtering.types';
import { ref as dbRef, getDatabase, push } from "firebase/database";
import {
    collection,
    collectionGroup,
    doc,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    orderBy,
    query,
    where
} from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { IReviewRepository } from "../interfaces/i-review-repository";
import {
    FirestoreReviewData,
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
      // Upload media files to Storage if provided
      const mediaUris: string[] = reviewData.media || [];
      let uploadedMediaUrls: string[] = [];
      
      if (mediaUris.length > 0) {
        try {
          console.log('[ReviewRepository] Processing', mediaUris.length, 'media files...');
          
          // Separate files already in Storage from new local files
          const { local, remote } = this.separateLocalAndRemoteMedia(mediaUris);
          
          console.log('[ReviewRepository] Already in Storage:', remote.length);
          console.log('[ReviewRepository] New files to upload:', local.length);
          
          // Upload only new local files
          if (local.length > 0) {
            // Create a temporary review ID for media uploads
            const tempReviewId = `${userId}_${reviewData.spotId}`;
            const newUrls = await this.uploadReviewMedia(
              reviewData.spotId,
              tempReviewId,
              local
            );
            uploadedMediaUrls = [...remote, ...newUrls];
          } else {
            uploadedMediaUrls = remote;
          }
          
          console.log('[ReviewRepository] Media processing successful. Total URLs:', uploadedMediaUrls.length);
        } catch (uploadError) {
          console.error('[ReviewRepository] Media upload failed:', uploadError);
          throw new Error(`Failed to upload media files: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Convert ReviewSport[] to Record<string, SportRating>
      const sportRatings: Record<string, any> = {};
      for (const sport of reviewData.reviewSports) {
        sportRatings[sport.sportId] = {
          sportRating: sport.sportRating,
          difficulty: sport.difficulty,
          content: sport.comment,
        };
      }

      // Call cloud function
      const createReviewFn = httpsCallable(functions, 'reviews_create');
      const result = await createReviewFn({
        spotId: reviewData.spotId,
        rating: reviewData.rating,
        content: reviewData.content,
        sportRatings,
        mediaUrls: uploadedMediaUrls,
      });

      const { reviewId, review } = result.data as { reviewId: string; review: any };

      // Map the response to entity
      return mapFirestoreToReview(reviewId, review);
    } catch (error) {
      console.error('[ReviewRepository] createReview:', error);
      throw error;
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

      // We'll perform two queries: one that checks 'userId' and another 'createdBy'
      // to support older documents that used a different field name.
      const q1 = query(
        reviewsRef,
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );

      const q2 = query(
        reviewsRef,
        where('createdBy', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const docMap = new Map<string, any>();

      const pushDocs = (snap: any) => {
        for (const d of snap.docs) {
          if (!docMap.has(d.id)) docMap.set(d.id, d);
        }
      };

      pushDocs(snap1);
      pushDocs(snap2);

      const docs = Array.from(docMap.values()).slice(offset, offset + limit);

      const reviews: Review[] = [];

      // Cargar cada review con URLs de media
      for (const docSnapshot of docs) {
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
   * Get reviews with filters and sorting
   */
  async getReviews(options: {
    spotId?: string;
    filters?: ReviewFilters;
    sort?: ReviewSortOptions;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Review[]> {
    try {
      const { spotId, filters, sort, userId, limit = 20, offset = 0 } = options;

      // Check if we should apply createdByMe filter
      const applyCreatedByMe = userId && filters && shouldApplyCreatedByMe(filters);

      let q;

      if (applyCreatedByMe) {
        // When createdByMe is active, use collectionGroup to get user's reviews
        return this.getReviewsByUser(userId, limit, offset);
      }

      if (spotId || filters?.spotId) {
        // Query specific spot
        const targetSpotId = spotId || filters!.spotId!;
        const reviewsRef = collection(firestore, `spots/${targetSpotId}/reviews`);
        q = query(
          reviewsRef,
          where("isDeleted", "==", false)
        );
      } else {
        // Query across all spots
        const reviewsRef = collectionGroup(firestore, 'reviews');
        q = query(
          reviewsRef,
          where("isDeleted", "==", false)
        );
      }

      // Add Firestore ordering
      const sortField = sort?.field || 'newest';
      if (sortField === 'oldest') {
        q = query(q, orderBy('createdAt', 'asc'));
      } else if (sortField === 'ratingHigh') {
        q = query(q, orderBy('rating', 'desc'), orderBy('createdAt', 'desc'));
      } else if (sortField === 'ratingLow') {
        q = query(q, orderBy('rating', 'asc'), orderBy('createdAt', 'desc'));
      } else if (sortField === 'mostVoted') {
        q = query(q, orderBy('likesCount', 'desc'), orderBy('createdAt', 'desc'));
      } else {
        // Default: newest
        q = query(q, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      let allReviews: Review[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as FirestoreReviewData;

        // Extract spotId from path if using collectionGroup
        const targetSpotId = spotId || filters?.spotId || docSnapshot.ref.path.split('/')[1];

        let mediaUrls: string[] = [];
        if (data.gallery && data.gallery.length > 0) {
          mediaUrls = await this.getReviewMediaUrls(targetSpotId, docSnapshot.id, data.gallery);
        }

        const reviewDataWithUrls = { ...data, gallery: mediaUrls };
        const review = mapFirestoreToReview(docSnapshot.id, reviewDataWithUrls);

        // Apply client-side filters
        let includeReview = true;

        if (filters) {
          // Filter by sport
          if (filters.sportId) {
            includeReview = review.details.reviewSports.some(
              rs => rs.sportId === filters.sportId
            );
          }

          // Filter by rating
          if (includeReview && filters.minRating !== undefined) {
            includeReview = review.details.rating >= filters.minRating;
          }
          if (includeReview && filters.maxRating !== undefined) {
            includeReview = review.details.rating <= filters.maxRating;
          }
        }

        if (includeReview) {
          allReviews.push(review);
        }
      }

      // Apply pagination
      return allReviews.slice(offset, offset + limit);
    } catch (error) {
      console.error("[ReviewRepository] Error in getReviews:", error);
      throw new Error("Failed to get reviews");
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
      console.log('[ReviewRepository] updateReview:', spotId, reviewId, updates);

      // Get existing data to handle media updates
      const reviewRef = doc(firestore, `spots/${spotId}/reviews/${reviewId}`);
      const existingSnap = await getDoc(reviewRef);
      if (!existingSnap.exists()) throw new Error('Review not found');
      const existingData = existingSnap.data() as any;

      let uploadedMediaUrls: string[] | undefined;

      if (updates.media) {
        const { local, remote } = this.separateLocalAndRemoteMedia(updates.media);

        // Delete old media that's no longer in the update
        const existingUrls = existingData.gallery || [];
        const normalizeUrl = (url: string) => {
          if (!url.startsWith('http')) return url;
          try {
            const match = url.match(/\/o\/(.+?)(\?|$)/);
            if (match) return decodeURIComponent(match[1]);
          } catch { /* ignore */ }
          return url;
        };

        const remoteNormalized = new Set(remote.map(normalizeUrl));
        const urlsToDelete: string[] = [];

        for (const existingUrl of existingUrls) {
          const normalized = normalizeUrl(existingUrl);
          if (!remoteNormalized.has(normalized)) {
            if (existingUrl.startsWith('http')) {
              try {
                const match = existingUrl.match(/\/o\/(.+?)(\?|$)/);
                if (match?.[1]) urlsToDelete.push(decodeURIComponent(match[1]));
              } catch { /* ignore */ }
            } else {
              urlsToDelete.push(existingUrl);
            }
          }
        }

        if (urlsToDelete.length > 0) {
          await this.deleteMediaFiles(urlsToDelete);
        }

        // Upload new local files
        if (local.length > 0) {
          const uploaded = await this.uploadReviewMedia(spotId, reviewId, local);
          uploadedMediaUrls = [...remote, ...uploaded];
        } else {
          uploadedMediaUrls = [...remote];
        }
      }

      // Convert ReviewSport[] to Record<string, SportRating> if provided
      let sportRatings: Record<string, any> | undefined;
      if (updates.reviewSports) {
        sportRatings = {};
        for (const sport of updates.reviewSports) {
          sportRatings[sport.sportId] = {
            sportRating: sport.sportRating,
            difficulty: sport.difficulty,
            content: sport.comment,
          };
        }
      }

      // Call cloud function
      const updateReviewFn = httpsCallable(functions, 'reviews_update');
      const result = await updateReviewFn({
        spotId,
        reviewId,
        rating: updates.rating,
        content: updates.content,
        sportRatings,
        mediaUrls: uploadedMediaUrls,
      });

      const { review } = result.data as { success: boolean; review: any };

      // Map the response to entity
      return mapFirestoreToReview(reviewId, review);
    } catch (error) {
      console.error('[ReviewRepository] updateReview:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: string, spotId: string): Promise<void> {
    try {
      // Call cloud function
      const deleteReviewFn = httpsCallable(functions, 'reviews_delete');
      await deleteReviewFn({
        spotId,
        reviewId,
      });
    } catch (error) {
      console.error('[ReviewRepository] deleteReview:', error);
      throw error;
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
