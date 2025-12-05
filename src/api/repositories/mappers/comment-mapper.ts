import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';
import { DocumentReference, Timestamp } from 'firebase/firestore';

/**
 * Parse a Firestore path to extract contextId, sourceType, and sourceId
 * Path format: spots/{contextId}/reviews/{reviewId} or spots/{contextId}/discussions/{discussionId}
 */
export function parseSourcePath(path: string): { contextId: string; sourceType: CommentSourceType; sourceId: string } {
  const parts = path.split('/');
  // Expected: ['spots', contextId, 'reviews'|'discussions', sourceId, ...]
  const contextId = parts[1] || '';
  const collectionType = parts[2] || '';
  const sourceId = parts[3] || '';
  
  let sourceType: CommentSourceType = 'review';
  if (collectionType === 'discussions') {
    sourceType = 'discussion';
  }
  
  return { contextId, sourceType, sourceId };
}

/**
 * Build a Firestore path from contextId, sourceType, and sourceId
 */
export function buildFirestorePath(contextId: string, sourceType: CommentSourceType, sourceId: string): string {
  const collection = sourceType === 'review' ? 'reviews' : 'discussions';
  return `spots/${contextId}/${collection}/${sourceId}`;
}

/**
 * Map Firestore comment document to Comment entity
 * @param doc - Firestore document snapshot or data object
 * @param contextId - ID of the context (e.g., spotId). If empty, will be extracted from sourceRef
 * @param sourceType - Type of parent resource (review or discussion)
 * @param sourceId - ID of the parent resource. If empty, will be extracted from sourceRef
 */
export function mapFirestoreCommentToEntity(
  doc: any, 
  contextId: string = '', 
  sourceType: CommentSourceType = 'review', 
  sourceId: string = ''
): Comment {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;

  // Extract IDs from sourceRef if stored in Firestore (for backwards compatibility or loose queries)
  let resolvedContextId = contextId;
  let resolvedSourceType: CommentSourceType = sourceType;
  let resolvedSourceId = sourceId;
  
  if (data.sourceRef) {
    let path: string = '';
    if (data.sourceRef instanceof DocumentReference) {
      path = data.sourceRef.path;
    } else if (typeof data.sourceRef === 'string') {
      path = data.sourceRef;
    } else if (data.sourceRef.path) {
      path = data.sourceRef.path;
    }
    
    if (path) {
      const parsed = parseSourcePath(path);
      // Use parsed values if not provided or empty
      resolvedContextId = contextId || parsed.contextId;
      resolvedSourceType = sourceType || parsed.sourceType;
      resolvedSourceId = sourceId || parsed.sourceId;
    }
  }

  return {
    id,
    userId: data.userId || data.createdBy,
    contextId: resolvedContextId,
    sourceId: resolvedSourceId,
    sourceType: resolvedSourceType,
    parentId: data.parentId,
    level: data.level ?? 0,
    content: data.content || '',
    media: data.media || [],
    tags: data.tags || [],
    likesCount: data.likesCount ?? 0,
    dislikesCount: data.dislikesCount ?? 0,
    commentsCount: data.commentsCount ?? 0,
    reports: data.reports ?? 0,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt || Date.now()),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : data.updatedAt ? new Date(data.updatedAt) : undefined,
    isDeleted: data.isDeleted ?? false,
  };
}

/**
 * Extract contextId, sourceType, and sourceId from a Firestore document path
 * Path format: spots/{contextId}/reviews/{reviewId}/comments/{commentId}
 * Returns: { contextId, sourceType, sourceId }
 */
export function extractSourceInfoFromPath(docPath: string): { contextId: string; sourceType: CommentSourceType; sourceId: string } {
  // Remove the /comments/{commentId} suffix to get the parent path
  const parts = docPath.split('/');
  // Find the 'comments' segment and take everything before it
  const commentsIndex = parts.indexOf('comments');
  if (commentsIndex > 0) {
    const parentPath = parts.slice(0, commentsIndex).join('/');
    return parseSourcePath(parentPath);
  }
  // Fallback: try to parse the full path
  return parseSourcePath(docPath);
}
