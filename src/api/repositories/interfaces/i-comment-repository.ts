import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';

/**
 * Comment Repository Interface
 * 
 * Uses contextId + sourceType + sourceId to locate comments, abstracting away
 * the underlying storage structure (Firestore paths).
 * 
 * Example usage:
 * - contextId: "abc123", sourceType: "review", sourceId: "xyz789"
 * - contextId: "abc123", sourceType: "discussion", sourceId: "def456"
 */
export interface ICommentRepository {
  /**
   * Get top-level comments (level 0) for a resource
   * @param contextId - ID of the context (spot)
   * @param sourceType - Type of parent resource (review or discussion)
   * @param sourceId - ID of the parent resource
   */
  getCommentsByParent(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    page: number,
    pageSize: number
  ): Promise<{ comments: Comment[]; total: number }>;

  /**
   * Get replies to a comment
   * @param contextId - ID of the context (spot)
   * @param sourceType - Type of root parent resource
   * @param sourceId - ID of the root parent resource
   * @param commentId - ID of the comment to get replies for
   */
  getReplies(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    page: number,
    pageSize: number
  ): Promise<{ comments: Comment[]; total: number }>;

  /**
   * Add a comment
   * @param contextId - ID of the context (spot)
   * @param sourceType - Type of parent resource
   * @param sourceId - ID of the root parent resource
   * @param parentId - Direct parent ID (sourceId for level 0, commentId for replies)
   * @param userId - User creating the comment
   * @param level - Nesting level (0 = direct, 1+ = reply)
   */
  addComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    parentId: string,
    userId: string,
    level: number,
    content: string,
    media?: string[],
    tags?: string[]
  ): Promise<Comment>;

  /**
   * Update a comment
   */
  updateComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    updates: Partial<{ content: string; media?: string[]; tags?: string[] }>
  ): Promise<Comment>;

  /**
   * Delete a comment (soft delete)
   */
  deleteComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string
  ): Promise<void>;

  /**
   * Get all comments by a user using collectionGroup query
   */
  getCommentsByUser(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Comment[]>;

  /**
   * Vote on a comment
   * @param contextId - ID of the context (spot)
   * @param sourceType - Type of parent resource
   * @param sourceId - ID of the parent resource
   * @param commentId - ID of the comment to vote on
   * @param userId - User voting
   * @param isLike - true for like, false for dislike
   */
  voteComment(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    userId: string,
    isLike: boolean
  ): Promise<void>;

  /**
   * Remove a vote from a comment
   * @param contextId - ID of the context (spot)
   * @param sourceType - Type of parent resource
   * @param sourceId - ID of the parent resource
   * @param commentId - ID of the comment
   * @param userId - User removing vote
   */
  removeCommentVote(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    userId: string
  ): Promise<void>;

  /**
   * Get user's vote on a comment
   * @param contextId - ID of the context (spot)
   * @param sourceType - Type of parent resource
   * @param sourceId - ID of the parent resource
   * @param commentId - ID of the comment
   * @param userId - User to check vote for
   * @returns true for like, false for dislike, null if no vote
   */
  getCommentVote(
    contextId: string,
    sourceType: CommentSourceType,
    sourceId: string,
    commentId: string,
    userId: string
  ): Promise<boolean | null>;
}
