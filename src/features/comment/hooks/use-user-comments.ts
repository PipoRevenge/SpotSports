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

      // Fetch the user
      try {
        const user = await userRepository.getUserById(userId);
        if (user) {
          contextData.set('user', { user });
        }
      } catch (e) {
        console.warn(`[useUserComments] failed to fetch user ${userId}`, e);
      }

      if (mountedRef.current) setContextMap(contextData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user comments';
      setError(message);
      console.error('[useUserComments] Error:', err);
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
  };
};
