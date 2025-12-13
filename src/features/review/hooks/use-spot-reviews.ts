import { reviewRepository, userRepository } from "@/src/api/repositories";
import { User } from "@/src/entities/user/model/user";
import { useQuery, useQueryClient } from "@/src/lib/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

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

// Estado vacío para cuando no hay spotId
const EMPTY_STATE = {
  reviews: [] as any[],
  allReviews: [] as any[],
  totalReviews: 0,
  usersData: new Map<string, User>(),
  loading: false,
  isFetching: false,
  error: null as string | null,
  filters: {} as ReviewFilters,
  sortBy: "recent" as ReviewSortOption,
  updateFilters: (() => {}) as (newFilters: Partial<ReviewFilters>) => void,
  resetFilters: (() => {}) as () => void,
  setSortBy: (() => {}) as (sort: ReviewSortOption) => void,
  refetch: (() => Promise.resolve()) as () => Promise<any>,
  clearCache: (() => Promise.resolve()) as () => Promise<void>,
};

/**
 * Hook optimizado para obtener y gestionar las reviews de un spot con React Query
 * 
 * Características:
 * - Usa React Query para cache y optimización
 * - Permite filtrar por deporte
 * - Permite ordenar por varios criterios
 * - Cache automático de 1 minuto
 * - NO ejecuta queries cuando spotId es undefined/null/vacío
 * 
 * @param spotId - ID del spot
 * @param limit - Número máximo de reviews (default: 50)
 * @param offset - Offset para paginación (default: 0)
 */
export const useSpotReviews = (
  spotId: string | undefined, 
  limit: number = 50,
  offset: number = 0
) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [sortBy, setSortBy] = useState<ReviewSortOption>("recent");

  // Validar spotId de forma estricta
  const isValidSpotId = Boolean(spotId && typeof spotId === 'string' && spotId.trim().length > 0);

  // Log solo cuando spotId cambia
  useEffect(() => {
    if (isValidSpotId) {
      console.log('[useSpotReviews] 🎯 SpotId changed to:', spotId);
    } else {
      console.log('[useSpotReviews] ⚠️ SpotId is invalid or undefined, query will not execute');
    }
  }, [spotId, isValidSpotId]);

  // Query optimizada con React Query - SOLO se ejecuta si isValidSpotId es true
  const query = useQuery({
    queryKey: ['spot', spotId, 'reviews', limit, offset],
    // CRÍTICO: enabled debe ser false cuando no hay spotId válido
    enabled: isValidSpotId,
    staleTime: 1 * 60_000, // 1 minuto
    gcTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    // Solo definimos queryFn cuando hay un spotId válido
    queryFn: isValidSpotId ? async () => {
      console.log('[useSpotReviews] 🔥 Llamando a Firebase para spotId:', spotId, 'limit:', limit, 'offset:', offset);
      
      // Cargar reviews - spotId está garantizado por isValidSpotId
      const reviews = await reviewRepository.getReviewsBySpot(spotId!, limit, offset);
      console.log('[useSpotReviews] ✅ Loaded', reviews.length, 'reviews from Firebase');
      
      // Cargar usuarios en paralelo
      const userIds = [...new Set(reviews.map(r => r.metadata.createdBy))];
      console.log('[useSpotReviews] 👥 Loading', userIds.length, 'users...');
      const usersMap = new Map<string, User>();
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await userRepository.getUserById(userId);
            if (user) {
              usersMap.set(userId, user);
            }
          } catch (err) {
            console.warn(`Failed to load user ${userId}:`, err);
          }
        })
      );
      
      console.log('[useSpotReviews] ✅ Loaded', usersMap.size, 'users from Firebase');
      console.log('[useSpotReviews] 📦 Returning data to React Query cache');
      
      return { reviews, users: usersMap };
    } : async () => {
      // Fallback que nunca debería ejecutarse
      return { reviews: [], users: new Map<string, User>() };
    },
  });

  // Aplicar filtros y ordenamiento (memoizado)
  const filteredReviews = useMemo(() => {
    const reviews = query.data?.reviews ?? [];
    let result = [...reviews];

    // Aplicar filtro por deporte
    if (filters.sportId && filters.sportId.trim() !== "") {
      result = result.filter((review) =>
        review.details.reviewSports.some((rs: any) => rs.sportId === filters.sportId)
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

    return result;
  }, [query.data?.reviews, filters, sortBy]);

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
   * Limpia el cache y fuerza recarga desde Firebase
   */
  const clearCache = useCallback(async () => {
    console.log('[useSpotReviews] 🗑️ Clearing cache for spotId:', spotId);
    if (!isValidSpotId) return;
    
    // Invalidar todas las queries de reviews para este spot
    await queryClient.invalidateQueries({ 
      queryKey: ['spot', spotId, 'reviews'],
      exact: false // Invalida todas las variantes (diferentes limit/offset)
    });
    
    console.log('[useSpotReviews] ♻️ Cache cleared, triggering refetch...');
    // Forzar refetch inmediato
    await query.refetch();
  }, [spotId, isValidSpotId, queryClient, query]);

  // Si no hay spotId válido, retornar estado vacío sin usar la query
  if (!isValidSpotId) {
    return {
      reviews: [],
      allReviews: [],
      totalReviews: 0,
      usersData: new Map<string, User>(),
      loading: false,
      isFetching: false,
      error: null,
      filters,
      sortBy,
      updateFilters,
      resetFilters,
      setSortBy,
      refetch: async () => {},
      clearCache: async () => {},
    };
  }

  return {
    reviews: filteredReviews,
    allReviews: query.data?.reviews ?? [],
    totalReviews: query.data?.reviews?.length ?? 0,
    usersData: query.data?.users ?? new Map(),
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    filters,
    sortBy,
    updateFilters,
    resetFilters,
    setSortBy,
    refetch: query.refetch,
    clearCache,
  };
};
