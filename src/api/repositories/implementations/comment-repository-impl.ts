import { buildFirestorePath, extractSourceInfoFromPath, mapFirestoreCommentToEntity } from '@/src/api/repositories/mappers/comment-mapper';
import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';
import { firestore, functions, storage } from '@/src/lib/firebase-config';
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
    updateDoc,
    where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ICommentRepository } from '../interfaces/i-comment-repository';
import { voteRepository } from './vote-repository-impl';

/**
 * CommentRepositoryImpl - Comments as subcollections
 *
 * Internally uses Firestore paths to locate comments:
 * - spots/{contextId}/reviews/{reviewId}/comments/{commentId}
 * - spots/{contextId}/discussions/{discussionId}/comments/{commentId}
 *
 * Uses collectionGroup('comments') for cross-resource user queries.
 */
export class CommentRepositoryImpl implements ICommentRepository {
  /**
   * Build Firestore path from abstract identifiers (internal use only)
   */
  private buildSourcePath(contextId: string, sourceType: CommentSourceType, sourceId: string): string {
    return buildFirestorePath(contextId, sourceType, sourceId);
  }

  /**
   * Get the comments collection path
   */
  private getCommentsCollectionPath(contextId: string, sourceType: CommentSourceType, sourceId: string): string {
    return `${this.buildSourcePath(contextId, sourceType, sourceId)}/comments`;
  }

  /**
   * Get a specific comment document path
   */
  private getCommentDocPath(contextId: string, sourceType: CommentSourceType, sourceId: string, commentId: string): string {
    return `${this.buildSourcePath(contextId, sourceType, sourceId)}/comments/${commentId}`;
  }

  /**
   * Get file extension from URI
   */
  private getFileExtension(uri: string): string {
    const match = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (match) return `.${match[1].toLowerCase()}`;
    // Default to jpg for images
    return '.jpg';
  }

  /**
   * Check if a URI is a local file (needs upload)
   */
  private isLocalUri(uri: string): boolean {
    return uri.startsWith('file://') || uri.startsWith('content://');
  }

  /**
   * Upload media files to Firebase Storage for a comment
   * @param commentId - ID of the comment
   * @param mediaUris - Array of local URIs to upload
   * @returns Array of download URLs
   */
  private async uploadCommentMedia(commentId: string, mediaUris: string[]): Promise<string[]> {
    if (!mediaUris || mediaUris.length === 0) return [];

    console.log(`[CommentRepository] Uploading ${mediaUris.length} files for comment ${commentId}`);

    const downloadUrls: string[] = [];

    for (let i = 0; i < mediaUris.length; i++) {
      const mediaUri = mediaUris[i];

      // If already a URL (not local file), keep it as-is
      if (!this.isLocalUri(mediaUri)) {
        console.log(`[CommentRepository] Skipping non-local URI: ${mediaUri}`);
        downloadUrls.push(mediaUri);
        continue;
      }

      console.log(`[CommentRepository] Processing file ${i + 1}/${mediaUris.length}:`, {
        uri: mediaUri,
      });

      // Get file extension
      const extension = this.getFileExtension(mediaUri);

      // Generate unique ID
      const uniqueId = push(dbRef(getDatabase())).key || `${Date.now()}_${i}`;

      // Create file name and storage path: comments/{commentId}/{uniqueId}.ext
      const fileName = `${uniqueId}${extension}`;
      const storagePath = `comments/${commentId}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      try {
        // Fetch file from local URI
        console.log('[CommentRepository] Fetching file from URI...');
        const response = await fetch(mediaUri);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();

        if (!blob || blob.size === 0) {
          throw new Error('Empty file blob');
        }

        console.log(`[CommentRepository] Uploading ${blob.size} bytes to: ${storagePath}`);

        // Upload to Storage
        await uploadBytes(storageRef, blob);

        console.log(`[CommentRepository] ✓ Successfully uploaded file ${i + 1}/${mediaUris.length}`);

        // Get download URL
        const downloadUrl = await getDownloadURL(storageRef);
        downloadUrls.push(downloadUrl);
        console.log(`[CommentRepository] File uploaded. URL: ${downloadUrl}`);
      } catch (fileError) {
        console.error(`[CommentRepository] ✗ Error uploading file ${i}:`, {
          uri: mediaUri,
          storagePath,
          error: fileError,
        });

        let errorMessage = `Failed to upload file ${i + 1}`;
        if (fileError instanceof Error) {
          if (fileError.message.includes('Network request failed')) {
            errorMessage += ': Firebase Storage emulator may not be running';
          } else {
            errorMessage += `: ${fileError.message}`;
          }
        }
        throw new Error(errorMessage);
      }
    }

    console.log(`[CommentRepository] ✓ All ${downloadUrls.length} files uploaded successfully`);
    return downloadUrls;
  }

  async getCommentsByParent(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    page: number,
    pageSize: number
  ): Promise<{ comments: Comment[]; total: number }> {
    try {
      const commentsRef = collection(firestore, this.getCommentsCollectionPath(contextId, sourceType, sourceId));

      // Get top-level comments (level 0)
      const totalQuery = query(
        commentsRef,
        where('level', '==', 0),
        where('isDeleted', '==', false)
      );
      const totalSnap = await getDocs(totalQuery);
      const total = totalSnap.size;

      const allQuery = query(
        commentsRef,
        where('level', '==', 0),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(allQuery);
      const all: Comment[] = [];
      snapshot.forEach((d) => all.push(mapFirestoreCommentToEntity(d, contextId, sourceType, sourceId)));

      const offset = (page - 1) * pageSize;
      const comments = all.slice(offset, offset + pageSize);

      return { comments, total };
    } catch (error) {
      console.error('[CommentRepository] getCommentsByParent:', error);
      throw error;
    }
  }

  async getReplies(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    page: number,
    pageSize: number
  ): Promise<{ comments: Comment[]; total: number }> {
    try {
      const commentsRef = collection(firestore, this.getCommentsCollectionPath(contextId, sourceType, sourceId));

      const totalQuery = query(
        commentsRef,
        where('parentId', '==', commentId),
        where('isDeleted', '==', false)
      );
      const totalSnap = await getDocs(totalQuery);
      const total = totalSnap.size;

      const allQuery = query(
        commentsRef,
        where('parentId', '==', commentId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(allQuery);
      const all: Comment[] = [];
      snapshot.forEach((d) => all.push(mapFirestoreCommentToEntity(d, contextId, sourceType, sourceId)));

      const offset = (page - 1) * pageSize;
      const comments = all.slice(offset, offset + pageSize);

      return { comments, total };
    } catch (error) {
      console.error('[CommentRepository] getReplies:', error);
      throw error;
    }
  }

  async getCommentById(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string
  ): Promise<Comment | null> {
    try {
      const ref = doc(firestore, this.getCommentDocPath(contextId, sourceType, sourceId, commentId));
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return mapFirestoreCommentToEntity(snap, contextId, sourceType, sourceId);
    } catch (error) {
      console.error('[CommentRepository] getCommentById:', error);
      return null;
    }
  }

  async addComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    parentId: string,
    userId: string,
    level: number,
    content: string,
    media?: string[],
    tags?: string[]
  ): Promise<Comment> {
    try {
      // Create a temporary comment ID for media uploads
      const tempCommentId = push(dbRef(getDatabase())).key || `${Date.now()}`;
      
      // Upload media files to Storage if provided
      let uploadedMediaUrls: string[] = [];
      if (media && media.length > 0) {
        uploadedMediaUrls = await this.uploadCommentMedia(tempCommentId, media);
      }

      // Call cloud function
      const createCommentFn = httpsCallable(functions, 'comments_create');
      const result = await createCommentFn({
        spotId: contextId,
        sourceType,
        sourceId,
        parentId,
        level,
        content,
        mediaUrls: uploadedMediaUrls,
        tags: tags || [],
      });

      const { commentId, comment } = result.data as { commentId: string; comment: any };

      // Map the response to entity
      return mapFirestoreCommentToEntity(
        { id: commentId, data: () => comment },
        contextId,
        sourceType,
        sourceId
      );
    } catch (error) {
      console.error('[CommentRepository] addComment:', error);
      throw error;
    }
  }

  async updateComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    updates: Partial<{ content: string; media?: string[]; tags?: string[] }>
  ): Promise<Comment> {
    try {
      const ref = doc(firestore, this.getCommentDocPath(contextId, sourceType, sourceId, commentId));
      await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Comment not found');
      return mapFirestoreCommentToEntity(snap, contextId, sourceType, sourceId);
    } catch (error) {
      console.error('[CommentRepository] updateComment:', error);
      throw error;
    }
  }

  async deleteComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string
  ): Promise<void> {
    try {
      const deleteCommentFn = httpsCallable(functions, 'comments_delete');
      await deleteCommentFn({
        spotId: contextId,
        sourceType,
        sourceId,
        commentId,
      });
    } catch (error) {
      console.error('[CommentRepository] deleteComment:', error);
      throw error;
    }
  }

  async getCommentsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Comment[]> {
    try {
      const commentsGroupRef = collectionGroup(firestore, 'comments');

      const q1 = query(
        commentsGroupRef,
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );
      const q2 = query(
        commentsGroupRef,
        where('createdBy', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const docMap = new Map<string, any>();
      for (const d of snap1.docs) if (!docMap.has(d.id)) docMap.set(d.id, d);
      for (const d of snap2.docs) if (!docMap.has(d.id)) docMap.set(d.id, d);

      const all: Comment[] = [];
      for (const d of Array.from(docMap.values()).slice(offset, offset + limit)) {
        // Extract source info from the document path
        const { contextId, sourceType, sourceId } = extractSourceInfoFromPath(d.ref.path);
        all.push(mapFirestoreCommentToEntity(d, contextId, sourceType, sourceId));
      }

      return all;
    } catch (error) {
      console.error('[CommentRepository] getCommentsByUser:', error);
      throw error;
    }
  }

  /**
   * Vote on a comment
   */
  async voteComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    userId: string,
    isLike: boolean
  ): Promise<void> {
    const resourcePath = this.getCommentDocPath(contextId, sourceType, sourceId, commentId);
    return voteRepository.vote(resourcePath, userId, isLike);
  }

  /**
   * Remove a vote from a comment
   */
  async removeCommentVote(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const resourcePath = this.getCommentDocPath(contextId, sourceType, sourceId, commentId);
    return voteRepository.removeVote(resourcePath, userId);
  }

  /**
   * Get user's vote on a comment
   */
  async getCommentVote(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    userId: string
  ): Promise<boolean | null> {
    const resourcePath = this.getCommentDocPath(contextId, sourceType, sourceId, commentId);
    return voteRepository.getUserVote(resourcePath, userId);
  }
}

let commentRepositoryInstance: CommentRepositoryImpl | null = null;
export const commentRepository = (() => {
  if (!commentRepositoryInstance) commentRepositoryInstance = new CommentRepositoryImpl();
  return commentRepositoryInstance;
})();
