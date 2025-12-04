import { createFirestoreDiscussionData, mapFirestoreDiscussionToEntity } from '@/src/api/repositories/mappers/discussion-mapper';
import { Discussion, DiscussionDetails } from '@/src/entities/discussion/model/discussion';
import { firestore, storage } from '@/src/lib/firebase-config';
import * as FileSystem from 'expo-file-system';
import { ref as dbRef, getDatabase, push } from 'firebase/database';
import { addDoc, collection, doc, limit as firestoreLimit, getDoc, getDocs, orderBy, query, runTransaction, Timestamp, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { IDiscussionRepository } from '../interfaces/i-discussion-repository';
import { voteRepository } from './vote-repository-impl';

export class DiscussionRepositoryImpl implements IDiscussionRepository {
  async createDiscussion(userId: string, discussionData: DiscussionDetails): Promise<Discussion> {
    try {
      const now = Timestamp.now();

      // Basic discussion doc (no media URLs yet to avoid race conditions)
      const discussion = {
        userId,
        spotId: discussionData.spotId || '', // Empty string for general discussions
        title: discussionData.title,
        titleLower: (discussionData.title || '').toLowerCase(),
        description: discussionData.description || '',
        tags: discussionData.tags || ['Q&A'],
        media: discussionData.media || [],
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        reports: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };

      const colRef = collection(firestore, 'discussions');

      // Avoid creating duplicate discussion title within the same spot (case-insensitive)
      // For general discussions (no spotId), check globally
      let existingQ;
      if (discussionData.spotId) {
        existingQ = query(colRef, where('spotId', '==', discussionData.spotId), where('titleLower', '==', (discussionData.title || '').toLowerCase()), where('isDeleted', '==', false), firestoreLimit(1));
      } else {
        // General discussions: check for same title where spotId is empty/null
        existingQ = query(colRef, where('spotId', '==', ''), where('titleLower', '==', (discussionData.title || '').toLowerCase()), where('isDeleted', '==', false), firestoreLimit(1));
      }
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        // Return the existing discussion to be idempotent
        const first = existingSnap.docs[0];
        return mapFirestoreDiscussionToEntity(first);
      }

      const firestoreData = createFirestoreDiscussionData(userId, discussionData.spotId || '', discussionData.title, discussionData.description, discussionData.tags, []);
      const docRef = await addDoc(colRef, firestoreData);

      // If there are local files provided in discussionData.media, upload them now and update the doc
      const mediaUris: string[] = discussionData.media || [];
      if (mediaUris.length > 0) {
        const { local, remote } = this.separateLocalAndRemoteMedia(mediaUris);
        if (local.length > 0) {
          try {
            const uploaded = await this.uploadDiscussionMedia(discussionData.spotId || '', docRef.id, local);
            const finalMedia = [...remote, ...uploaded];
            // Update doc with final media URLs/paths
            await updateDoc(doc(firestore, `discussions/${docRef.id}`), { media: finalMedia, updatedAt: Timestamp.now() } as any);
            return mapFirestoreDiscussionToEntity({ id: docRef.id, data: () => ({ ...discussion, media: finalMedia }) });
          } catch (uploadErr) {
            console.error('[DiscussionRepository] createDiscussion: media upload failed', uploadErr);
            // If upload fails, delete created doc to avoid inconsistent state
            await updateDoc(doc(firestore, `discussions/${docRef.id}`), { media: [], updatedAt: Timestamp.now() } as any);
            // Propagate a helpful error
            throw new Error('Failed to upload discussion media. Please try again.');
          }
        }
        // No local files to upload, just return created doc with existing media
        return mapFirestoreDiscussionToEntity({ id: docRef.id, data: () => ({ ...discussion, media: remote }) });
      }

      return mapFirestoreDiscussionToEntity({ id: docRef.id, data: () => discussion });
    } catch (error) {
      console.error('[DiscussionRepository] createDiscussion:', error);
      throw error;
    }
  }

  async getDiscussionById(discussionId: string): Promise<Discussion | null> {
    try {
      const docRef = doc(firestore, `discussions/${discussionId}`);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const data = snap.data() as any;
      let mediaUrls: string[] = [];
      if (data.media && data.media.length > 0) {
        mediaUrls = await this.getDiscussionMediaUrls(data.spotId, discussionId, data.media);
      }
      const docWithUrls = { id: snap.id, data: () => ({ ...data, media: mediaUrls }) } as any;
      return mapFirestoreDiscussionToEntity(docWithUrls);
    } catch (error) {
      console.error('[DiscussionRepository] getDiscussionById:', error);
      throw error;
    }
  }

  async getDiscussions(options: { page: number; pageSize: number; sort?: 'newest'|'mostVoted'; tag?: string; search?: string; spotId?: string }): Promise<{ discussions: Discussion[]; total: number }> {
    try {
      const colRef = collection(firestore, 'discussions');
      let q = query(colRef, where('isDeleted', '==', false));
      if (options.spotId) q = query(q, where('spotId', '==', options.spotId));
      if (options.tag) q = query(q, where('tags', 'array-contains', options.tag));
      if (options.search) {
        const lower = options.search.toLowerCase();
        q = query(q, where('titleLower', '>=', lower));
      }

      if (!options.sort || options.sort === 'newest') q = query(q, orderBy('createdAt','desc'));
      if (options.sort === 'mostVoted') q = query(q, orderBy('likesCount','desc'));

      const snap = await getDocs(q);
      const total = snap.size;
      const result: Discussion[] = [];
      for (const d of snap.docs) {
        const data = d.data() as any;
        let mediaUrls: string[] = [];
        if (data.media && data.media.length > 0) {
          mediaUrls = await this.getDiscussionMediaUrls(data.spotId, d.id, data.media);
        }
        result.push(mapFirestoreDiscussionToEntity({ id: d.id, data: () => ({ ...data, media: mediaUrls }) } as any));
      }
      const offset = (options.page - 1) * options.pageSize;
      const pageDiscussions = result.slice(offset, offset + options.pageSize);

      return { discussions: pageDiscussions, total };
    } catch (error) {
      console.error('[DiscussionRepository] getDiscussions:', error);
      throw error;
    }
  }

  async updateDiscussion(discussionId: string, updates: Partial<DiscussionDetails>): Promise<Discussion> {
    try {
      console.log('[DiscussionRepository] updateDiscussion:', discussionId, updates);

      const discussionRef = doc(firestore, `discussions/${discussionId}`);
      const existingSnap = await getDoc(discussionRef);
      if (!existingSnap.exists()) throw new Error('Discussion not found');
      const existingData = existingSnap.data() as any;

      let finalMedia: string[] = existingData.media || [];

      if (updates.media) {
        const { local, remote } = this.separateLocalAndRemoteMedia(updates.media);

        // Compute URLs to delete (those previously present but not in remote set)
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
          console.log('[DiscussionRepository] Removing media from storage:', urlsToDelete);
          await this.deleteMediaFiles(urlsToDelete);
        }

        // Upload local files
        let uploaded: string[] = [];
        if (local.length > 0) {
          uploaded = await this.uploadDiscussionMedia(existingData.spotId, discussionId, local);
        }

        finalMedia = [...remote, ...uploaded];
      }

      const updatesWithTimestamp = { ...updates, media: finalMedia, updatedAt: Timestamp.now() } as any;
      if (updates.title) {
        updatesWithTimestamp.titleLower = (updates.title || '').toLowerCase();
      }
      await updateDoc(discussionRef, updatesWithTimestamp);

      const finalSnap = await getDoc(discussionRef);
      if (!finalSnap.exists()) throw new Error('Discussion not found after update');
      return mapFirestoreDiscussionToEntity(finalSnap);
    } catch (error) {
      console.error('[DiscussionRepository] updateDiscussion:', error);
      throw error;
    }
  }

  async deleteDiscussion(discussionId: string): Promise<void> {
    try {
      const discussionRef = doc(firestore, `discussions/${discussionId}`);
      await runTransaction(firestore, async (tr) => {
        const f = await tr.get(discussionRef);
        if (!f.exists()) return;
        tr.update(discussionRef, { isDeleted: true, updatedAt: Timestamp.now() });
      });
    } catch (error) {
      console.error('[DiscussionRepository] deleteDiscussion:', error);
      throw error;
    }
  }

  async voteDiscussion(discussionId: string, userId: string, isLike: boolean): Promise<void> {
    return await voteRepository.vote('discussion', discussionId, userId, isLike);
  }

  async removeDiscussionVote(discussionId: string, userId: string): Promise<void> {
    return await voteRepository.removeVote('discussion', discussionId, userId);
  }

  async getUserVoteDiscussion(discussionId: string, userId: string): Promise<boolean | null> {
    return await voteRepository.getUserVote('discussion', discussionId, userId);
  }

  // uploads media to Storage / discussions/{discussionId}/
  async uploadDiscussionMedia(spotId: string, discussionId: string, mediaUris: string[]): Promise<string[]> {
    try {
      if (!mediaUris || mediaUris.length === 0) return [];
      console.log('[DiscussionRepository] Upload diagnostics:', { spotId, discussionId, fileCount: mediaUris.length, storageBucket: storage.app.options.storageBucket });
      const downloadUrls: string[] = [];
      for (let i = 0; i < mediaUris.length; i++) {
        const uri = mediaUris[i];
        // If it's already a remote URL (http/https) just include as-is
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          downloadUrls.push(uri);
          continue;
        }
        const extension = this.getFileExtension(uri);
        const uniqueId = push(dbRef(getDatabase())).key || `${Date.now()}_${i}`;
        const fileName = `${uniqueId}${extension}`;
        const storagePath = `discussions/${discussionId}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        // If it's a storage path (already in storage) convert to download URL
        if (uri.startsWith('discussions/') || uri.startsWith('spots/') || uri.startsWith('reviews/')) {
          try {
            const url = await getDownloadURL(ref(storage, uri));
            downloadUrls.push(url);
            continue;
          } catch (err) {
            console.warn('[DiscussionRepository] Could not get download URL for storage path', uri, err);
            // fall through to attempt upload (may fail)
          }
        }

        // upload if local URI
        console.log('[DiscussionRepository] uploadDiscussionMedia: Uploading', uri, 'to', storagePath);
        console.log('[DiscussionRepository] file type check:', { isLocal: uri.startsWith('file://') || uri.startsWith('content://'), isHttp: uri.startsWith('http') });
        let blob: Blob | null = null;
        try {
          const response = await fetch(uri);
          blob = await response.blob();
        } catch (fetchErr) {
          console.warn('[DiscussionRepository] uploadDiscussionMedia: fetch failed for uri', uri, fetchErr);
          // fallback: read with FileSystem as base64 and convert to blob
          try {
              const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
            // Convert base64 to Uint8Array using a safe helper
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
            console.error('[DiscussionRepository] uploadDiscussionMedia: fallback FileSystem failed for uri', uri, fsErr);
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

  /**
   * Convierte rutas de Storage a URLs completas
   */
  private async getDiscussionMediaUrls(spotId: string, discussionId: string, mediaPaths: string[]): Promise<string[]> {
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

  /**
   * Deletes files from storage given storage paths (or URL paths)
   */
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
      // Do not throw - deletion failure should not block other steps
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
        // Storage paths are considered remote as they have already been uploaded
        remote.push(uri);
      } else if (uri.startsWith('file://') || uri.startsWith('content://')) {
        local.push(uri);
      } else {
        // Unknown format - treat as local (most app-local URIs are file://)
        local.push(uri);
      }
    }
    console.log('[DiscussionRepository] separateLocalAndRemoteMedia:', { total: mediaUris.length, localCount: local.length, remoteCount: remote.length });
    return { local, remote };
  }
}

let discussionRepositoryInstance: DiscussionRepositoryImpl | null = null;
export const discussionRepository = (() => {
  if (!discussionRepositoryInstance) discussionRepositoryInstance = new DiscussionRepositoryImpl();
  return discussionRepositoryInstance;
})();
