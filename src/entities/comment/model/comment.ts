export interface Comment {
  id: string;
  userId: string; // userId
  type: 'review' | 'discussion';
  parentId: string; // parent can be a reviewId, discussionId, or commentId
  level: number; // nested level 0..MAX_DEPTH
  content: string;
  media?: string[]; // array of media URLs
  tags?: string[];
  likesCount: number;
  dislikesCount: number;
  commentsCount: number; // replies count
  reports: number;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}
