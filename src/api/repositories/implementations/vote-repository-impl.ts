import { firestore } from '@/src/lib/firebase-config';
import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { IVoteRepository } from '../interfaces/i-vote-repository';

/**
 * VoteRepository implementation
 * 
 * Votes are stored as subcollection documents under each resource.
 * All paths follow the subcollection structure:
 * 
 * Subcollection paths:
 * - spots/{spotId}/reviews/{reviewId}/votes/{userId}
 * - spots/{spotId}/discussions/{discussionId}/votes/{userId}
 * - spots/{spotId}/reviews/{reviewId}/comments/{commentId}/votes/{userId}
 * - spots/{spotId}/discussions/{discussionId}/comments/{commentId}/votes/{userId}
 */
export class VoteRepositoryImpl implements IVoteRepository {
  /**
   * Vota en un recurso (like o dislike)
   */
  async vote(resourcePath: string, userId: string, isLike: boolean): Promise<void> {
    try {
      const voteRef = doc(firestore, `${resourcePath}/votes/${userId}`);
      const resourceRef = doc(firestore, resourcePath);

      await runTransaction(firestore, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        const resourceDoc = await transaction.get(resourceRef);

        if (!resourceDoc.exists()) throw new Error('Resource not found');

        const currentLikes = resourceDoc.data().likesCount || 0;
        const currentDislikes = resourceDoc.data().dislikesCount || 0;

        if (!voteDoc.exists()) {
          transaction.set(voteRef, { isLike, createdAt: Timestamp.now() });
          if (isLike) transaction.update(resourceRef, { likesCount: currentLikes + 1 });
          else transaction.update(resourceRef, { dislikesCount: currentDislikes + 1 });
        } else {
          const previousVote = voteDoc.data().isLike;
          if (previousVote !== isLike) {
            transaction.update(voteRef, { isLike });
            if (isLike) {
              transaction.update(resourceRef, { likesCount: currentLikes + 1, dislikesCount: Math.max(0, currentDislikes - 1) });
            } else {
              transaction.update(resourceRef, { likesCount: Math.max(0, currentLikes - 1), dislikesCount: currentDislikes + 1 });
            }
          }
        }
      });
    } catch (error) {
      console.error('[VoteRepository] vote:', error);
      throw error;
    }
  }

  /**
   * Elimina el voto de un usuario
   */
  async removeVote(resourcePath: string, userId: string): Promise<void> {
    try {
      const voteRef = doc(firestore, `${resourcePath}/votes/${userId}`);
      const resourceRef = doc(firestore, resourcePath);

      await runTransaction(firestore, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        if (!voteDoc.exists()) return;
        const resourceDoc = await transaction.get(resourceRef);
        if (!resourceDoc.exists()) return;

        const wasLike = voteDoc.data().isLike;
        transaction.delete(voteRef);
        if (wasLike) transaction.update(resourceRef, { likesCount: Math.max(0, (resourceDoc.data().likesCount || 0) - 1) });
        else transaction.update(resourceRef, { dislikesCount: Math.max(0, (resourceDoc.data().dislikesCount || 0) - 1) });
      });
    } catch (error) {
      console.error('[VoteRepository] removeVote:', error);
      throw error;
    }
  }

  /**
   * Obtiene el voto actual de un usuario
   */
  async getUserVote(resourcePath: string, userId: string): Promise<boolean | null> {
    try {
      const voteRef = doc(firestore, `${resourcePath}/votes/${userId}`);
      const snap = await getDoc(voteRef);
      if (!snap.exists()) return null;
      return snap.data().isLike ?? null;
    } catch (error) {
      console.error('[VoteRepository] getUserVote:', error);
      return null;
    }
  }
}

let voteRepositoryInstance: VoteRepositoryImpl | null = null;
export const voteRepository = (() => {
  if (!voteRepositoryInstance) voteRepositoryInstance = new VoteRepositoryImpl();
  return voteRepositoryInstance;
})();
