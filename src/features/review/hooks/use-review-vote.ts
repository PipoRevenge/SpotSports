import { reviewRepository } from "@/src/api/repositories";
import { useUser } from "@/src/context/user-context";
import { useCallback, useEffect, useState } from "react";

/**
 * Estado del voto del usuario en una review
 */
export interface ReviewVoteState {
  isLiked: boolean;
  isDisliked: boolean;
  isVoting: boolean;
}

/**
 * Hook para gestionar los votos (likes/dislikes) en una review
 * 
 * Características:
 * - Permite dar like o dislike a una review
 * - Permite cambiar el voto (de like a dislike o viceversa)
 * - Permite quitar el voto
 * - Sincroniza el estado con Firebase
 * - Requiere que el usuario esté autenticado
 * - Actualiza los contadores en tiempo real
 * 
 * @param spotId - ID del spot al que pertenece la review
 * @param reviewId - ID de la review
 * @param onVoteChange - Callback cuando cambian los contadores (likes, dislikes)
 * @param autoFetch - Si debe cargar automáticamente el voto del usuario (default: true)
 * 
 * @example
 * ```tsx
 * const { voteState, handleLike, handleDislike } = useReviewVote(spotId, reviewId);
 * 
 * <Button 
 *   onPress={handleLike}
 *   disabled={voteState.isVoting}
 * >
 *   <ThumbsUp fill={voteState.isLiked ? "blue" : "none"} />
 * </Button>
 * ```
 */
export const useReviewVote = (
  spotId: string | undefined,
  reviewId: string | undefined,
  onVoteChange?: (likes: number, dislikes: number) => void,
  autoFetch: boolean = true
) => {
  const { user } = useUser();
  const userId = user?.id;

  const [voteState, setVoteState] = useState<ReviewVoteState>({
    isLiked: false,
    isDisliked: false,
    isVoting: false,
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene el voto actual del usuario
   */
  const fetchUserVote = useCallback(async () => {
    if (!spotId || !reviewId || !userId) {
      return;
    }

    try {
      const vote = await reviewRepository.getUserVote(spotId, reviewId, userId);
      
      setVoteState(prev => ({
        ...prev,
        isLiked: vote === true,
        isDisliked: vote === false,
      }));
    } catch (err) {
      console.error("[useReviewVote] Error fetching user vote:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vote");
    }
  }, [spotId, reviewId, userId]);

  /**
   * Maneja el voto (like o dislike)
   */
  const handleVote = useCallback(async (isLike: boolean, currentLikes: number, currentDislikes: number) => {
    if (!spotId || !reviewId || !userId) {
      setError("User must be logged in to vote");
      return;
    }

    setVoteState(prev => ({ ...prev, isVoting: true }));
    setError(null);

    // Calcular nuevos contadores
    let newLikes = currentLikes;
    let newDislikes = currentDislikes;

    try {
      // Si el usuario hace clic en el mismo voto, quitarlo
      if ((isLike && voteState.isLiked) || (!isLike && voteState.isDisliked)) {
        await reviewRepository.removeVote(spotId, reviewId, userId);
        
        // Actualizar contadores
        if (isLike) {
          newLikes = Math.max(0, currentLikes - 1);
        } else {
          newDislikes = Math.max(0, currentDislikes - 1);
        }
        
        setVoteState({
          isLiked: false,
          isDisliked: false,
          isVoting: false,
        });
      } else {
        // Crear o actualizar el voto
        await reviewRepository.voteReview(spotId, reviewId, userId, isLike);
        
        // Actualizar contadores
        if (isLike) {
          newLikes = currentLikes + 1;
          if (voteState.isDisliked) {
            newDislikes = Math.max(0, currentDislikes - 1);
          }
        } else {
          newDislikes = currentDislikes + 1;
          if (voteState.isLiked) {
            newLikes = Math.max(0, currentLikes - 1);
          }
        }
        
        setVoteState({
          isLiked: isLike,
          isDisliked: !isLike,
          isVoting: false,
        });
      }
      
      // Notificar cambio de contadores
      if (onVoteChange) {
        onVoteChange(newLikes, newDislikes);
      }
    } catch (err) {
      console.error("[useReviewVote] Error voting:", err);
      setError(err instanceof Error ? err.message : "Failed to vote");
      setVoteState(prev => ({ ...prev, isVoting: false }));
    }
  }, [spotId, reviewId, userId, voteState, onVoteChange]);

  /**
   * Handler para dar like
   */
  const handleLike = useCallback((currentLikes: number, currentDislikes: number) => {
    handleVote(true, currentLikes, currentDislikes);
  }, [handleVote]);

  /**
   * Handler para dar dislike
   */
  const handleDislike = useCallback((currentLikes: number, currentDislikes: number) => {
    handleVote(false, currentLikes, currentDislikes);
  }, [handleVote]);

  /**
   * Cargar el voto del usuario al montar el componente
   */
  useEffect(() => {
    if (autoFetch && spotId && reviewId && userId) {
      fetchUserVote();
    }
  }, [autoFetch, fetchUserVote, spotId, reviewId, userId]);

  return {
    voteState,
    handleLike,
    handleDislike,
    error,
    refetch: fetchUserVote,
  };
};
