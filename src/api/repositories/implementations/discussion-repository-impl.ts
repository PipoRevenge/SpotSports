import { mapFirestoreDiscussionToEntity } from '@/src/api/repositories/mappers/discussion-mapper';
import { Discussion, DiscussionDetails } from '@/src/entities/discussion/model/discussion';
import { firestore, functions, storage } from '@/src/lib/firebase-config';
import { DiscussionFilters, DiscussionSortOptions, shouldApplyCreatedByMe } from '@/src/types/filtering.types';
import * as FileSystem from 'expo-file-system';
import { ref as dbRef, getDatabase, push } from 'firebase/database';
import {
    collection,
    collectionGroup,
    doc,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { IDiscussionRepository } from '../interfaces/i-discussion-repository';
import { voteRepository } from './vote-repository-impl';

/**
 * DiscussionRepositoryImpl - Discussions as subcollections under spots
 *
 * Paths: spots/{spotId}/discussions/{discussionId}
 * Uses collectionGroup('discussions') for queries when spotId is unknown.
 */
export class DiscussionRepositoryImpl implements IDiscussionRepository {
  private getDiscussionsCollectionPath(spotId: string): string {
    return `spots/${spotId}/discussions`;
  }

  private getDiscussionDocPath(spotId: string, discussionId: string): string {
    return `${this.getDiscussionsCollectionPath(spotId)}/${discussionId}`;
  }

  /**
   * Helper to find a discussion by ID using collectionGroup when spotId is unknown
   */
  private async findDiscussionById(discussionId: string): Promise<{ discussion: Discussion; spotId: string } | null> {
    const discussionsGroupRef = collectionGroup(firestore, 'discussions');
    
    // Query all non-deleted discussions and find by ID
    // Try alternative approach - query by document ID pattern
    const allDiscussionsQ = query(
      discussionsGroupRef,
      where('isDeleted', '==', false),
      firestoreLimit(500) // Practical limit
    );
    const snapshot = await getDocs(allDiscussionsQ);
    
    for (const d of snapshot.docs) {
      if (d.id === discussionId) {
        const pathSegments = d.ref.path.split('/');
        const spotId = pathSegments[1];
        const data = d.data() as any;
        let mediaUrls: string[] = [];
        if (data.media && data.media.length > 0) {
          mediaUrls = await this.getDiscussionMediaUrls(spotId, d.id, data.media);
        }
        return {
          discussion: mapFirestoreDiscussionToEntity(
            { id: d.id, data: () => ({ ...data, media: mediaUrls }) } as any,
            spotId
          ),
          spotId,
        };
      }
    }
    return null;
  }

  async createDiscussion(spotId: string, userId: string, discussionData: DiscussionDetails): Promise<Discussion> {
    let tempDiscussionId: string | null = null;
    try {
      // Upload media files to Storage if provided
      const mediaUris: string[] = discussionData.media || [];
      let uploadedMediaUrls: string[] = [];
      
      if (mediaUris.length > 0) {
        const { local, remote } = this.separateLocalAndRemoteMedia(mediaUris);
        if (local.length > 0) {
          // Create a temporary discussion ID for media uploads
          tempDiscussionId = push(dbRef(getDatabase())).key || `${Date.now()}`;
          try {
            const uploaded = await this.uploadDiscussionMedia(spotId, tempDiscussionId, local);
            uploadedMediaUrls = [...remote, ...uploaded];
          } catch (uploadErr) {
            console.error('[DiscussionRepository] createDiscussion: media upload failed', uploadErr);
            // If upload fails, we might have partial uploads. Cleanup.
            if (tempDiscussionId) {
              await this.deleteDiscussionMediaFolder(spotId, tempDiscussionId);
            }
            throw new Error('Failed to upload discussion media. Please try again.');
          }
        } else {
          uploadedMediaUrls = remote;
        }
      }

      // Call cloud function
      const createDiscussionFn = httpsCallable(functions, 'discussions-create');
      const result = await createDiscussionFn({
        spotId,
        title: discussionData.title,
        description: discussionData.description || '',
        tags: discussionData.tags || ['Q&A'],
        mediaUrls: uploadedMediaUrls,
      });

      const { discussionId, discussion } = result.data as { discussionId: string; discussion: any };

      // Map the response to entity
      return mapFirestoreDiscussionToEntity(
        { id: discussionId, data: () => discussion },
        spotId
      );
    } catch (error) {
      console.error('[DiscussionRepository] createDiscussion:', error);
      // Rollback: delete uploaded media if function failed
      if (tempDiscussionId) {
        console.log('[DiscussionRepository] Rolling back media uploads for tempId:', tempDiscussionId);
        await this.deleteDiscussionMediaFolder(spotId, tempDiscussionId);
      }
      throw error;
    }
  }

  async getDiscussionById(discussionId: string, spotId?: string): Promise<Discussion | null> {
    try {
      if (spotId) {
        // Direct query with spotId (faster)
        const docRef = doc(firestore, this.getDiscussionDocPath(spotId, discussionId));
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        const data = snap.data() as any;
        let mediaUrls: string[] = [];
        if (data.media && data.media.length > 0) {
          mediaUrls = await this.getDiscussionMediaUrls(spotId, discussionId, data.media);
        }
        return mapFirestoreDiscussionToEntity(
          { id: snap.id, data: () => ({ ...data, media: mediaUrls }) } as any,
          spotId
        );
      }

      // Fallback: use collectionGroup to find by ID
      const result = await this.findDiscussionById(discussionId);
      return result?.discussion || null;
    } catch (error) {
      console.error('[DiscussionRepository] getDiscussionById:', error);
      throw error;
    }
  }

  async getDiscussions(options: {
    page: number;
    pageSize: number;
    filters?: DiscussionFilters;
    sort?: DiscussionSortOptions;
    userId?: string;
  }): Promise<{ discussions: Discussion[]; total: number }> {
    try {
      const { filters, sort, userId } = options;
      
      // Check if we should apply createdByMe filter (only if set and no other filters)
      const applyCreatedByMe = userId && filters && shouldApplyCreatedByMe(filters);
      
      let baseQuery;
      
      if (filters?.spotId) {
        // Query within specific spot
        const colRef = collection(firestore, this.getDiscussionsCollectionPath(filters.spotId));
        baseQuery = query(colRef, where('isDeleted', '==', false));
      } else {
        // Query across all spots using collectionGroup
        const discussionsGroupRef = collectionGroup(firestore, 'discussions');
        baseQuery = query(discussionsGroupRef, where('isDeleted', '==', false));
      }

      let q = baseQuery;
      
      // Apply createdByMe filter if applicable
      if (applyCreatedByMe) {
        q = query(q, where('createdBy', '==', userId));
      }
      
      // Apply other filters only if createdByMe is not in effect
      if (!applyCreatedByMe && filters) {
        if (filters.tag) {
          q = query(q, where('tags', 'array-contains', filters.tag));
        }
        if (filters.sportId) {
          // Filter by sport if spot has sport association
          q = query(q, where('sportId', '==', filters.sportId));
        }
        if (filters.search) {
          const lower = filters.search.toLowerCase();
          q = query(q, where('titleLower', '>=', lower));
        }
      }

      // Apply sorting
      const sortField = sort?.field || 'newest';
      if (sortField === 'oldest') {
        q = query(q, orderBy('createdAt', 'asc'));
      } else if (sortField === 'mostVoted') {
        q = query(q, orderBy('likesCount', 'desc'));
      } else {
        // Default: newest
        q = query(q, orderBy('createdAt', 'desc'));
      }

      const snap = await getDocs(q);
      const total = snap.size;
      const result: Discussion[] = [];
      
      for (const d of snap.docs) {
        // Extract spotId from path if using collectionGroup
        const pathSegments = d.ref.path.split('/');
        const docSpotId = pathSegments[1];
        const data = d.data() as any;
        let mediaUrls: string[] = [];
        if (data.media && data.media.length > 0) {
          mediaUrls = await this.getDiscussionMediaUrls(docSpotId, d.id, data.media);
        }
        result.push(
          mapFirestoreDiscussionToEntity(
            { id: d.id, data: () => ({ ...data, media: mediaUrls }) } as any,
            docSpotId
          )
        );
      }
      
      const offset = (options.page - 1) * options.pageSize;
      const pageDiscussions = result.slice(offset, offset + options.pageSize);

      return { discussions: pageDiscussions, total };
    } catch (error) {
      console.error('[DiscussionRepository] getDiscussions:', error);
      throw error;
    }
  }

  async getDiscussionsByUser(userId: string, limit: number = 20, offset: number = 0): Promise<Discussion[]> {
    try {
      const discussionsGroupRef = collectionGroup(firestore, 'discussions');

      const q1 = query(
        discussionsGroupRef,
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );
      const q2 = query(
        discussionsGroupRef,
        where('createdBy', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );

      // Execute queries individually to handle missing indexes gracefully
      let snap1, snap2;

      try {
        snap1 = await getDocs(q1);
      } catch (e) {
        console.warn('[DiscussionRepository] Query by userId failed (likely index missing):', e);
        snap1 = { docs: [] };
      }

      try {
        snap2 = await getDocs(q2);
      } catch (e) {
        console.warn('[DiscussionRepository] Query by createdBy failed (likely index missing):', e);
        snap2 = { docs: [] };
      }
      const docMap = new Map<string, any>();
      for (const d of snap1.docs) if (!docMap.has(d.id)) docMap.set(d.id, d);
      for (const d of snap2.docs) if (!docMap.has(d.id)) docMap.set(d.id, d);

      const merged = Array.from(docMap.values()).slice(offset, offset + limit);
      const all: Discussion[] = [];

      for (const d of merged) {
        const pathSegments = d.ref.path.split('/');
        const spotId = pathSegments[1];
        const data = d.data() as any;
        let mediaUrls: string[] = [];
        if (data.media && data.media.length > 0) {
          mediaUrls = await this.getDiscussionMediaUrls(spotId, d.id, data.media);
        }
        all.push(
          mapFirestoreDiscussionToEntity(
            { id: d.id, data: () => ({ ...data, media: mediaUrls }) } as any,
            spotId
          )
        );
      }

      return all;
    } catch (error) {
      console.error('[DiscussionRepository] getDiscussionsByUser:', error);
      throw error;
    }
  }

  async updateDiscussion(
    discussionId: string,
    updates: Partial<DiscussionDetails>,
    spotId?: string
  ): Promise<Discussion> {
    try {
      // Resolve spotId if not provided
      let resolvedSpotId = spotId;
      if (!resolvedSpotId) {
        const found = await this.findDiscussionById(discussionId);
        if (!found) throw new Error('Discussion not found');
        resolvedSpotId = found.spotId;
      }

      console.log('[DiscussionRepository] updateDiscussion:', resolvedSpotId, discussionId, updates);

      const discussionRef = doc(firestore, this.getDiscussionDocPath(resolvedSpotId, discussionId));
      const existingSnap = await getDoc(discussionRef);
      if (!existingSnap.exists()) throw new Error('Discussion not found');
      const existingData = existingSnap.data() as any;

      let finalMedia: string[] = existingData.media || [];

      if (updates.media) {
        const { local, remote } = this.separateLocalAndRemoteMedia(updates.media);

        const existingUrls = existingData.media || [];
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

        if (local.length > 0) {
          const uploaded = await this.uploadDiscussionMedia(resolvedSpotId, discussionId, local);
          finalMedia = [...remote, ...uploaded];
        } else {
          finalMedia = [...remote];
        }
      }

      const updatesWithTimestamp: any = {
        ...updates,
        media: finalMedia,
        updatedAt: Timestamp.now(),
      };
      if (updates.title) {
        updatesWithTimestamp.titleLower = updates.title.toLowerCase();
      }

      // Call cloud function
      const updateDiscussionFn = httpsCallable(functions, 'discussions-update');
      const result = await updateDiscussionFn({
        spotId: resolvedSpotId,
        discussionId,
        title: updates.title,
        description: updates.description,
        tags: updates.tags,
        mediaUrls: finalMedia,
      });

      const { discussion } = result.data as { discussion: any };

      // Map the response to entity
      return mapFirestoreDiscussionToEntity(
        { id: discussionId, data: () => discussion },
        resolvedSpotId
      );
    } catch (error) {
      console.error('[DiscussionRepository] updateDiscussion:', error);
      throw error;
    }
  }

  async deleteDiscussion(discussionId: string, spotId?: string): Promise<void> {
    try {
      let resolvedSpotId = spotId;
      if (!resolvedSpotId) {
        const found = await this.findDiscussionById(discussionId);
        if (!found) return; // Already doesn't exist
        resolvedSpotId = found.spotId;
      }

      // Call cloud function
      const deleteDiscussionFn = httpsCallable(functions, 'discussions-delete');
      await deleteDiscussionFn({
        spotId: resolvedSpotId,
        discussionId,
      });
    } catch (error) {
      console.error('[DiscussionRepository] deleteDiscussion:', error);
      throw error;
    }
  }

  async uploadDiscussionMedia(spotId: string, discussionId: string, mediaUris: string[]): Promise<string[]> {
    try {
      if (!mediaUris || mediaUris.length === 0) return [];
      console.log('[DiscussionRepository] Upload diagnostics:', {
        spotId,
        discussionId,
        fileCount: mediaUris.length,
        storageBucket: storage.app.options.storageBucket,
      });
      const downloadUrls: string[] = [];
      for (let i = 0; i < mediaUris.length; i++) {
        const uri = mediaUris[i];
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          downloadUrls.push(uri);
          continue;
        }
        const extension = this.getFileExtension(uri);
        const uniqueId = push(dbRef(getDatabase())).key || `${Date.now()}_${i}`;
        const fileName = `${uniqueId}${extension}`;
        const storagePath = `spots/${spotId}/discussions/${discussionId}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        if (uri.startsWith('discussions/') || uri.startsWith('spots/') || uri.startsWith('reviews/')) {
          try {
            const url = await getDownloadURL(ref(storage, uri));
            downloadUrls.push(url);
            continue;
          } catch (err) {
            console.warn('[DiscussionRepository] Could not get download URL for storage path', uri, err);
          }
        }

        console.log('[DiscussionRepository] uploadDiscussionMedia: Uploading', uri, 'to', storagePath);
        let blob: Blob | null = null;
        try {
          const response = await fetch(uri);
          blob = await response.blob();
        } catch (fetchErr) {
          console.warn('[DiscussionRepository] uploadDiscussionMedia: fetch failed for uri', uri, fetchErr);
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
            const base64ToBytes = (b64: string) => {
              if (typeof global?.atob === 'function') {
                const binaryString = global.atob(b64);
                const len = binaryString.length;
                const bytesArr = new Uint8Array(len);
                for (let idx = 0; idx < len; idx++) {
                  bytesArr[idx] = binaryString.charCodeAt(idx);
                }
                return bytesArr;
              }
              if (typeof Buffer !== 'undefined') {
                return Uint8Array.from(Buffer.from(b64, 'base64'));
              }
              throw new Error('No base64 decode available');
            };
            const bytes = base64ToBytes(base64);
            blob = new Blob([bytes.buffer]);
          } catch (fsErr) {
            console.error('[DiscussionRepository] uploadDiscussionMedia: fallback FileSystem failed', uri, fsErr);
            throw fsErr;
          }
        }
        if (!blob) throw new Error('Failed to create blob for upload');
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        downloadUrls.push(url);
      }
      return downloadUrls;
    } catch (error) {
      console.error('[DiscussionRepository] uploadDiscussionMedia:', error);
      throw error;
    }
  }

  private async getDiscussionMediaUrls(
    spotId: string,
    discussionId: string,
    mediaPaths: string[]
  ): Promise<string[]> {
    try {
      const urls = await Promise.all(
        mediaPaths.map(async (path) => {
          if (path.startsWith('http://') || path.startsWith('https://')) return path;
          try {
            const storageRef = ref(storage, path);
            const url = await getDownloadURL(storageRef);
            return url;
          } catch (error) {
            console.warn('[DiscussionRepository] Error getting download URL for:', path, error);
            return path;
          }
        })
      );
      return urls;
    } catch (error) {
      console.error('[DiscussionRepository] getDiscussionMediaUrls error:', error);
      return mediaPaths;
    }
  }

  private async deleteMediaFiles(storagePaths: string[]): Promise<void> {
    try {
      const deletePromises = storagePaths.map(async (path) => {
        try {
          const fileRef = ref(storage, path);
          await deleteObject(fileRef);
          console.log('[DiscussionRepository] Deleted file from Storage:', path);
        } catch (error) {
          console.warn('[DiscussionRepository] Could not delete file (may not exist):', path, error);
        }
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('[DiscussionRepository] Error deleting media files:', error);
    }
  }

  private async deleteDiscussionMediaFolder(spotId: string, discussionId: string): Promise<void> {
    try {
      const folderPath = `spots/${spotId}/discussions/${discussionId}`;
      const folderRef = ref(storage, folderPath);
      const listResult = await listAll(folderRef);
      
      const deletePromises = listResult.items.map(async (itemRef) => {
        try {
          await deleteObject(itemRef);
          console.log('[DiscussionRepository] Deleted file from Storage (cleanup):', itemRef.fullPath);
        } catch (error) {
          console.warn('[DiscussionRepository] Could not delete file during cleanup:', itemRef.fullPath, error);
        }
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('[DiscussionRepository] Failed to cleanup media folder:', error);
    }
  }

  private getFileExtension(uri: string): string {
    const match = uri.match(/\.(\w+)(\?|$)/);
    if (match && match[1]) return `.${match[1]}`;
    return '.jpg';
  }

  private separateLocalAndRemoteMedia(mediaUris: string[]): { local: string[]; remote: string[] } {
    const local: string[] = [];
    const remote: string[] = [];
    for (const uri of mediaUris) {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        remote.push(uri);
      } else if (uri.startsWith('discussions/') || uri.startsWith('spots/') || uri.startsWith('reviews/')) {
        remote.push(uri);
      } else if (uri.startsWith('file://') || uri.startsWith('content://')) {
        local.push(uri);
      } else {
        local.push(uri);
      }
    }
    return { local, remote };
  }

  // ==================== VOTE METHODS ====================

  /**
   * Vota en una discussion (like o dislike)
   * Delega al voteRepository usando el path correcto
   */
  async voteDiscussion(spotId: string, discussionId: string, userId: string, isLike: boolean): Promise<void> {
    const discussionPath = `spots/${spotId}/discussions/${discussionId}`;
    return await voteRepository.vote(discussionPath, userId, isLike);
  }

  /**
   * Elimina el voto de un usuario en una discussion
   */
  async removeDiscussionVote(spotId: string, discussionId: string, userId: string): Promise<void> {
    const discussionPath = `spots/${spotId}/discussions/${discussionId}`;
    return await voteRepository.removeVote(discussionPath, userId);
  }

  /**
   * Obtiene el voto actual de un usuario en una discussion
   */
  async getDiscussionVote(spotId: string, discussionId: string, userId: string): Promise<boolean | null> {
    const discussionPath = `spots/${spotId}/discussions/${discussionId}`;
    return await voteRepository.getUserVote(discussionPath, userId);
  }
}

let discussionRepositoryInstance: DiscussionRepositoryImpl | null = null;
export const discussionRepository = (() => {
  if (!discussionRepositoryInstance) discussionRepositoryInstance = new DiscussionRepositoryImpl();
  return discussionRepositoryInstance;
})();
