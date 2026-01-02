import { Discussion } from '@/src/entities/discussion/model/discussion';
import { Timestamp } from 'firebase/firestore';
import { parseTimestamp } from '../utils/firebase-parsers';

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
  createdAt: Timestamp | string; // Can be Timestamp from Firestore or ISO string from cloud functions
  updatedAt?: Timestamp | string;
  isDeleted?: boolean;
}

export function mapFirestoreDiscussionToEntity(doc: any, spotId?: string): Discussion {
  const data = doc.data ? doc.data() : doc;

  // Try to extract spotId from document path if not provided
  let resolvedSpotId = spotId;
  if (!resolvedSpotId && doc.ref?.path) {
    const pathSegments = doc.ref.path.split('/');
    if (pathSegments[0] === 'spots') {
      resolvedSpotId = pathSegments[1];
    }
  }
  // Fallback to data.spotId if still not resolved, ensure it's never undefined
  const finalSpotId: string = resolvedSpotId || data.spotId || '';

  return {
    id: doc.id || data.id,
    details: {
      spotId: finalSpotId,
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      media: data.media || [],
    },
    metadata: {
      createdAt: parseTimestamp(data.createdAt) || new Date(),
      updatedAt: parseTimestamp(data.updatedAt),
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


