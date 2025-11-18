import { reviewRepository, userRepository } from "@/src/api/repositories";
import { useUser } from "@/src/entities/user/context/user-context";
import { useCallback, useEffect, useState } from "react";
import { CommentWithUser } from "../types/comment-types";

interface UseReviewCommentsReturn {
  comments: CommentWithUser[];
  totalComments: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addComment: (content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  voteComment: (commentId: string, isLike: boolean) => Promise<void>;
  removeCommentVote: (commentId: string) => Promise<void>;
  getCommentVote: (commentId: string) => Promise<boolean | null>;
  refresh: () => Promise<void>;
}

/**
 * Hook para gestionar comentarios de una review con paginación
 */
export const useReviewComments = (
  reviewId: string,
  pageSize: number = 3
): UseReviewCommentsReturn => {
  const { user } = useUser();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Cargar comentarios con paginación
   */
  const loadComments = useCallback(async (page: number, append: boolean = false) => {
    if (!reviewId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await reviewRepository.getComments(reviewId, page + 1, pageSize);

      // Obtener datos de usuarios para cada comentario
      const commentsWithUsers: CommentWithUser[] = await Promise.all(
        result.comments.map(async (comment) => {
          try {
            const userData = await userRepository.getUserById(comment.createdBy);
            return {
              ...comment,
              userName: userData?.userDetails.userName,
              userProfileUrl: userData?.userDetails.photoURL,
            };
          } catch (err) {
            console.error('[useReviewComments] Error loading user:', err);
            return {
              ...comment,
              userName: comment.createdBy,
            };
          }
        })
      );

      if (append) {
        setComments(prev => [...prev, ...commentsWithUsers]);
      } else {
        setComments(commentsWithUsers);
      }
      
      setTotalComments(result.total);
      setHasMore(result.comments.length === pageSize);
    } catch (err) {
      console.error('[useReviewComments] Error loading comments:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar comentarios');
    } finally {
      setLoading(false);
    }
  }, [reviewId, pageSize]);

  /**
   * Cargar más comentarios (siguiente página)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadComments(nextPage, true);
  }, [currentPage, hasMore, loading, loadComments]);

  /**
   * Añadir un comentario
   */
  const addComment = useCallback(async (content: string) => {
    if (!reviewId || !content.trim() || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      await reviewRepository.addComment(reviewId, user.id, content);
      
      // Recargar comentarios desde el principio
      setCurrentPage(0);
      await loadComments(0, false);
    } catch (err) {
      console.error('[useReviewComments] Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Error al añadir comentario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reviewId, user?.id, loadComments]);

  /**
   * Eliminar un comentario
   */
  const deleteComment = useCallback(async (commentId: string) => {
    if (!commentId) return;

    try {
      setLoading(true);
      setError(null);

      await reviewRepository.deleteComment(reviewId, commentId);
      
      // Actualizar lista local
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalComments(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useReviewComments] Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar comentario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  /**
   * Refrescar comentarios
   */
  const refresh = useCallback(async () => {
    setCurrentPage(0);
    await loadComments(0, false);
  }, [loadComments]);

  /**
   * Votar en un comentario
   */
  const voteComment = useCallback(async (commentId: string, isLike: boolean) => {
    if (!user?.id) return;

    try {
      await reviewRepository.voteComment(reviewId, commentId, user.id, isLike);
      
      // Actualizar el comentario localmente
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          // Si ya había votado, ajustar contadores
          const wasLike = c.likesCount > 0;
          const wasDislike = c.dislikesCount > 0;
          
          return {
            ...c,
            likesCount: isLike ? c.likesCount + 1 : (wasLike ? c.likesCount - 1 : c.likesCount),
            dislikesCount: !isLike ? c.dislikesCount + 1 : (wasDislike ? c.dislikesCount - 1 : c.dislikesCount),
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('[useReviewComments] Error voting comment:', err);
      throw err;
    }
  }, [reviewId, user?.id]);

  /**
   * Eliminar voto de un comentario
   */
  const removeCommentVote = useCallback(async (commentId: string) => {
    if (!user?.id) return;

    try {
      await reviewRepository.removeCommentVote(reviewId, commentId, user.id);
      
      // Refrescar comentarios para obtener contadores actualizados
      await refresh();
    } catch (err) {
      console.error('[useReviewComments] Error removing comment vote:', err);
      throw err;
    }
  }, [reviewId, user?.id, refresh]);

  /**
   * Obtener el voto del usuario en un comentario
   * @returns true si es like, false si es dislike, null si no ha votado
   */
  const getCommentVote = useCallback(async (commentId: string): Promise<boolean | null> => {
    if (!user?.id) return null;

    try {
      return await reviewRepository.getCommentVote(reviewId, commentId, user.id);
    } catch (err) {
      console.error('[useReviewComments] Error getting comment vote:', err);
      return null;
    }
  }, [reviewId, user?.id]);

  /**
   * Cargar comentarios al montar el componente
   */
  useEffect(() => {
    loadComments(0, false);
  }, [loadComments]);

  return {
    comments,
    totalComments,
    loading,
    error,
    hasMore,
    loadMore,
    addComment,
    deleteComment,
    voteComment,
    removeCommentVote,
    getCommentVote,
    refresh,
  };
};
