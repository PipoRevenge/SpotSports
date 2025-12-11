import { commentRepository, userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCommentsParams {
  /** ID of the context (spot) containing the source */
  contextId: string;
  /** Type of parent resource (review or discussion) */
  sourceType: CommentSourceType;
  /** ID of the parent resource (reviewId or discussionId) */
  sourceId: string;
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

export function useComments({ 
  contextId,
  sourceType,
  sourceId,
  pageSize = 10, 
  autoLoad = true 
}: UseCommentsParams): UseCommentsReturn {
  type CommentWithUser = Comment & { userName?: string; userProfileUrl?: string };
  
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [repliesMap, setRepliesMap] = useState<Record<string, { comments: CommentWithUser[]; page: number; total: number; hasMore: boolean }>>({});
  const { user, setUser } = useUser();
  const commentsRef = useRef<CommentWithUser[]>(comments);

  const incrementUserCommentsContext = useCallback(() => {
    if (!user) return;
    setUser({
      ...user,
      activity: {
        ...user.activity,
        commentsCount: (user.activity.commentsCount || 0) + 1,
      },
    });
  }, [setUser, user]);

  useEffect(() => { commentsRef.current = comments; }, [comments]);
  
  // Use refs to store stable values for the load function
  const contextIdRef = useRef(contextId);
  const sourceTypeRef = useRef(sourceType);
  const sourceIdRef = useRef(sourceId);
  const pageSizeRef = useRef(pageSize);
  
  // Update refs when values change
  useEffect(() => {
    contextIdRef.current = contextId;
    sourceTypeRef.current = sourceType;
    sourceIdRef.current = sourceId;
    pageSizeRef.current = pageSize;
  }, [contextId, sourceType, sourceId, pageSize]);

  const load = useCallback(async (p = 1) => {
    if (!contextIdRef.current || !sourceIdRef.current) {
      console.warn('[useComments] Missing contextId or sourceId, skipping load');
      return;
    }
    setLoading(true);
    try {
      const { comments: c, total: t } = await commentRepository.getCommentsByParent(
        contextIdRef.current,
        sourceTypeRef.current,
        sourceIdRef.current,
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
  }, []);

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
    if (!contextId || !sourceId) {
      throw new Error('contextId and sourceId are required to add comments');
    }
    try {
      const comment = await commentRepository.addComment(
        contextId,
        sourceType,
        sourceId,
        sourceId, // parentId for level 0 is the sourceId
        user.id,
        level,
        content,
        media,
        tags
      );
      // Enrich by current user
      const enriched = { ...comment, userName: user.userDetails.userName, userProfileUrl: user.userDetails.photoURL } as CommentWithUser;
      // prepend to list
      setComments(prev => [enriched, ...prev]);
      setTotal(prev => prev + 1);

      // Incrementar contador de comentarios del usuario (remoto y contexto)
      try {
        await userRepository.incrementActivityCounters(user.id, { commentsDelta: 1 });
        incrementUserCommentsContext();
      } catch (counterError) {
        console.warn('[useComments] Failed to increment user commentsCount', counterError);
      }
      return comment;
    } catch (err) {
      console.error('[useComments] addComment:', err);
      throw err;
    }
  }, [contextId, sourceType, sourceId, user?.id, user?.userDetails?.userName, user?.userDetails?.photoURL]);

  const addReply = useCallback(async (parentCommentId: string, content: string, media?: string[], level: number = 1) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to reply');
    }
    if (!contextId || !sourceId) {
      throw new Error('contextId and sourceId are required to add replies');
    }
    try {
      const reply = await commentRepository.addComment(
        contextId,
        sourceType,
        sourceId,
        parentCommentId, // parentId is the comment we're replying to
        user.id,
        level,
        content,
        media,
        undefined
      );
      // Enrich by current user
      const enriched = { ...reply, userName: user.userDetails.userName, userProfileUrl: user.userDetails.photoURL } as CommentWithUser;
      
      // Add to replies map
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

        // Update parent comment's commentsCount in repliesMap lists
        Object.keys(clone).forEach(key => {
          clone[key] = {
            ...clone[key],
            comments: clone[key].comments.map(c => c.id === parentCommentId ? ({ ...c, commentsCount: (c.commentsCount || 0) + 1 }) : c)
          };
        });

        return clone;
      });
      
      // Update commentsCount on the parent comment locally
      setComments(prev => prev.map(c => 
        c.id === parentCommentId 
          ? { ...c, commentsCount: (c.commentsCount || 0) + 1 } 
          : c
      ));

      // Incrementar contador de comentarios del usuario (remoto y contexto)
      try {
        await userRepository.incrementActivityCounters(user.id, { commentsDelta: 1 });
        incrementUserCommentsContext();
      } catch (counterError) {
        console.warn('[useComments] Failed to increment user commentsCount (reply)', counterError);
      }
      
      return reply;
    } catch (err) {
      console.error('[useComments] addReply:', err);
      throw err;
    }
  }, [contextId, sourceType, sourceId, user?.id, user?.userDetails?.userName, user?.userDetails?.photoURL]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!contextId || !sourceId) {
      throw new Error('contextId and sourceId are required to delete comments');
    }
    try {
      await commentRepository.deleteComment(contextId, sourceType, sourceId, commentId);
      // Update local lists
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
  }, [contextId, sourceType, sourceId]);

  const loadReplies = useCallback(async (commentId: string) => {
    if (!contextId || !sourceId) {
      throw new Error('contextId and sourceId are required to load replies');
    }
    try {
      const current = repliesMap[commentId];
      const nextPage = current ? current.page + 1 : 1;
      const { comments: c, total: t } = await commentRepository.getReplies(contextId, sourceType, sourceId, commentId, nextPage, pageSize);
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
  }, [contextId, sourceType, sourceId, repliesMap, pageSize]);

  const voteComment = useCallback(async (commentId: string, isLike: boolean) => {
    if (!user?.id) throw new Error('User must be authenticated to vote');
    if (!contextId || !sourceId) throw new Error('contextId and sourceId are required for voting');
    try {
      await commentRepository.voteComment(contextId, sourceType, sourceId, commentId, user.id, isLike);
      setComments(prev => prev.map(c => c.id === commentId ? ({ ...c, likesCount: isLike ? c.likesCount + 1 : Math.max(0, c.likesCount - 1), dislikesCount: !isLike ? c.dislikesCount + 1 : Math.max(0, c.dislikesCount - 1) }) : c));
    } catch (err) {
      console.error('[useComments] voteComment', err);
      throw err;
    }
  }, [user?.id, contextId, sourceType, sourceId]);

  const removeCommentVote = useCallback(async (commentId: string) => {
    if (!user?.id) throw new Error('User must be authenticated to remove vote');
    if (!contextId || !sourceId) throw new Error('contextId and sourceId are required for removing vote');
    try {
      await commentRepository.removeCommentVote(contextId, sourceType, sourceId, commentId, user.id);
    } catch (err) {
      console.error('[useComments] removeCommentVote', err);
      throw err;
    }
  }, [user?.id, contextId, sourceType, sourceId]);

  const getCommentVote = useCallback(async (commentId: string): Promise<boolean | null> => {
    if (!user?.id) return null;
    if (!contextId || !sourceId) return null;
    try {
      return await commentRepository.getCommentVote(contextId, sourceType, sourceId, commentId, user.id);
    } catch (err) {
      console.error('[useComments] getCommentVote', err);
      return null;
    }
  }, [user?.id, contextId, sourceType, sourceId]);

  // Track if initial load has been done for this source
  const loadedKeyRef = useRef<string | null>(null);
  const currentKey = `${contextId}:${sourceType}:${sourceId}`;

  // Initialize (controlled by autoLoad option)
  useEffect(() => {
    if (autoLoad && contextId && sourceId && loadedKeyRef.current !== currentKey) {
      loadedKeyRef.current = currentKey;
      // Reset state when source changes
      setComments([]);
      setPage(1);
      setTotal(0);
      setHasMore(false);
      load(1).catch(() => {});
    }
  }, [autoLoad, contextId, sourceId, currentKey, load]);

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