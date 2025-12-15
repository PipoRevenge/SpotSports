import { buildFirestorePath, extractSourceInfoFromPath, mapFirestoreCommentToEntity } from '@/src/api/repositories/mappers/comment-mapper';
import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';
import { firestore, storage } from '@/src/lib/firebase-config';
import { ref as dbRef, getDatabase, push } from 'firebase/database';
import {
    collection,
    collectionGroup,
    doc,
    DocumentReference,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    orderBy,
    query,
    runTransaction,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
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
      const now = Timestamp.now();
      const sourcePath = this.buildSourcePath(contextId, sourceType, sourceId);
      
      // Create reference to the parent document (review or discussion) - stored in Firebase
      const sourceDocRef: DocumentReference = doc(firestore, sourcePath);

      const commentsCollectionPath = this.getCommentsCollectionPath(contextId, sourceType, sourceId);
      const collectionRef = collection(firestore, commentsCollectionPath);
      const newDocRef = doc(collectionRef);
      const commentId = newDocRef.id;

      // Upload media files to Storage if provided
      let uploadedMediaUrls: string[] = [];
      if (media && media.length > 0) {
        uploadedMediaUrls = await this.uploadCommentMedia(commentId, media);
      }

      const data = {
        userId,
        sourceRef: sourceDocRef, // Store as Firebase reference for backwards compatibility
        type: sourceType,
        parentId,
        level,
        content,
        media: uploadedMediaUrls,
        tags: tags || [],
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        reports: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };

      // Determine parent document path for updating commentsCount
      let parentDocPath: string;
      if (level === 0) {
        // Parent is the root resource (review or discussion)
        parentDocPath = sourcePath;
      } else {
        // Parent is another comment
        parentDocPath = `${commentsCollectionPath}/${parentId}`;
      }
      const parentRef = doc(firestore, parentDocPath);

      await runTransaction(firestore, async (transaction) => {
        const parentSnap = await transaction.get(parentRef);
        transaction.set(newDocRef, data);

        if (parentSnap.exists()) {
          const currentCommentsCount = parentSnap.data().commentsCount || 0;
          transaction.update(parentRef, { commentsCount: currentCommentsCount + 1 });
        }
      });

      return mapFirestoreCommentToEntity({ id: newDocRef.id, data: () => data }, contextId, sourceType, sourceId);
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
      const ref = doc(firestore, this.getCommentDocPath(contextId, sourceType, sourceId, commentId));
      const sourcePath = this.buildSourcePath(contextId, sourceType, sourceId);
      const commentsCollectionPath = this.getCommentsCollectionPath(contextId, sourceType, sourceId);

      await runTransaction(firestore, async (tr) => {
        const com = await tr.get(ref);
        if (!com.exists()) return;
        tr.update(ref, { isDeleted: true, updatedAt: Timestamp.now() });

        // Update parent commentsCount
        const commentData = com.data();
        const parentIdFromData = commentData.parentId;
        const level = commentData.level || 0;

        let parentDocPath: string;
        if (level === 0) {
          parentDocPath = sourcePath;
        } else {
          parentDocPath = `${commentsCollectionPath}/${parentIdFromData}`;
        }

        const parentRef = doc(firestore, parentDocPath);
        const parentSnap = await tr.get(parentRef);
        if (parentSnap.exists()) {
          const currentCount = parentSnap.data().commentsCount || 0;
          if (currentCount > 0) {
            tr.update(parentRef, { commentsCount: currentCount - 1 });
          }
        }
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
      const q = query(
        commentsGroupRef,
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + offset)
      );

      const snapshot = await getDocs(q);
      const all: Comment[] = [];
      snapshot.forEach((d) => {
        // Extract source info from the document path
        const { contextId, sourceType, sourceId } = extractSourceInfoFromPath(d.ref.path);
        all.push(mapFirestoreCommentToEntity(d, contextId, sourceType, sourceId));
      });

      return all.slice(offset, offset + limit);
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
