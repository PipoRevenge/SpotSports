import { reviewRepository, sportRepository, spotRepository, userRepository } from "@/src/api/repositories";
import { Review } from "@/src/entities/review/model/review";
import { SportSpotRating, Spot } from "@/src/entities/spot/model/spot";
import { User } from "@/src/entities/user/model/user";
import { SimpleSport } from "@/src/features/review/types/review-types";
import React, { createContext, useCallback, useContext, useState } from "react";

/**
 * Contexto para gestionar el spot seleccionado actualmente
 * Siguiendo el patrón bullet-proof-react para mantener el estado sincronizado
 * entre diferentes vistas (mapa, página de detalles, modales)
 * 
 * Incluye:
 * - Datos del spot seleccionado
 * - Métricas de deportes (sport ratings)
 * - Reviews del spot
 * - Datos de usuarios que hicieron reviews
 */

interface SelectedSpotContextValue {
  // ===== SPOT DATA =====
  /**
   * Spot actualmente seleccionado/visualizado
   */
  selectedSpot: Spot | null;
  
  /**
   * Métricas de deportes del spot seleccionado
   */
  sportRatings: SportSpotRating[];
  
  /**
   * Deportes disponibles en el spot (con nombres)
   */
  availableSports: SimpleSport[];
  
  /**
   * Reviews del spot seleccionado
   */
  reviews: Review[];
  
  /**
   * Mapa de usuarios (userId -> User) que hicieron reviews
   */
  usersData: Map<string, User>;
  
  // ===== LOADING STATES =====
  /**
   * Estado de carga del spot
   */
  loadingSpot: boolean;
  
  /**
   * Estado de carga de las reviews
   */
  loadingReviews: boolean;
  
  // ===== ERRORS =====
  /**
   * Error al cargar el spot
   */
  spotError: string | null;
  
  /**
   * Error al cargar las reviews
   */
  reviewsError: string | null;
  
  // ===== ACTIONS =====
  /**
   * Selecciona un spot (lo carga si solo se pasa el ID)
   * @param spotOrId - Spot object o spotId string
   * @param shouldLoadReviews - Si debe cargar reviews automáticamente (default: true)
   */
  selectSpot: (spotOrId: Spot | string, shouldLoadReviews?: boolean) => Promise<void>;
  
  /**
   * Refresca todos los datos del spot actual desde el servidor
   * (spot, sport ratings, y reviews)
   */
  refreshAll: () => Promise<void>;
  
  /**
   * Refresca solo el spot y sport ratings
   */
  refreshSpotData: () => Promise<void>;
  
  /**
   * Refresca solo las reviews
   */
  refreshReviews: () => Promise<void>;
  
  /**
   * Refresca solo los contadores del spot (optimizado)
   */
  refreshSpotCounters: () => Promise<void>;
  
  /**
   * Limpia la selección
   */
  clearSelection: () => void;
}

const SelectedSpotContext = createContext<SelectedSpotContextValue | undefined>(undefined);

interface SelectedSpotProviderProps {
  children: React.ReactNode;
}

/**
 * Provider del contexto de Spot Seleccionado
 * Debe envolver la aplicación o las rutas que necesiten acceder al spot seleccionado
 */
export const SelectedSpotProvider: React.FC<SelectedSpotProviderProps> = ({ children }) => {
  // Spot data
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [sportRatings, setSportRatings] = useState<SportSpotRating[]>([]);
  const [availableSports, setAvailableSports] = useState<SimpleSport[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [usersData, setUsersData] = useState<Map<string, User>>(new Map());
  
  // Loading states
  const [loadingSpot, setLoadingSpot] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Errors
  const [spotError, setSpotError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  /**
   * Carga las reviews de un spot y los datos de usuarios
   */
  const loadReviewsData = useCallback(async (spotId: string) => {
    setLoadingReviews(true);
    setReviewsError(null);
    
    try {
      const fetchedReviews = await reviewRepository.getReviewsBySpot(spotId, 50, 0);
      setReviews(fetchedReviews);
      
      // Cargar datos de usuarios (userId está en metadata.createdBy)
      const userIds = [...new Set(fetchedReviews.map(r => r.metadata.createdBy))];
      const usersMap = new Map<string, User>();
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await userRepository.getUserById(userId);
            if (user) {
              usersMap.set(userId, user);
            }
          } catch (err) {
            console.warn(`[SelectedSpotContext] Failed to load user ${userId}:`, err);
          }
        })
      );
      
      setUsersData(usersMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load reviews";
      setReviewsError(errorMessage);
      console.error("[SelectedSpotContext] Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  /**
   * Carga el spot y sus sport ratings
   */
  const loadSpotData = useCallback(async (spotId: string) => {
    setLoadingSpot(true);
    setSpotError(null);
    
    try {
      const spot = await spotRepository.getSpotById(spotId);
      if (!spot) {
        throw new Error("Spot not found");
      }
      
      const [ratings, sportsWithNames] = await Promise.all([
        spotRepository.getSportRatings(spotId),
        // Obtener deportes disponibles con detalles completos
        spot.details.availableSports.length > 0
          ? sportRepository.getSportsByIds(spot.details.availableSports).then(sports => 
              sports.map(sport => ({
                id: sport.id,
                name: sport.details.name,
                description: sport.details.description,
                category: sport.details.category
              }))
            )
          : Promise.resolve([])
      ]);
      
      setSelectedSpot(spot);
      setSportRatings(ratings);
      setAvailableSports(sportsWithNames);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load spot";
      setSpotError(errorMessage);
      console.error("[SelectedSpotContext] Error loading spot:", err);
      throw err;
    } finally {
      setLoadingSpot(false);
    }
  }, []);

  /**
   * Selecciona un spot (carga desde servidor si se pasa un ID)
   * shouldLoadReviews: Si se pasa false, no carga las reviews automáticamente (para modal)
   */
  const selectSpot = useCallback(async (spotOrId: Spot | string, shouldLoadReviews: boolean = true) => {
    setSpotError(null);
    setReviewsError(null);
    
    let spotId: string;
    
    // Si ya es un objeto Spot, usarlo directamente
    if (typeof spotOrId === "object") {
      setSelectedSpot(spotOrId);
      spotId = spotOrId.id;
      
      // No cargar nada más si es un objeto (viene del modal del mapa)
      if (!shouldLoadReviews) {
        return;
      }
    } else {
      // Si es un ID, cargar desde el servidor
      spotId = spotOrId;
      await loadSpotData(spotId);
    }
    
    // Cargar reviews si se requiere
    if (shouldLoadReviews) {
      await loadReviewsData(spotId);
    }
  }, [loadSpotData, loadReviewsData]);

  /**
   * Refresca todos los datos del spot actual
   */
  const refreshAll = useCallback(async () => {
    if (!selectedSpot) {
      console.warn("[SelectedSpotContext] No spot selected to refresh");
      return;
    }
    
    await Promise.all([
      loadSpotData(selectedSpot.id),
      loadReviewsData(selectedSpot.id)
    ]);
  }, [selectedSpot, loadSpotData, loadReviewsData]);

  /**
   * Refresca solo el spot y sport ratings
   */
  const refreshSpotData = useCallback(async () => {
    if (!selectedSpot) {
      console.warn("[SelectedSpotContext] No spot selected to refresh");
      return;
    }
    
    await loadSpotData(selectedSpot.id);
  }, [selectedSpot, loadSpotData]);

  /**
   * Refresca solo las reviews
   */
  const refreshReviews = useCallback(async () => {
    if (!selectedSpot) {
      console.warn("[SelectedSpotContext] No spot selected to refresh reviews");
      return;
    }
    
    await loadReviewsData(selectedSpot.id);
  }, [selectedSpot, loadReviewsData]);

  /**
   * Refresca solo los contadores del spot (optimizado)
   */
  const refreshSpotCounters = useCallback(async () => {
    if (!selectedSpot) {
      console.warn("[SelectedSpotContext] No spot selected to refresh counters");
      return;
    }
    
    try {
      const counters = await spotRepository.getSpotCounters(selectedSpot.id);
      if (counters) {
        // Solo actualizar los contadores del spot actual
        setSelectedSpot(prev => prev ? {
          ...prev,
          activity: {
            ...prev.activity,
            favoritesCount: counters.favoritesCount,
            visitedCount: counters.visitedCount,
            wantToVisitCount: counters.wantToVisitCount,
            reviewsCount: counters.reviewsCount,
          }
        } : null);
      }
    } catch (err) {
      console.error("[SelectedSpotContext] Error refreshing spot counters:", err);
    }
  }, [selectedSpot]);

  /**
   * Limpia la selección actual
   */
  const clearSelection = useCallback(() => {
    setSelectedSpot(null);
    setSportRatings([]);
    setAvailableSports([]);
    setReviews([]);
    setUsersData(new Map());
    setSpotError(null);
    setReviewsError(null);
  }, []);

  const value: SelectedSpotContextValue = {
    selectedSpot,
    sportRatings,
    availableSports,
    reviews,
    usersData,
    loadingSpot,
    loadingReviews,
    spotError,
    reviewsError,
    selectSpot,
    refreshAll,
    refreshSpotData,
    refreshReviews,
    refreshSpotCounters,
    clearSelection,
  };

  return <SelectedSpotContext.Provider value={value}>{children}</SelectedSpotContext.Provider>;
};

/**
 * Hook para usar el contexto de Spot Seleccionado
 * Lanza un error si se usa fuera del SelectedSpotProvider
 */
export const useSelectedSpot = (): SelectedSpotContextValue => {
  const context = useContext(SelectedSpotContext);
  if (!context) {
    throw new Error("useSelectedSpot must be used within SelectedSpotProvider");
  }
  return context;
};
