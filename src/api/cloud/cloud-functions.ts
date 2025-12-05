/**
 * Cloud Functions Stubs
 *
 * These functions are designed to be moved to Firebase Cloud Functions.
 * For now, they can be called client-side as part of delete operations.
 *
 * In production, these should be Cloud Functions triggered by Firestore events:
 * - onDelete triggers for reviews, discussions, and comments
 *
 * Usage example (future Cloud Function):
 * exports.onReviewDelete = functions.firestore
 *   .document('spots/{spotId}/reviews/{reviewId}')
 *   .onDelete(async (snap, context) => {
 *     await onReviewDeleteCascade(context.params.spotId, context.params.reviewId);
 *   });
 */

import { firestore } from '@/src/lib/firebase-config';
import {
    collection,
    doc,
    getDocs,
    Timestamp,
    updateDoc,
    writeBatch
} from 'firebase/firestore';

/**
 * Called when a review is deleted - cascades to delete all comments under it
 * Future: Firebase Cloud Function trigger on spots/{spotId}/reviews/{reviewId} delete
 */
export async function onReviewDeleteCascade(spotId: string, reviewId: string): Promise<void> {
  try {
    const commentsRef = collection(firestore, `spots/${spotId}/reviews/${reviewId}/comments`);
    const commentsSnapshot = await getDocs(commentsRef);

    if (!commentsSnapshot.empty) {
      console.log(`[CloudFunctions] Cascade deleting ${commentsSnapshot.size} comments for review ${reviewId}`);
      const batch = writeBatch(firestore);

      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });

      await batch.commit();
      console.log('[CloudFunctions] Review comments deleted successfully');
    }
  } catch (error) {
    console.error('[CloudFunctions] onReviewDeleteCascade error:', error);
    throw error;
  }
}

/**
 * Called when a discussion is deleted - cascades to delete all comments under it
 * Future: Firebase Cloud Function trigger on spots/{spotId}/discussions/{discussionId} delete
 */
export async function onDiscussionDeleteCascade(spotId: string, discussionId: string): Promise<void> {
  try {
    const commentsRef = collection(firestore, `spots/${spotId}/discussions/${discussionId}/comments`);
    const commentsSnapshot = await getDocs(commentsRef);

    if (!commentsSnapshot.empty) {
      console.log(`[CloudFunctions] Cascade deleting ${commentsSnapshot.size} comments for discussion ${discussionId}`);
      const batch = writeBatch(firestore);

      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });

      await batch.commit();
      console.log('[CloudFunctions] Discussion comments deleted successfully');
    }
  } catch (error) {
    console.error('[CloudFunctions] onDiscussionDeleteCascade error:', error);
    throw error;
  }
}

/**
 * Called when a comment is deleted - updates parent commentsCount
 * Future: Firebase Cloud Function trigger on comments delete
 *
 * @param spotId - The spot ID
 * @param parentType - 'review' or 'discussion' (type of root parent)
 * @param parentId - The direct parent ID (could be review/discussion ID or another commentId)
 * @param commentLevel - The level of the deleted comment (0 = direct child, 1+ = nested)
 */
export async function onCommentDeleteUpdateParent(
  spotId: string,
  parentType: 'review' | 'discussion',
  parentId: string,
  commentLevel: number
): Promise<void> {
  try {
    let parentRef;

    if (commentLevel === 0) {
      // Direct child of review/discussion
      const parentCollection = parentType === 'review' ? 'reviews' : 'discussions';
      parentRef = doc(firestore, `spots/${spotId}/${parentCollection}/${parentId}`);
    } else {
      // Nested comment - parentId is another comment's ID
      // Need to find the root review/discussion and get the comment path
      // For simplicity, we'll use a two-step approach or require rootParentId
      console.warn('[CloudFunctions] Nested comment parent update requires additional context');
      return;
    }

    // Decrement commentsCount on parent
    // Note: In a real Cloud Function, you'd use increment(-1)
    // For client-side, we do a read-then-write
    const { getDoc } = await import('firebase/firestore');
    const parentSnap = await getDoc(parentRef);

    if (parentSnap.exists()) {
      const currentCount = parentSnap.data().commentsCount || 0;
      if (currentCount > 0) {
        await updateDoc(parentRef, {
          commentsCount: currentCount - 1,
          updatedAt: Timestamp.now(),
        });
        console.log('[CloudFunctions] Updated parent commentsCount');
      }
    }
  } catch (error) {
    console.error('[CloudFunctions] onCommentDeleteUpdateParent error:', error);
    // Don't throw - counter updates shouldn't block other operations
  }
}

/**
 * Helper to batch delete all votes for a resource
 * Called when deleting reviews, discussions, or comments
 */
export async function deleteVotesForResource(resourcePath: string): Promise<void> {
  try {
    const votesRef = collection(firestore, `${resourcePath}/votes`);
    const votesSnapshot = await getDocs(votesRef);

    if (!votesSnapshot.empty) {
      console.log(`[CloudFunctions] Deleting ${votesSnapshot.size} votes for ${resourcePath}`);
      const batch = writeBatch(firestore);

      votesSnapshot.docs.forEach((voteDoc) => {
        batch.delete(voteDoc.ref);
      });

      await batch.commit();
    }
  } catch (error) {
    console.error('[CloudFunctions] deleteVotesForResource error:', error);
    // Don't throw - vote deletion shouldn't block parent deletion
  }
}
