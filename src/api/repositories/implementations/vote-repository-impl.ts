import { VoteResourceType } from '@/src/entities/vote/model/vote';
import { firestore } from '@/src/lib/firebase-config';
import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { IVoteRepository } from '../interfaces/i-vote-repository';

/**
 * VoteRepository implementation
 * Votes are stored as subcollection documents under each resource
 * (e.g., reviews/{reviewId}/votes/{userId}) with the document id set to the userId.
 * Each vote document contains only the following fields:
 * - isLike: boolean
 * - createdAt: timestamp
 */
export class VoteRepositoryImpl implements IVoteRepository {
  private resourcePath(resourceType: VoteResourceType, resourceId: string) {
    switch (resourceType) {
      case 'review': return `reviews/${resourceId}`;
      case 'discussion': return `discussions/${resourceId}`;
      case 'comment': return `comments/${resourceId}`;
      default: return `reviews/${resourceId}`;
    }
  }

  async vote(resourceType: VoteResourceType, resourceId: string, userId: string, isLike: boolean): Promise<void> {
    try {
      const voteRef = doc(firestore, `${this.resourcePath(resourceType, resourceId)}/votes/${userId}`);
      const resourceRef = doc(firestore, this.resourcePath(resourceType, resourceId));

      await runTransaction(firestore, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        const resourceDoc = await transaction.get(resourceRef);

        if (!resourceDoc.exists()) throw new Error('Resource not found');

        const currentLikes = resourceDoc.data().likesCount || 0;
        const currentDislikes = resourceDoc.data().dislikesCount || 0;

        if (!voteDoc.exists()) {
          // New vote — store only isLike and createdAt (doc id == userId)
          transaction.set(voteRef, { isLike, createdAt: Timestamp.now() });
          if (isLike) transaction.update(resourceRef, { likesCount: currentLikes + 1 });
          else transaction.update(resourceRef, { dislikesCount: currentDislikes + 1 });
        } else {
          const previousVote = voteDoc.data().isLike;
          if (previousVote !== isLike) {
            // Update only the stored fields: isLike (preserve createdAt)
            transaction.update(voteRef, { isLike });
            if (isLike) {
              transaction.update(resourceRef, { likesCount: currentLikes + 1, dislikesCount: Math.max(0, currentDislikes - 1) });
            } else {
              transaction.update(resourceRef, { likesCount: Math.max(0, currentLikes - 1), dislikesCount: currentDislikes + 1 });
            }
          }
          // If previousVote === isLike, no change (should use removeVote instead)
        }
      });
    } catch (error) {
      console.error('[VoteRepository] vote:', error);
      throw error;
    }
  }

  async removeVote(resourceType: VoteResourceType, resourceId: string, userId: string): Promise<void> {
    try {
      const voteRef = doc(firestore, `${this.resourcePath(resourceType, resourceId)}/votes/${userId}`);
      const resourceRef = doc(firestore, this.resourcePath(resourceType, resourceId));

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

  async getUserVote(resourceType: VoteResourceType, resourceId: string, userId: string): Promise<boolean | null> {
    try {
      const voteRef = doc(firestore, `${this.resourcePath(resourceType, resourceId)}/votes/${userId}`);
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
