import { commentRepository, userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';
import { useInfiniteQuery, useMutation, useQueryClient } from '@/src/lib/react-query';
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
  loadReplies: (commentId: string, depth?: number) => Promise<void>;
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
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [repliesMap, setRepliesMap] = useState<Record<string, { comments: CommentWithUser[]; page: number; total: number; hasMore: boolean }>>({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState<Record<string, boolean>>({});
  const { user, setUser } = useUser();
  const commentsRef = useRef<CommentWithUser[]>(comments);

  // Note: we rely on React Query for remote counters; we still update the local user via repository calls

  useEffect(() => { commentsRef.current = comments; }, [comments]);
  
  const queryClient = useQueryClient();
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

  const commentsQuery = useInfiniteQuery<any, any>({
    queryKey: ['comments', { contextId, sourceType, sourceId, pageSize }],
    initialPageParam: 1,
    queryFn: async (ctx: any) => {
      const pageParam = ctx.pageParam ?? 1;
      if (!contextId || !sourceId) return { comments: [], total: 0 };
      const { comments: c, total: t } = await commentRepository.getCommentsByParent(contextId, sourceType, sourceId, pageParam as number, pageSize);
      // Enrich with users
      const enriched = await Promise.all(c.map(async (cm) => {
        try {
          const userData = await userRepository.getUserById(cm.userId);
          return { ...cm, userName: userData?.userDetails.userName, userProfileUrl: userData?.userDetails.photoURL } as CommentWithUser;
        } catch {
          return { ...cm } as CommentWithUser;
        }
      }));
      return { items: enriched, total: t };
    },
    getNextPageParam: (lastPage: any, pages: any) => lastPage.items.length === pageSize ? pages.length + 1 : undefined,
    enabled: !!contextId && !!sourceId && autoLoad,
  });

  // sync to local state as some components expect the state shape
  useEffect(() => {
    const data = (commentsQuery.data?.pages ?? []) as any[];
    const flattened = data.flatMap(p => p.items);
    setComments(flattened);
    setTotal(data[0]?.total ?? 0);
    setHasMore(Boolean(commentsQuery.hasNextPage));
    // page count is available via commentsQuery.data.pages.length if needed
    setLoading(commentsQuery.isLoading);
    setError(commentsQuery.isError ? (commentsQuery.error as Error)?.message ?? 'Error loading comments' : null);
  }, [commentsQuery.data, commentsQuery.isLoading, commentsQuery.isError, commentsQuery.error, commentsQuery.hasNextPage]);

  const loadMore = useCallback(async () => { await commentsQuery.fetchNextPage(); }, [commentsQuery]);

  const refresh = useCallback(async () => { await commentsQuery.refetch(); }, [commentsQuery]);

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, media, tags, level }: { content: string; media?: string[]; tags?: string[]; level?: number }) => {
      if (!user?.id) throw new Error('User must be authenticated to comment');
      if (!contextId || !sourceId) throw new Error('contextId and sourceId are required to add comments');
      const comment = await commentRepository.addComment(contextId, sourceType, sourceId, sourceId, user.id, level ?? 0, content, media, tags);
      
      // Immediately enrich with user data
      let enrichedComment: any = comment;
      try {
        const userData = await userRepository.getUserById(user.id);
        enrichedComment = { 
          ...comment, 
          userName: userData?.userDetails.userName, 
          userProfileUrl: userData?.userDetails.photoURL 
        };
      } catch (err) {
        console.warn('[useComments] Failed to enrich comment with user data', err);
        // Use current user context as fallback
        enrichedComment = {
          ...comment,
          userName: user?.userDetails?.userName,
          userProfileUrl: user?.userDetails?.photoURL
        };
      }
      
      return enrichedComment;
    },
    onSuccess: async (enrichedComment) => {
      // Optimistically prepend enriched comment to the first page
      queryClient.setQueryData(['comments', { contextId, sourceType, sourceId, pageSize }], (old: any) => {
        if (!old) return old;
        const first = old.pages?.[0]?.items ?? [];
        const newFirst = [enrichedComment, ...first];
        const newPages = [{ ...old.pages[0], items: newFirst }, ...old.pages.slice(1)];
        return { ...old, pages: newPages };
      });
      
      // Invalidate and refetch to ensure consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['comments', { contextId, sourceType, sourceId, pageSize }] }),
        queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'userComments' }),
      ]);
      
      try {
        if (user?.id && typeof (userRepository as any).incrementActivityCounters === 'function') {
          await (userRepository as any).incrementActivityCounters(user.id, { commentsDelta: 1 });
        }
      } catch (e) {
        console.warn('[useComments] Failed to increment user commentsCount', e);
      }
      
      if (user) {
        setUser({
          ...user,
          activity: {
            ...user.activity,
            commentsCount: (user.activity?.commentsCount || 0) + 1,
          }
        });
      }
    }
  });

  const addReply = useMutation({
    mutationFn: async ({ parentCommentId, content, media, level }: { parentCommentId: string; content: string; media?: string[]; level?: number }) => {
      if (!user?.id) throw new Error('User must be authenticated to reply');
      if (!contextId || !sourceId) throw new Error('contextId and sourceId are required to add replies');
      const reply = await commentRepository.addComment(contextId, sourceType, sourceId, parentCommentId, user.id, level ?? 1, content, media, undefined);
      
      // Immediately enrich with user data
      let enrichedReply: any = reply;
      try {
        const userData = await userRepository.getUserById(user.id);
        enrichedReply = { 
          ...reply, 
          userName: userData?.userDetails?.userName, 
          userProfileUrl: userData?.userDetails?.photoURL 
        };
      } catch (err) {
        console.warn('[useComments] Failed to enrich reply with user data', err);
        // Use current user context as fallback
        enrichedReply = {
          ...reply,
          userName: user?.userDetails?.userName,
          userProfileUrl: user?.userDetails?.photoURL
        };
      }
      
      return enrichedReply;
    },
    onSuccess: async (enrichedReply, vars) => {
      // Update the replies list for parentCommentId
      const parentId = enrichedReply.parentId;
      
      // Update parent comment's count in main comments list
      queryClient.setQueryData(['comments', { contextId, sourceType, sourceId, pageSize }], (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({ 
          ...page, 
          items: page.items.map((c: any) => 
            c.id === parentId ? { ...c, commentsCount: (c.commentsCount || 0) + 1 } : c
          ) 
        }));
        return { ...old, pages };
      });
      
      // Update local repliesMap state with enriched reply
      setRepliesMap(prev => {
        const existing = prev[parentId]?.comments ?? [];
        const alreadyExists = existing.some(r => r.id === enrichedReply.id);
        const newComments = alreadyExists ? existing : existing.concat([enrichedReply]);
        return {
          ...prev,
          [parentId]: {
            comments: newComments,
            page: prev[parentId]?.page ?? 0,
            total: (prev[parentId]?.total ?? 0) + 1,
            hasMore: prev[parentId]?.hasMore ?? false,
          }
        };
      });
      
      if (user) {
        setUser({
          ...user,
          activity: {
            ...user.activity,
            commentsCount: (user.activity?.commentsCount || 0) + 1,
          }
        });
      }

      // Invalidate to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['comments', { contextId, sourceType, sourceId, pageSize }] });
    }
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!contextId || !sourceId) throw new Error('contextId and sourceId are required to delete comments');
      return await commentRepository.deleteComment(contextId, sourceType, sourceId, commentId);
    },
    onSuccess: async (data, vars) => {
      const { commentId } = vars as any;
      // Remove from cache
      queryClient.setQueryData(['comments', { contextId, sourceType, sourceId, pageSize }], (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({ ...page, items: page.items.filter((c: any) => c.id !== commentId) }));
        return { ...old, pages };
      });
      // Remove from repliesMap if present
      setRepliesMap(prev => {
        let modified = false;
        const newMap: typeof prev = { ...prev };
        Object.keys(newMap).forEach((k) => {
          const arr = newMap[k].comments ?? [];
          const filtered = arr.filter((c) => c.id !== commentId);
          if (filtered.length !== arr.length) {
            modified = true;
            newMap[k] = { ...newMap[k], comments: filtered, total: Math.max(0, (newMap[k].total ?? 0) - 1), page: filtered.length === 0 ? 0 : newMap[k].page };
          }
        });
        if (modified) {

          return newMap;
        }
        return prev;
      });
      await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'userComments' });
    }
  });

  const loadReplies = useCallback(async (commentId: string, depth: number = 0) => {
    if (!contextId || !sourceId) throw new Error('contextId and sourceId are required to load replies');
    // Prevent duplicate concurrent loads for the same comment
    if (loadingRepliesMap[commentId]) {

      return;
    }
    setLoadingRepliesMap(prev => ({ ...prev, [commentId]: true }));
    try {
    // Use a dedicated query to fetch replies when needed or rely on cache invalidation from mutations
    // repliesMap.page stores already loaded pages for the comment, default to 0 so the first fetch is page 1
    // Reset to 0 if we have pages recorded but no comments (e.g. after deletions)
    let page = repliesMap[commentId]?.page ?? 0;
    const hasNoCommentsButPagesLoaded = (repliesMap[commentId]?.page ?? 0) > 0 && (repliesMap[commentId]?.comments?.length ?? 0) === 0;
    if (hasNoCommentsButPagesLoaded) {

      page = 0;
    }
    const { comments: c, total: t } = await commentRepository.getReplies(contextId, sourceType, sourceId, commentId, page + 1, pageSize);
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
        comments: (prev[commentId]?.comments ?? []).concat(enriched),
        page: (prev[commentId]?.page ?? 0) + 1,
        total: t,
        hasMore: c.length === pageSize,
      }
    }));


    // Propagate loading to nested replies (depth limit to avoid runaway recursion)
    const MAX_DEPTH = 10;
    if (depth < MAX_DEPTH) {
      const childrenToLoad = enriched.filter((r: any) => (r.commentsCount ?? 0) > 0);
      if (childrenToLoad.length > 0) {

        await Promise.all(childrenToLoad.map(async (child: any) => {
          const hasLoaded = (repliesMap[child.id]?.comments?.length ?? 0) > 0;

          if (!hasLoaded) {
            await loadReplies(child.id, depth + 1);
          } else {

          }
        }));
      }
    } else {

    }

    } finally {
      setLoadingRepliesMap(prev => ({ ...prev, [commentId]: false }));
    }
  }, [contextId, sourceType, sourceId, pageSize, repliesMap, loadingRepliesMap]);

  const voteComment = useMutation({
    mutationFn: async ({ commentId, isLike }: { commentId: string; isLike: boolean }) => {
      if (!user?.id) throw new Error('User must be authenticated to vote');
      if (!contextId || !sourceId) throw new Error('contextId and sourceId are required for voting');
      return await commentRepository.voteComment(contextId, sourceType, sourceId, commentId, user.id, isLike);
    },
    onSuccess: async (_, vars) => {
      const { commentId, isLike } = vars as any;
      // Update local counters
      queryClient.setQueryData(['comments', { contextId, sourceType, sourceId, pageSize }], (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({ ...page, items: page.items.map((c: any) => c.id === commentId ? { ...c, likesCount: isLike ? c.likesCount + 1 : Math.max(0, c.likesCount - 1), dislikesCount: !isLike ? c.dislikesCount + 1 : Math.max(0, c.dislikesCount - 1) } : c) }));
        return { ...old, pages };
      });
    }
  });
  const removeCommentVote = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      if (!user?.id) throw new Error('User must be authenticated to remove vote');
      if (!contextId || !sourceId) throw new Error('contextId and sourceId are required for removing vote');
      return await commentRepository.removeCommentVote(contextId, sourceType, sourceId, commentId, user.id);
    },
    onSuccess: async (_, vars) => {
      const { commentId } = vars as any;
      queryClient.setQueryData(['comments', { contextId, sourceType, sourceId, pageSize }], (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({ ...page, items: page.items.map((c: any) => c.id === commentId ? ({ ...c, likesCount: Math.max(0, c.likesCount - 1), dislikesCount: Math.max(0, c.dislikesCount - 1) }) : c) }));
        return { ...old, pages };
      });
    }
  });

  // placeholder: per-comment votes should use dedicated hooks (useCommentVote)

  // Track if initial load has been done for this source
  const loadedKeyRef = useRef<string | null>(null);
  const currentKey = `${contextId}:${sourceType}:${sourceId}`;

  // Initialize (controlled by autoLoad option)
  useEffect(() => {
    if (autoLoad && contextId && sourceId && loadedKeyRef.current !== currentKey) {
      loadedKeyRef.current = currentKey;
      // Reset state when source changes; react-query will load on its own
      setComments([]);
      // page count reset handled by react-query
      setTotal(0);
      setHasMore(false);
      commentsQuery.refetch().catch(() => {});
    }
  }, [autoLoad, contextId, sourceId, currentKey, commentsQuery]);

  return {
    comments,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    addComment: (content: string, media?: string[], tags?: string[], level?: number) => addCommentMutation.mutateAsync({ content, media, tags, level }),
    addReply: (parentCommentId: string, content: string, media?: string[], level?: number) => addReply.mutateAsync({ parentCommentId, content, media, level }),
    deleteComment: (commentId: string) => deleteComment.mutateAsync({ commentId }),
    loadReplies,
    repliesMap,
    voteComment: (commentId: string, isLike: boolean) => voteComment.mutateAsync({ commentId, isLike }),
    removeCommentVote: (commentId: string) => removeCommentVote.mutateAsync({ commentId }),
    getCommentVote: async (commentId: string) => {
      if (!user?.id) return null;
      try {
        return await commentRepository.getCommentVote(contextId!, sourceType, sourceId!, commentId, user.id);
      } catch {
        return null;
      }
    },
  };
}

export default useComments;