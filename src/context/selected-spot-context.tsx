import { Review } from "@/src/entities/review/model/review";
import { SimpleSport } from "@/src/entities/sport/model/sport";
import { SportSpotRating, Spot } from "@/src/entities/spot/model/spot";
import { User } from "@/src/entities/user/model/user";
import { useSpotReviews } from "@/src/features/review/hooks/use-spot-reviews";
import {
  ReviewFilters,
  ReviewSortOptions,
} from "@/src/features/review/types/review-filter-types";
import { useSpotCounters } from "@/src/features/spot/hooks/use-spot-counters";
import { useSpotData } from "@/src/features/spot/hooks/use-spot-data";
import { useQueryClient } from "@/src/lib/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  /** Total de reviews sin filtrar (contador) */
  totalReviews: number;

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

  // ===== FILTERS & SORT =====
  /**
   * Opciones de ordenamiento actuales
   */
  sort: ReviewSortOptions;

  /**
   * Filtros actuales
   */
  filters: ReviewFilters;

  /**
   * Actualizar opciones de ordenamiento
   */
  updateSort: (sort: ReviewSortOptions) => void;

  /**
   * Actualizar filtros
   */
  updateFilters: (filters: Partial<ReviewFilters>) => void; // acepta partial para mergear

  // ===== ACTIONS =====
  /**
   * Selecciona un spot (lo carga si solo se pasa el ID)
   * @param spotOrId - Spot object o spotId string
   * @param shouldLoadReviews - Si debe cargar reviews automáticamente (default: true)
   */
  selectSpot: (
    spotOrId: Spot | string,
    shouldLoadReviews?: boolean,
  ) => Promise<void>;

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
   * Limpia el cache de reviews y fuerza recarga desde Firebase
   */
  clearReviewsCache: () => Promise<void>;

  /**
   * Refresca solo los contadores del spot (optimizado)
   */
  refreshSpotCounters: () => Promise<void>;

  /**
   * Limpia la selección
   */
  clearSelection: () => void;

  /**
   * Internal counter to force components to refresh discussions when a new one is created
   */
  discussionRefreshCount: number;
  /**
   * Bumps the discussion refresh counter to notify listeners a change occurred
   */
  bumpDiscussionRefresh: () => void;
}

const SelectedSpotContext = createContext<SelectedSpotContextValue | undefined>(
  undefined,
);

interface SelectedSpotProviderProps {
  children: React.ReactNode;
}

/**
 * Provider del contexto de Spot Seleccionado
 * Optimizado con React Query para carga progresiva
 */
export const SelectedSpotProvider: React.FC<SelectedSpotProviderProps> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  // ID del spot actual
  const [currentSpotId, setCurrentSpotId] = useState<string | undefined>(
    undefined,
  );
  const [shouldLoadReviews, setShouldLoadReviews] = useState(true);

  // Discussion refresh counter
  const [discussionRefreshCount, setDiscussionRefreshCount] =
    useState<number>(0);

  // Hook 1: Cargar datos del spot (progresivo: spot -> ratings -> sports)
  const {
    spot,
    sportRatings,
    availableSports,
    isLoading: loadingSpot,
    error: spotError,
    refetch: refetchSpot,
  } = useSpotData(currentSpotId);

  // Hook 2: Cargar reviews (solo si shouldLoadReviews es true)
  const spotIdForReviews = shouldLoadReviews ? currentSpotId : undefined;

  const {
    reviews,
    totalReviews,
    usersData,
    loading: loadingReviewsQuery,
    error: reviewsError,
    refetch: refetchReviews,
    clearCache: clearReviewsCache,
    filters: activeFilters,
    sort: activeSort,
    updateFilters,
    updateSort,
  } = useSpotReviews(spotIdForReviews);

  // Debug log para rastrear cambios de estado
  useEffect(() => {
    console.log(
      "[SelectedSpotContext] State changed - currentSpotId:",
      currentSpotId,
      "shouldLoadReviews:",
      shouldLoadReviews,
      "spotIdForReviews:",
      spotIdForReviews,
    );
  }, [currentSpotId, shouldLoadReviews, spotIdForReviews]);

  // Debug log para rastrear reviews cargadas
  useEffect(() => {
    console.log(
      "[SelectedSpotContext] Reviews updated - count:",
      reviews.length,
      "loading:",
      loadingReviewsQuery,
    );
  }, [reviews, loadingReviewsQuery]);

  // Hook 3: Cargar contadores (opcional, se puede activar después)
  const { refetch: refetchCounters } = useSpotCounters(currentSpotId);

  // Loading states combinados
  const loadingReviews = shouldLoadReviews ? loadingReviewsQuery : false;

  /**
   * Selecciona un spot (carga desde servidor si se pasa un ID)
   * shouldLoadReviewsFlag: Si se pasa false, no carga las reviews automáticamente
   */
  const selectSpot = useCallback(
    async (spotOrId: Spot | string, shouldLoadReviewsFlag: boolean = true) => {
      let spotId: string;

      // Si ya es un objeto Spot, solo actualizar el ID
      if (typeof spotOrId === "object") {
        spotId = spotOrId.id;
      } else {
        spotId = spotOrId;
      }

      console.log(
        "[SelectedSpotContext] selectSpot called - spotId:",
        spotId,
        "shouldLoadReviews:",
        shouldLoadReviewsFlag,
      );

      // Actualizar el flag primero para que esté listo cuando el spotId cambie
      setShouldLoadReviews(shouldLoadReviewsFlag);
      // Actualizar el ID del spot actual (esto activará los hooks)
      setCurrentSpotId(spotId);
    },
    [],
  );

  /**
   * Refresca todos los datos del spot actual
   */
  const refreshAll = useCallback(async () => {
    if (!currentSpotId) {
      console.warn("[SelectedSpotContext] No spot selected to refresh");
      return;
    }

    await Promise.all([refetchSpot(), refetchReviews(), refetchCounters()]);
  }, [currentSpotId, refetchSpot, refetchReviews, refetchCounters]);

  /**
   * Refresca solo el spot y sport ratings
   */
  const refreshSpotData = useCallback(async () => {
    if (!currentSpotId) {
      console.warn("[SelectedSpotContext] No spot selected to refresh");
      return;
    }

    await refetchSpot();
  }, [currentSpotId, refetchSpot]);

  /**
   * Refresca solo las reviews
   */
  const refreshReviews = useCallback(async () => {
    if (!currentSpotId) {
      console.warn("[SelectedSpotContext] No spot selected to refresh reviews");
      return;
    }

    await refetchReviews();
  }, [currentSpotId, refetchReviews]);

  /**
   * Refresca solo los contadores del spot (optimizado)
   */
  const refreshSpotCounters = useCallback(async () => {
    if (!currentSpotId) {
      console.warn(
        "[SelectedSpotContext] No spot selected to refresh counters",
      );
      return;
    }

    await refetchCounters();
  }, [currentSpotId, refetchCounters]);

  const bumpDiscussionRefresh = useCallback(() => {
    setDiscussionRefreshCount((prev) => prev + 1);
  }, []);

  /**
   * Limpia la selección actual
   */
  const clearSelection = useCallback(() => {
    setCurrentSpotId(undefined);
    setShouldLoadReviews(true);

    // Invalidar queries relacionadas
    if (currentSpotId) {
      // Remove spot-related queries (this will also remove spot->reviews queries)
      queryClient.removeQueries({ queryKey: ["spot", currentSpotId] });
    }
  }, [currentSpotId, queryClient]);

  const value: SelectedSpotContextValue = {
    selectedSpot: spot,
    sportRatings,
    availableSports,
    reviews,
    totalReviews,
    usersData,
    loadingSpot,
    loadingReviews,
    spotError: spotError ?? null,
    reviewsError: reviewsError ?? null,
    selectSpot,
    refreshAll,
    refreshSpotData,
    refreshReviews,
    clearReviewsCache,
    refreshSpotCounters,
    clearSelection,
    discussionRefreshCount,
    bumpDiscussionRefresh,
    sort: activeSort,
    filters: activeFilters,
    updateSort,
    updateFilters,
  };

  return (
    <SelectedSpotContext.Provider value={value}>
      {children}
    </SelectedSpotContext.Provider>
  );
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
