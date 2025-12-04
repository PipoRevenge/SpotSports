import { commentRepository, userRepository, voteRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Comment } from '@/src/entities/comment/model/comment';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCommentsParams {
  parentId: string;
  type: 'review'|'discussion';
  pageSize?: number;
  autoLoad?: boolean;
}

export interface UseCommentsReturn {
  comments: (Comment & { userName?: string; userProfileUrl?: string })[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addComment: (content: string, media?: string[], tags?: string[], level?: number) => Promise<Comment | null>;
  addReply: (parentCommentId: string, content: string, media?: string[], level?: number) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;
  loadReplies: (commentId: string) => Promise<void>;
  repliesMap: Record<string, { comments: (Comment & { userName?: string; userProfileUrl?: string })[]; page: number; total: number; hasMore: boolean }>;
  voteComment: (commentId: string, isLike: boolean) => Promise<void>;
  removeCommentVote: (commentId: string) => Promise<void>;
  getCommentVote: (commentId: string) => Promise<boolean | null>;
}

export function useComments({ parentId, type, pageSize = 10, autoLoad = true }: UseCommentsParams): UseCommentsReturn {
  type CommentWithUser = Comment & { userName?: string; userProfileUrl?: string };
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [repliesMap, setRepliesMap] = useState<Record<string, { comments: CommentWithUser[]; page: number; total: number; hasMore: boolean }>>({});
  const { user } = useUser();
  const commentsRef = useRef<CommentWithUser[]>(comments);

  useEffect(() => { commentsRef.current = comments; }, [comments]);
  
  // Use refs to store stable values for the load function
  const parentIdRef = useRef(parentId);
  const typeRef = useRef(type);
  const pageSizeRef = useRef(pageSize);
  
  // Update refs when values change
  useEffect(() => {
    parentIdRef.current = parentId;
    typeRef.current = type;
    pageSizeRef.current = pageSize;
  }, [parentId, type, pageSize]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { comments: c, total: t } = await commentRepository.getCommentsByParent(
        parentIdRef.current, 
        typeRef.current, 
        p, 
        pageSizeRef.current
      );
      // Enrich with user data
      const enriched = await Promise.all(c.map(async (cm) => {
        try {
          const userData = await userRepository.getUserById(cm.userId);
          return { ...cm, userName: userData?.userDetails.userName, userProfileUrl: userData?.userDetails.photoURL } as CommentWithUser;
        } catch {
          return { ...cm } as CommentWithUser;
        }
      }));
      if (p === 1) {
        // Avoid updating state if array of comments is identical (reduce unneeded rerenders)
        const prev = commentsRef.current;
        if (prev.length === enriched.length && prev.every((c, idx) => c.id === enriched[idx].id)) {
          // No change
        } else {
          setComments(enriched);
        }
      } else setComments(prev => [...prev, ...enriched]);
      setTotal(t);
      setHasMore(c.length === pageSizeRef.current);
      setPage(p);
    } catch (err) {
        console.error('[useComments] load:', err);
        setError(err instanceof Error ? err.message : 'Error loading comments');
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - uses refs for stable reference

  const loadMore = useCallback(async () => {
    if (loading) return;
    if (!hasMore) return;
    await load(page + 1);
  }, [loading, load, page, hasMore]);

  const refresh = useCallback(async () => {
    await load(1);
  }, [load]);

  const addComment = useCallback(async (content: string, media?: string[], tags?: string[], level: number = 0) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to comment');
    }
    try {
      const comment = await commentRepository.addComment(parentId, type, user.id, level, content, media, tags);
      // Enrich by current user
      const enriched = { ...comment, userName: user.userDetails.userName, userProfileUrl: user.userDetails.photoURL } as CommentWithUser;
      // prepend to list
      setComments(prev => [enriched, ...prev]);
      setTotal(prev => prev + 1);
      return comment;
    } catch (err) {
      console.error('[useComments] addComment:', err);
      throw err;
    }
  }, [parentId, type, user?.id, user?.userDetails?.userName, user?.userDetails?.photoURL]);

  const addReply = useCallback(async (parentCommentId: string, content: string, media?: string[], level: number = 1) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to reply');
    }
    try {
      // For replies, we use the commentId as parentId and keep the same type
      const reply = await commentRepository.addComment(parentCommentId, type, user.id, level, content, media, undefined);
      // Enrich by current user
      const enriched = { ...reply, userName: user.userDetails.userName, userProfileUrl: user.userDetails.photoURL } as CommentWithUser;
      
      // Add to replies map and update parent comment's commentsCount wherever it lives
      setRepliesMap(prev => {
        const clone = { ...prev } as typeof prev;
        const current = clone[parentCommentId];
        if (current) {
          clone[parentCommentId] = {
            ...current,
            comments: [...current.comments, enriched],
            total: current.total + 1,
          };
        } else {
          clone[parentCommentId] = {
            comments: [enriched],
            page: 1,
            total: 1,
            hasMore: false,
          };
        }

        // Update parent comment's commentsCount in repliesMap lists if it exists there (for nested parents)
        Object.keys(clone).forEach(key => {
          clone[key] = {
            ...clone[key],
            comments: clone[key].comments.map(c => c.id === parentCommentId ? ({ ...c, commentsCount: (c.commentsCount || 0) + 1 }) : c)
          };
        });

        return clone;
      });
      
      // Update commentsCount on the parent comment locally (if parent is top-level comment)
      setComments(prev => prev.map(c => 
        c.id === parentCommentId 
          ? { ...c, commentsCount: (c.commentsCount || 0) + 1 } 
          : c
      ));
      
      return reply;
    } catch (err) {
      console.error('[useComments] addReply:', err);
      throw err;
    }
  }, [type, user?.id, user?.userDetails?.userName, user?.userDetails?.photoURL]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await commentRepository.deleteComment(commentId);
      // Update local lists where needed
      setComments(prev => prev.filter(c => c.id !== commentId));
      // Also remove from replies map
      setRepliesMap(prev => {
        const clone = { ...prev } as typeof prev;
        const parentsFound: string[] = [];
        Object.keys(clone).forEach(key => {
          const beforeLen = clone[key].comments.length;
          clone[key] = { ...clone[key], comments: clone[key].comments.filter(c => c.id !== commentId) };
          const afterLen = clone[key].comments.length;
          if (afterLen < beforeLen) parentsFound.push(key);
        });
        // If we removed a comment from a replies list, decrement the parent's commentsCount in top-level comments as well
        if (parentsFound.length > 0) {
          setComments(prevComments => prevComments.map(c => parentsFound.includes(c.id) ? ({ ...c, commentsCount: Math.max(0, (c.commentsCount || 0) - 1) }) : c));
        }
        return clone;
      });
      setTotal(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[useComments] deleteComment', error);
      throw error;
    }
  }, []);

  const loadReplies = useCallback(async (commentId: string) => {
    try {
      const current = repliesMap[commentId];
      const nextPage = current ? current.page + 1 : 1;
      const { comments: c, total: t } = await commentRepository.getReplies(commentId, nextPage, pageSize);
      const enriched = await Promise.all(c.map(async (cm) => {
        try {
          const userData = await userRepository.getUserById(cm.userId);
          return { ...cm, userName: userData?.userDetails.userName, userProfileUrl: userData?.userDetails.photoURL } as CommentWithUser;
        } catch {
          return { ...cm } as CommentWithUser;
        }
      }));
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: {
          comments: current ? [...current.comments, ...enriched] : enriched,
          page: nextPage,
          total: t,
          hasMore: c.length === pageSize,
        }
      }));
    } catch (err) {
      console.error('[useComments] loadReplies:', err);
      throw err;
    }
  }, [repliesMap, pageSize]);

  const voteComment = useCallback(async (commentId: string, isLike: boolean) => {
    if (!user?.id) throw new Error('User must be authenticated to vote');
    try {
      await voteRepository.vote('comment', commentId, user.id, isLike);
      setComments(prev => prev.map(c => c.id === commentId ? ({ ...c, likesCount: isLike ? c.likesCount + 1 : Math.max(0, c.likesCount - 1), dislikesCount: !isLike ? c.dislikesCount + 1 : Math.max(0, c.dislikesCount - 1) }) : c));
    } catch (err) {
      console.error('[useComments] voteComment', err);
      throw err;
    }
  }, [user?.id]);

  const removeCommentVote = useCallback(async (commentId: string) => {
    if (!user?.id) throw new Error('User must be authenticated to remove vote');
    try {
      await voteRepository.removeVote('comment', commentId, user.id);
    } catch (err) {
      console.error('[useComments] removeCommentVote', err);
      throw err;
    }
  }, [user?.id]);

  const getCommentVote = useCallback(async (commentId: string): Promise<boolean | null> => {
    if (!user?.id) return null;
    try {
      return await voteRepository.getUserVote('comment', commentId, user.id);
    } catch (err) {
      console.error('[useComments] getCommentVote', err);
      return null;
    }
  }, [user?.id]);

  // Track if initial load has been done for this parentId
  const loadedParentIdRef = useRef<string | null>(null);

  // Initialize (controlled by autoLoad option)
  useEffect(() => {
    if (autoLoad && loadedParentIdRef.current !== parentId) {
      loadedParentIdRef.current = parentId;
      // Reset state when parentId changes
      setComments([]);
      setPage(1);
      setTotal(0);
      setHasMore(false);
      load(1).catch(() => {});
    }
  }, [autoLoad, parentId, load]);

  return {
    comments,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    addComment,
    addReply,
    deleteComment,
    loadReplies,
    repliesMap,
    voteComment,
    removeCommentVote,
    getCommentVote,
  };
}

export default useComments;