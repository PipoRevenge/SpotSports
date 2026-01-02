import { firestore, functions } from '@/src/lib/firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
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
      const voteContentFn = httpsCallable(functions, 'votes_voteContent');
      await voteContentFn({ resourcePath, isLike });
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
      const removeVoteFn = httpsCallable(functions, 'votes_removeVote');
      await removeVoteFn({ resourcePath });
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
