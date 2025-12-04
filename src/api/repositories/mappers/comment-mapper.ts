import { Comment } from '@/src/entities/comment/model/comment';
import { Timestamp } from 'firebase/firestore';

export function mapFirestoreCommentToEntity(doc: any): Comment {
  const data = doc.data ? doc.data() : doc;

  return {
    id: doc.id || data.id,
    userId: data.userId || data.createdBy,
    type: data.type || 'review',
    parentId: data.parentId,
    level: data.level || 0,
    content: data.content || '',
    media: data.media || [],
    tags: data.tags || [],
    likesCount: data.likesCount || 0,
    dislikesCount: data.dislikesCount || 0,
    commentsCount: data.commentsCount || 0,
    reports: data.reports || 0,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : undefined,
    isDeleted: data.isDeleted || false,
  };
}
