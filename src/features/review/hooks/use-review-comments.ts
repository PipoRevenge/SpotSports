import { CommentWithUser, useComments } from '@/src/features/comment';

interface UseReviewCommentsReturn {
  comments: CommentWithUser[];
  totalComments: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addComment: (content: string, media?: string[]) => Promise<void>;
  addReply: (parentCommentId: string, content: string, media?: string[], level?: number) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  voteComment: (commentId: string, isLike: boolean) => Promise<void>;
  removeCommentVote: (commentId: string) => Promise<void>;
  getCommentVote: (commentId: string) => Promise<boolean | null>;
  refresh: () => Promise<void>;
  loadReplies: (commentId: string) => Promise<void>;
  repliesMap: Record<string, { comments: CommentWithUser[]; page: number; total: number; hasMore: boolean }>;
}

/**
 * Hook para gestionar comentarios de una review con paginación
 */
export const useReviewComments = (reviewId: string, pageSize: number = 10): UseReviewCommentsReturn => {
  const c = useComments({ parentId: reviewId, type: 'review', pageSize, autoLoad: true });
  return {
    comments: c.comments as CommentWithUser[],
    totalComments: c.total,
    loading: c.loading,
    error: c.error,
    hasMore: c.hasMore,
    loadMore: c.loadMore,
    addComment: async (payload: string, media?: string[]) => { await c.addComment(payload, media); },
    addReply: async (parentCommentId: string, content: string, media?: string[], level?: number) => { 
      await c.addReply(parentCommentId, content, media, level); 
    },
    deleteComment: async (id: string) => { await c.deleteComment(id); },
    voteComment: async (id: string, isLike: boolean) => { await c.voteComment(id, isLike); },
    removeCommentVote: async (id: string) => { await c.removeCommentVote(id); },
    getCommentVote: async (id: string) => await c.getCommentVote(id),
    refresh: c.refresh,
    loadReplies: c.loadReplies,
    repliesMap: c.repliesMap as Record<string, { comments: CommentWithUser[]; page: number; total: number; hasMore: boolean }>,
  };
};
