import { Vote } from '@/src/entities/vote/model/vote';
import { Timestamp } from 'firebase/firestore';

export function mapFirestoreVoteToEntity(doc: any): Vote {
  const data = doc.data ? doc.data() : doc;

  // Infer resourceType/resourceId/userId from the document reference if not present in data
  let resourceType = data.resourceType;
  let resourceId = data.resourceId;
  let userId = data.userId || doc.id;

  try {
    // doc.ref available when passed a DocumentSnapshot
    const docRef = (doc.ref) ? doc.ref : null;
    if (docRef && docRef.parent && docRef.parent.parent) {
      const parentDoc = docRef.parent.parent; // the resource doc reference
      resourceId = resourceId || parentDoc.id;
      const parentCollection = parentDoc.parent; // collection of the resource (reviews, discussions, comments)
      resourceType = resourceType || (parentCollection ? (parentCollection.id as any) : undefined);
    }
  } catch (e) {
    // ignore
  }

  return {
    id: doc.id || data.id,
    resourceType: resourceType as any,
    resourceId: resourceId,
    userId: userId,
    isLike: data.isLike,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    // updatedAt not stored on vote documents anymore
    updatedAt: undefined,
  };
}
