import { reviewRepository, userRepository } from "@/src/api/repositories";
import { useUser } from '@/src/context/user-context';
import { User } from "@/src/entities/user/model/user";
import { ReviewFilters, ReviewSortOptions } from '@/src/features/review/types/review-filter-types';
import { useQuery, useQueryClient } from "@/src/lib/react-query";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook optimizado para obtener y gestionar las reviews de un spot con React Query
 * 
 * Características:
 * - Usa React Query para cache y optimización
 * - Permite filtrar por deporte, rating, y usuario
 * - Permite ordenar por varios criterios incluyendo votos
 * - Soporte para "createdByMe" filter que prioriza contenido del usuario
 * - Cache automático de 2 minutos
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
  const { user } = useUser();
  const userId = user?.id;
  
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [sort, setSort] = useState<ReviewSortOptions>({ field: 'newest' });

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
    queryKey: ['spot', spotId, 'reviews', filters, sort, userId, limit, offset],
    // CRÍTICO: enabled debe ser false cuando no hay spotId válido
    enabled: isValidSpotId,
    staleTime: 2 * 60_000, // 2 minutos
    gcTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    // Solo definimos queryFn cuando hay un spotId válido
    queryFn: isValidSpotId ? async () => {
      console.log('[useSpotReviews] 🔥 Calling repository with filters:', filters, 'sort:', sort);
      
      // Cargar reviews usando el nuevo método getReviews con filtros
      const reviews = await reviewRepository.getReviews({
        spotId: spotId!,
        filters,
        sort,
        userId,
        limit,
        offset
      });
      
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

  /**
   * Actualiza los filtros
   */
  const updateFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Actualiza el ordenamiento
   */
  const updateSort = useCallback((newSort: ReviewSortOptions) => {
    setSort(newSort);
  }, []);

  /**
   * Resetea los filtros
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Limpia el cache de React Query para este spot
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

  // Si spotId no es válido, retornar estado vacío inmediatamente
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
      sort,
      updateFilters,
      updateSort,
      resetFilters,
      refetch: async () => {},
      clearCache: async () => {},
    };
  }

  return {
    reviews: query.data?.reviews ?? [],
    allReviews: query.data?.reviews ?? [],
    totalReviews: query.data?.reviews?.length ?? 0,
    usersData: query.data?.users ?? new Map(),
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    filters,
    sort,
    updateFilters,
    updateSort,
    resetFilters,
    refetch: query.refetch,
    clearCache,
  };
};
