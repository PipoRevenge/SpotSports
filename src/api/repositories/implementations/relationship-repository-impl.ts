import { User } from '@/src/entities/user/model/user';
import { firestore } from '@/src/lib/firebase-config';
import {
    collection,
    doc,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    runTransaction,
    Timestamp,
    where
} from 'firebase/firestore';
import { IRelationshipRepository } from '../interfaces/i-relationship-repository';
import { UserFirebase, UserMapper } from '../mappers/user-mapper';

/**
 * Relationship repository implementation using Firestore.
 * - Collection: relationships
 * - Document ID determinista: `${followerId}_${followedId}`
 */
export class RelationshipRepositoryImpl implements IRelationshipRepository {
  private readonly RELATIONSHIPS_COLLECTION = 'relationships';
  private readonly USERS_COLLECTION = 'users';

  async followUser(followerId: string, followedId: string): Promise<void> {
    const docId = `${followerId}_${followedId}`;
    const relRef = doc(firestore, this.RELATIONSHIPS_COLLECTION, docId);
    const followerRef = doc(firestore, this.USERS_COLLECTION, followerId);
    const followedRef = doc(firestore, this.USERS_COLLECTION, followedId);

    await runTransaction(firestore, async (transaction) => {
      const relDoc = await transaction.get(relRef);
      if (relDoc.exists()) {
        // already following
        return;
      }

      transaction.set(relRef, {
        follower: followerId,
        followed: followedId,
        createdAt: Timestamp.now()
      });

      // Update counters
      transaction.update(followedRef, { followersCount: increment(1), updatedAt: Timestamp.now() });
      transaction.update(followerRef, { followingCount: increment(1), updatedAt: Timestamp.now() });
    });
  }

  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    const docId = `${followerId}_${followedId}`;
    const relRef = doc(firestore, this.RELATIONSHIPS_COLLECTION, docId);
    const followerRef = doc(firestore, this.USERS_COLLECTION, followerId);
    const followedRef = doc(firestore, this.USERS_COLLECTION, followedId);

    await runTransaction(firestore, async (transaction) => {
      const relDoc = await transaction.get(relRef);
      if (!relDoc.exists()) {
        // Nothing to do
        return;
      }

      transaction.delete(relRef);
      // Decrement counters
      transaction.update(followedRef, { followersCount: increment(-1), updatedAt: Timestamp.now() });
      transaction.update(followerRef, { followingCount: increment(-1), updatedAt: Timestamp.now() });
    });
  }

  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const docId = `${followerId}_${followedId}`;
    const relRef = doc(firestore, this.RELATIONSHIPS_COLLECTION, docId);
    const relDoc = await getDoc(relRef);
    return relDoc.exists();
  }

  private async batchGetUsersByIds(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) return [];
    const MAX_IN_CLAUSE = 10; // Firestore IN operator supports up to 10
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += MAX_IN_CLAUSE) {
      chunks.push(ids.slice(i, i + MAX_IN_CLAUSE));
    }

    const results: User[] = [];
    for (const chunk of chunks) {
      const q = query(collection(firestore, this.USERS_COLLECTION), where('__name__', 'in', chunk));
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as UserFirebase;
        results.push(UserMapper.fromFirebase(data, docSnap.id));
      });
    }
    return results;
  }

  async getFollowers(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }> {
    const limit = options?.limit || 20;
    // Query relationships where followed == userId
    let q = query(
      collection(firestore, this.RELATIONSHIPS_COLLECTION),
      where('followed', '==', userId),
      orderBy('createdAt', 'desc')
    );
    if (options?.startAfter) {
      q = query(
        collection(firestore, this.RELATIONSHIPS_COLLECTION),
        where('followed', '==', userId),
        where('createdAt', '<', options.startAfter),
        orderBy('createdAt', 'desc')
      );
    }
    q = query(q as any, firestoreLimit(limit));
    const snapshot = await getDocs(q);
    const followerIds: string[] = snapshot.docs.map(d => d.data().follower);
    const users = await this.batchGetUsersByIds(followerIds);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.data().createdAt;
    return { items: users, lastVisible };
  }

  async getFollowing(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: User[]; lastVisible?: any }> {
    const limit = options?.limit || 20;
    let q = query(
      collection(firestore, this.RELATIONSHIPS_COLLECTION),
      where('follower', '==', userId),
      orderBy('createdAt', 'desc')
    );
    if (options?.startAfter) {
      q = query(
        collection(firestore, this.RELATIONSHIPS_COLLECTION),
        where('follower', '==', userId),
        where('createdAt', '<', options.startAfter),
        orderBy('createdAt', 'desc')
      );
    }
    q = query(q as any, firestoreLimit(limit));
    const snapshot = await getDocs(q);
    const followedIds: string[] = snapshot.docs.map(d => d.data().followed);
    const users = await this.batchGetUsersByIds(followedIds);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.data().createdAt;
    return { items: users, lastVisible };
  }
}
