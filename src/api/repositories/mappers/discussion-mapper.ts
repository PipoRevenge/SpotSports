import { Discussion } from '@/src/entities/discussion/model/discussion';
import { Timestamp } from 'firebase/firestore';

export interface FirestoreDiscussionData {
  spotId?: string; // Empty string or undefined for general discussions
  userId: string;
  title: string;
  titleLower: string;
  description?: string;
  tags?: string[];
  media?: string[];
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  reports: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isDeleted?: boolean;
}

export function mapFirestoreDiscussionToEntity(doc: any): Discussion {
  const data = doc.data ? doc.data() : doc;

  return {
    id: doc.id || data.id,
    details: {
      spotId: data.spotId || undefined, // Convert empty string to undefined
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      media: data.media || [],
    },
    metadata: {
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : undefined,
      isDeleted: data.isDeleted || false,
      createdBy: data.userId || data.createdBy,
    },
    activity: {
      likesCount: data.likesCount || 0,
      dislikesCount: data.dislikesCount || 0,
      commentsCount: data.commentsCount || 0,
      reports: data.reports || 0,
    }
  };
}

export const createFirestoreDiscussionData = (
  userId: string,
  spotId: string,
  title: string,
  description?: string,
  tags?: string[],
  media?: string[]
): FirestoreDiscussionData => {
  const now = Timestamp.now();
  return {
    userId,
    spotId,
    title,
    titleLower: (title || '').toLowerCase(),
    description: description || '',
    tags: tags || ['Q&A'],
    media: media || [],
    likesCount: 0,
    dislikesCount: 0,
    commentsCount: 0,
    reports: 0,
    createdAt: now,
    isDeleted: false,
  } as FirestoreDiscussionData;
};
