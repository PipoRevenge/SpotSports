import { mapFirestoreCommentToEntity } from '@/src/api/repositories/mappers/comment-mapper';
import { Comment } from '@/src/entities/comment/model/comment';
import { firestore } from '@/src/lib/firebase-config';
import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, Timestamp, updateDoc, where } from 'firebase/firestore';
import { ICommentRepository } from '../interfaces/i-comment-repository';
import { voteRepository } from './vote-repository-impl';

export class CommentRepositoryImpl implements ICommentRepository {
  async getCommentsByParent(parentId: string, type: 'review'|'discussion', page: number, pageSize: number): Promise<{ comments: Comment[]; total: number }> {
    try {
      const commentsRef = collection(firestore, 'comments');

      const totalQuery = query(commentsRef, where('parentId', '==', parentId), where('type', '==', type), where('isDeleted', '==', false));
      const totalSnap = await getDocs(totalQuery);
      const total = totalSnap.size;

      // order by createdAt desc and paginate client-side for now
      const allQuery = query(commentsRef, where('parentId', '==', parentId), where('type','==', type), where('isDeleted','==', false), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(allQuery);
      const all: Comment[] = [];
      snapshot.forEach(d => all.push(mapFirestoreCommentToEntity(d)));

      const offset = (page - 1) * pageSize;
      const comments = all.slice(offset, offset + pageSize);

      return { comments, total };
    } catch (error) {
      console.error('[CommentRepository] getCommentsByParent:', error);
      throw error;
    }
  }

  async getReplies(commentId: string, page: number, pageSize: number): Promise<{ comments: Comment[]; total: number }> {
    try {
      const commentsRef = collection(firestore, 'comments');
      const totalQuery = query(commentsRef, where('parentId', '==', commentId), where('isDeleted', '==', false));
      const totalSnap = await getDocs(totalQuery);
      const total = totalSnap.size;

      const allQuery = query(commentsRef, where('parentId', '==', commentId), where('isDeleted','==', false), orderBy('createdAt','asc'));
      const snapshot = await getDocs(allQuery);
      const all: Comment[] = [];
      snapshot.forEach(d => all.push(mapFirestoreCommentToEntity(d)));
      const offset = (page - 1) * pageSize;
      const comments = all.slice(offset, offset + pageSize);

      return { comments, total };
    } catch (error) {
      console.error('[CommentRepository] getReplies:', error);
      throw error;
    }
  }

  async addComment(parentId: string, type: 'review'|'discussion', userId: string, level: number, content: string, media?: string[], tags?: string[]): Promise<Comment> {
    try {
      const now = Timestamp.now();
      const data = {
        userId,
        type,
        parentId,
        level,
        content,
        media: media || [],
        tags: tags || [],
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        reports: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      } as any;

      const collectionRef = collection(firestore, 'comments');
      const newDocRef = doc(collectionRef); // Generate a reference without creating the doc

      // Determine parent collection: if level > 0, parent is a comment; otherwise it's a discussion or review
      const parentCollectionName = level > 0 ? 'comments' : (type === 'discussion' ? 'discussions' : 'reviews');
      const parentRef = doc(firestore, `${parentCollectionName}/${parentId}`);

      // Run all operations in a single transaction with reads before writes
      await runTransaction(firestore, async (transaction) => {
        // READ PHASE: Get parent document first
        const parentSnap = await transaction.get(parentRef);
        
        // WRITE PHASE: Create the new comment
        transaction.set(newDocRef, data);
        
        // WRITE PHASE: Update parent's commentsCount if parent exists
        if (parentSnap.exists()) {
          const currentCommentsCount = parentSnap.data().commentsCount || 0;
          transaction.update(parentRef, { commentsCount: currentCommentsCount + 1 });
        }
      });

      return mapFirestoreCommentToEntity({ id: newDocRef.id, data: () => data });
    } catch (error) {
      console.error('[CommentRepository] addComment:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, updates: Partial<{ content: string; media?: string[]; tags?: string[] }>): Promise<Comment> {
    try {
      const ref = doc(firestore, `comments/${commentId}`);
      await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Comment not found');
      return mapFirestoreCommentToEntity(snap);
    } catch (error) {
      console.error('[CommentRepository] updateComment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      const ref = doc(firestore, `comments/${commentId}`);
      await runTransaction(firestore, async (tr) => {
        const com = await tr.get(ref);
        if (!com.exists()) return;
        tr.update(ref, { isDeleted: true, updatedAt: Timestamp.now() });
      });
    } catch (error) {
      console.error('[CommentRepository] deleteComment:', error);
      throw error;
    }
  }

  async voteComment(commentId: string, userId: string, isLike: boolean): Promise<void> {
    return await voteRepository.vote('comment', commentId, userId, isLike);
  }

  async removeCommentVote(commentId: string, userId: string): Promise<void> {
    return await voteRepository.removeVote('comment', commentId, userId);
  }

  async getCommentVote(commentId: string, userId: string): Promise<boolean | null> {
    return await voteRepository.getUserVote('comment', commentId, userId);
  }
  }

let commentRepositoryInstance: CommentRepositoryImpl | null = null;
export const commentRepository = (() => {
  if (!commentRepositoryInstance) commentRepositoryInstance = new CommentRepositoryImpl();
  return commentRepositoryInstance;
})();
