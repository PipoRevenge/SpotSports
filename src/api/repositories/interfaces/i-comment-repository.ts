import { Comment } from '@/src/entities/comment/model/comment';

export interface ICommentRepository {
  getCommentsByParent(parentId: string, type: 'review'|'discussion', page: number, pageSize: number): Promise<{ comments: Comment[], total: number }>;
  getReplies(commentId: string, page: number, pageSize: number): Promise<{ comments: Comment[], total: number }>;
  addComment(parentId: string, type: 'review'|'discussion', userId: string, level: number, content: string, media?: string[], tags?: string[]): Promise<Comment>;
  updateComment(commentId: string, updates: Partial<{ content: string; media?: string[]; tags?: string[] }>): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  /**
   * Vota en un comentario (like/dislike) - deprecated
   * @deprecated - Moved to IVoteRepository; use voteRepository.vote('comment', commentId, userId, isLike)
   */
  voteComment(commentId: string, userId: string, isLike: boolean): Promise<void>;

  /**
   * Elimina voto en comentario - deprecated
   * @deprecated - Moved to IVoteRepository; use voteRepository.removeVote('comment', commentId, userId)
   */
  removeCommentVote(commentId: string, userId: string): Promise<void>;

  /**
   * Obtiene voto en comentario - deprecated
   * @deprecated - Moved to IVoteRepository; use voteRepository.getUserVote('comment', commentId, userId)
   */
  getCommentVote(commentId: string, userId: string): Promise<boolean | null>;
}
