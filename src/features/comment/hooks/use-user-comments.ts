import { commentRepository, discussionRepository, reviewRepository, spotRepository, userRepository } from '@/src/api/repositories';
import { Comment } from '@/src/entities/comment/model/comment';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { Review } from '@/src/entities/review/model/review';
import { Spot } from '@/src/entities/spot/model/spot';
import { User } from '@/src/entities/user/model/user';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface CommentContext {
  spot?: Spot;
  review?: Review;
  discussion?: Discussion;
  user?: User;
}

export const useUserComments = (userId: string | undefined, autoFetch = true) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [contextMap, setContextMap] = useState<Map<string, CommentContext>>(new Map());
  const [parentComments, setParentComments] = useState<Map<string, Comment>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUserComments = useCallback(async () => {
    if (!userId) {
      setComments([]);
      setContextMap(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedComments = await commentRepository.getCommentsByUser(userId);

      // Sort by createdAt desc
      fetchedComments.sort(
        (a: Comment, b: Comment) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      if (mountedRef.current) setComments(fetchedComments);

      // Fetch context data for each comment
      const contextData = new Map<string, CommentContext>();
      const parentData = new Map<string, Comment>();

      // Cache parent comment fetches to avoid duplicate requests
      const parentFetchCache = new Map<string, Comment | null>();
      
      // Get unique spot IDs
      const spotIds = [...new Set(fetchedComments.map((c: Comment) => c.contextId).filter(Boolean))];
      
      // Fetch spots
      await Promise.all(
        spotIds.map(async (spotId) => {
          try {
            const spot = await spotRepository.getSpotById(spotId);
            if (spot) {
              const existing = contextData.get(spotId) || {};
              contextData.set(spotId, { ...existing, spot });
            }
          } catch (e) {
            console.warn(`[useUserComments] failed to fetch spot ${spotId}`, e);
          }
        })
      );

      // Fetch reviews or discussions based on sourceType
      await Promise.all(
        fetchedComments.map(async (comment: Comment) => {
          const key = `${comment.sourceType}-${comment.sourceId}`;
          try {
            if (comment.sourceType === 'review') {
              const review = await reviewRepository.getReviewById(comment.sourceId, comment.contextId);
              if (review) {
                const existing = contextData.get(key) || {};
                contextData.set(key, { ...existing, review });
              }
            } else if (comment.sourceType === 'discussion') {
              const discussion = await discussionRepository.getDiscussionById(comment.sourceId, comment.contextId);
              if (discussion) {
                const existing = contextData.get(key) || {};
                contextData.set(key, { ...existing, discussion });
              }
            }
          } catch (e) {
            console.warn(`[useUserComments] failed to fetch ${comment.sourceType} ${comment.sourceId}`, e);
          }
        })
      );

      // Fetch parent comments (for replies) so we can show the quoted parent message
      const replyComments = fetchedComments.filter((c) => c.level > 0 && c.parentId && c.parentId !== c.sourceId);
      for (const reply of replyComments) {
        const parentKey = `${reply.contextId}-${reply.sourceType}-${reply.sourceId}-${reply.parentId}`;
        if (!parentFetchCache.has(parentKey)) {
          const parentComment = await commentRepository.getCommentById(reply.contextId, reply.sourceType, reply.sourceId, reply.parentId);
          parentFetchCache.set(parentKey, parentComment);
        }
      }

      // Map each child comment to its parent (if available)
      replyComments.forEach((reply) => {
        const parentKey = `${reply.contextId}-${reply.sourceType}-${reply.sourceId}-${reply.parentId}`;
        const parent = parentFetchCache.get(parentKey);
        if (parent) {
          parentData.set(reply.id, parent);
        }
      });

      // Fetch the user
      try {
        const user = await userRepository.getUserById(userId);
        if (user) {
          contextData.set('user', { user });
        }
      } catch (e) {
        console.warn(`[useUserComments] failed to fetch user ${userId}`, e);
      }

      if (mountedRef.current) {
        setContextMap(contextData);
        setParentComments(parentData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user comments';
      setError(message);
      console.error('[useUserComments] Error:', err);

      // Gracefully handle Firestore Index requirement error
      if (message.includes('requires an index') || message.includes('failed-precondition')) {
         console.warn('[useUserComments] Index missing. This is normal for new queries. Please create the index using the link in the console.');
         if (mountedRef.current) {
            setComments([]);
            setError(null);
         }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch && userId) fetchUserComments();
    return () => {
      mountedRef.current = false;
    };
  }, [autoFetch, userId, fetchUserComments]);

  const refetch = useCallback(() => fetchUserComments(), [fetchUserComments]);

  return {
    comments,
    contextMap,
    loading,
    error,
    refetch,
    parentComments,
  };
};
