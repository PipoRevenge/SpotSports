export type CommentSourceType = 'review' | 'discussion';

export interface Comment {
  id: string;
  userId: string;
  contextId: string; // ID of the context containing the source (e.g., spotId for spot-based comments)
  sourceId: string; // ID of the parent resource (reviewId or discussionId)
  sourceType: CommentSourceType; // Type of the parent resource
  parentId: string; // parent can be a reviewId, discussionId, or commentId (for replies)
  level: number; // nested level 0..MAX_DEPTH
  content: string;
  media?: string[];
  tags?: string[];
  likesCount: number;
  dislikesCount: number;
  commentsCount: number; // replies count
  reports: number;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}
