import { reviewRepository, userRepository } from "@/src/api/repositories";
import { Review } from "@/src/entities/review/review";
import { User } from "@/src/entities/user/model/user";
import { useCallback, useEffect, useState } from "react";

/**
 * Tipos de ordenamiento para las reviews
 */
export type ReviewSortOption = "recent" | "oldest" | "rating-high" | "rating-low";

/**
 * Filtros para las reviews
 */
export interface ReviewFilters {
  sportId?: string; // Filtrar por un deporte específico (vacío = todos)
  minRating?: number; // Rating mínimo
}

/**
 * Hook para obtener y gestionar las reviews de un spot
 * 
 * Características:
 * - Obtiene reviews del repositorio
 * - Permite filtrar por deporte
 * - Permite ordenar por varios criterios
 * - Maneja estados de loading y error
 * 
 * @param spotId - ID del spot
 * @param autoFetch - Si debe cargar automáticamente (default: true)
 */
export const useSpotReviews = (spotId: string | undefined, autoFetch = true) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [usersData, setUsersData] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [sortBy, setSortBy] = useState<ReviewSortOption>("recent");

  /**
   * Obtiene las reviews del spot desde el repositorio
   */
  const fetchReviews = useCallback(async () => {
    if (!spotId) {
      setError("No spot ID provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedReviews = await reviewRepository.getReviewsBySpot(spotId);
      setReviews(fetchedReviews);
      
      // Obtener IDs únicos de usuarios creadores de reviews (filtrar undefined/null/empty)
      const userIds = [...new Set(
        fetchedReviews
          .map(review => review.metadata.createdBy)
          .filter(id => id && typeof id === 'string' && id.trim().length > 0)
      )];
      
      // Cargar datos de usuarios en paralelo
      const usersMap = new Map<string, User>();
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await userRepository.getUserById(userId);
            usersMap.set(userId, user);
          } catch (err) {
            console.warn(`[useSpotReviews] Failed to fetch user ${userId}:`, err);
          }
        })
      );
      
      setUsersData(usersMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch reviews";
      setError(errorMessage);
      console.error("[useSpotReviews] Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  /**
   * Aplica filtros y ordenamiento a las reviews
   */
  const applyFiltersAndSort = useCallback(() => {
    let result = [...reviews];

    // Aplicar filtro por deporte (un solo deporte)
    if (filters.sportId && filters.sportId.trim() !== "") {
      result = result.filter((review) =>
        review.details.reviewSports.some((rs) => rs.sportId === filters.sportId)
      );
    }

    // Aplicar filtro por rating mínimo
    if (filters.minRating !== undefined) {
      result = result.filter((review) => review.details.rating >= filters.minRating!);
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
        break;
      case "oldest":
        result.sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime());
        break;
      case "rating-high":
        result.sort((a, b) => b.details.rating - a.details.rating);
        break;
      case "rating-low":
        result.sort((a, b) => a.details.rating - b.details.rating);
        break;
    }

    setFilteredReviews(result);
  }, [reviews, filters, sortBy]);

  /**
   * Actualiza los filtros
   */
  const updateFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Resetea los filtros
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Efecto para cargar reviews automáticamente
   */
  useEffect(() => {
    if (autoFetch && spotId) {
      fetchReviews();
    }
  }, [autoFetch, spotId, fetchReviews]);

  /**
   * Efecto para aplicar filtros cuando cambian
   */
  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  return {
    reviews: filteredReviews,
    allReviews: reviews,
    totalReviews: reviews.length, // Total sin filtrar
    usersData,
    loading,
    error,
    filters,
    sortBy,
    updateFilters,
    resetFilters,
    setSortBy,
    refetch: fetchReviews,
  };
};
