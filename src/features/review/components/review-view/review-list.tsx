import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/src/components/ui/select";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Review } from "@/src/entities/review/model/review";
import { User } from "@/src/entities/user/model/user";
import { CommentWithUser } from "@/src/features/comment";
import { ChevronDown, Filter } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useReviewLoad } from "../../hooks/use-review-load";
import {
  REVIEW_SORT_OPTIONS,
  type ReviewSortValue,
  getReviewSortLabel,
} from "../../utils/review-constants";
import { ReviewFilterModal } from "../filters/review-filter-modal";
import { ReviewCard } from "./review-card";

/**
 * Props del componente ReviewList
 */
export interface ReviewListProps {
  reviews: Review[];
  spotId: string; // ID del spot (necesario para votos)
  loading?: boolean;
  isDeleting?: boolean; // Indica si se está eliminando una review
  error?: string | null;

  // Datos de usuarios (mapa de userId -> User)
  usersData?: Map<string, User>;

  // Filtros
  availableSports?: { id: string; name: string }[];
  selectedSportId?: string;
  onSportFilterChange?: (sportId: string) => void;

  // Funciones helpers
  getSportName?: (sportId: string) => string;

  // Ordenamiento
  sortBy: ReviewSortValue;
  onSortChange: (sort: ReviewSortValue) => void;

  // Interacciones
  onReply?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  onCreate?: () => void;
  onDelete?: (reviewId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onClearCache?: () => void; // Nueva prop para limpiar cache

  // Comment modal slots (propagated to ReviewCard)
  /** Slot for the reply modal - injected from app/ layer */
  commentModalSlot?: React.ReactNode;
  /** Callback when user wants to reply to a comment */
  onOpenReplyModal?: (comment: CommentWithUser, review: Review) => void;
  /** Callback when user wants to add a new comment to a review */
  onOpenNewCommentModal?: (review: Review) => void;

  // Personalización
  emptyMessage?: string;
  listHeaderComponent?: React.ReactElement | null;

  // Total de reviews sin filtrar (para saber si realmente hay 0 reviews en el spot)
  totalReviews?: number;

  // Deep-link support
  targetReviewId?: string;
  targetCommentId?: string;
  targetParentCommentId?: string;
  // Optional layout registration for deep-link precise scrolling
  registerLayout?: (id: string, node: any) => void;
}

// Opciones de ordenamiento ahora importadas desde review-constants.ts

/**
 * Componente ReviewList
 *
 * Lista de reviews con funcionalidades de:
 * - Filtrado por deporte
 * - Ordenamiento (reciente, antiguo, rating)
 * - Interacciones (like, dislike, responder)
 * - Estados de loading y error
 *
 * @example
 * ```tsx
 * <ReviewList
 *   reviews={reviews}
 *   spotId={spotId}
 *   usersData={usersMap}
 *   availableSports={spotSports}
 *   selectedSportId={filterSportId}
 *   onSportFilterChange={setFilterSportId}
 *   sortBy={sortBy}
 *   onSortChange={setSortBy}
 *   onReply={handleReply}
 * />
 * ```
 */
export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  spotId,
  loading = false,
  isDeleting = false,
  error = null,
  usersData,
  availableSports,
  selectedSportId = "",
  onSportFilterChange,
  getSportName,
  sortBy,
  onSortChange,
  onReply,
  onEdit,
  onCreate,
  onDelete,
  onNavigateToProfile,
  onClearCache,
  commentModalSlot,
  onOpenReplyModal,
  onOpenNewCommentModal,
  emptyMessage = "No reviews available",
  listHeaderComponent,
  totalReviews = 0,
  targetReviewId,
  targetCommentId,
  targetParentCommentId,
  registerLayout,
}) => {
  // Estado local para detectar si usuario tiene review
  const [hasUserReview, setHasUserReview] = useState(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const { review: userReview, loadingReview } = useReviewLoad(spotId);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Verificar si el usuario ya tiene una review
  useEffect(() => {
    setHasUserReview(!!userReview);
    setUserReviewId(userReview?.id ?? null);
  }, [userReview]);

  // Determinar si realmente no hay reviews en el spot (sin filtros)
  const hasNoReviewsAtAll = totalReviews === 0;
  // Determinar si hay reviews pero ninguna coincide con el filtro actual
  const hasNoMatchingReviews = !hasNoReviewsAtAll && reviews.length === 0;

  const activeFiltersCount = selectedSportId ? 1 : 0;

  /**
   * Estado de carga
   */
  if (loading || loadingReview) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Loading reviews...</Text>
      </VStack>
    );
  }

  /**
   * Estado de error
   */
  if (error) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-red-600 text-center font-semibold">
          ⚠️ Error loading reviews
        </Text>
        <Text className="pt-2 text-gray-600 text-center">{error}</Text>
      </VStack>
    );
  }

  /**
   * Estado vacío - Solo cuando realmente no hay reviews en el spot
   */
  if (hasNoReviewsAtAll) {
    return (
      <VStack className="gap-3">
        {/* Header adicional (ej: detalles del spot) */}
        {listHeaderComponent}

        {/* Filtros y contador de reviews */}
        <VStack className="gap-3 p-4">
          {/* Contador de reviews y botón de escribir */}
          <HStack className="justify-between items-center">
            <Text className="text-lg font-bold text-gray-900">0 Reviews</Text>
            <Button
              size="sm"
              className="bg-blue-600"
              onPress={() => {
                if (hasUserReview) {
                  if (onEdit && userReviewId) onEdit(userReviewId);
                  return;
                }
                if (onCreate) onCreate();
              }}
            >
              <ButtonText className="text-white font-semibold">
                {hasUserReview ? "Update Review" : "Write a Review"}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>

        {/* Mensaje vacío */}
        <VStack className="items-center justify-center p-8 h-auto">
          <Text className="text-gray-400 text-6xl p-4">💬</Text>
          <Text className="text-gray-600 text-center">{emptyMessage}</Text>
        </VStack>
      </VStack>
    );
  }

  /**
   * Lista de reviews (con o sin resultados de filtro)
   */
  return (
    <VStack className="gap-3 pt-3">
      {/* Header adicional (ej: detalles del spot) */}
      {listHeaderComponent}

      {/* Filtros y contador de reviews (botón filtro + select de orden) */}
      <VStack className="gap-2 pb-2 px-4">
        <HStack className="justify-between items-center">
          <Text className="text-lg font-bold text-gray-900">
            {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
          </Text>

          <HStack className="items-center gap-2">
            <View className="relative">
              <Button
                onPress={() => setIsFilterModalVisible(true)}
                variant="solid"
                action="default"
                size="sm"
                className="rounded-full p-2 bg-gray-100"
              >
                <ButtonIcon as={Filter} className="text-blue-600 h-5 w-5" />
              </Button>
              {activeFiltersCount > 0 ? (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">
                    {activeFiltersCount}
                  </Text>
                </View>
              ) : null}
            </View>

            <Select
              selectedValue={sortBy}
              onValueChange={(value) => onSortChange(value as ReviewSortValue)}
            >
              <SelectTrigger
                variant="outline"
                size="sm"
                className="flex-row items-center gap-2"
              >
                <SelectInput
                  placeholder="Sort by"
                  className="text-sm"
                  value={getReviewSortLabel(sortBy)}
                />
                <SelectIcon as={ChevronDown} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {REVIEW_SORT_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                if (hasUserReview) {
                  if (onEdit && userReviewId) onEdit(userReviewId);
                  return;
                }
                if (onCreate) onCreate();
              }}
            >
              <ButtonText className="font-semibold text-sm">
                {hasUserReview ? "✏️ Edit" : "➕ Add"}
              </ButtonText>
            </Button>
          </HStack>
        </HStack>
      </VStack>

      {/* Reviews o mensaje de sin resultados */}
      {hasNoMatchingReviews ? (
        <VStack className="items-center justify-center p-8">
          <Text className="text-gray-400 text-5xl pb-4">🔍</Text>
          <Text className="text-gray-600 text-center font-semibold">
            No reviews found with the applied filters
          </Text>
          <Text className="text-gray-500 text-center text-sm pt-2">
            Try changing filters to see more results
          </Text>
        </VStack>
      ) : (
        <VStack className="gap-0">
          {reviews.map((review, index) => {
            const user = usersData?.get(review.metadata.createdBy);

            return (
              <React.Fragment key={review.id}>
                <ReviewCard
                  review={review}
                  spotId={spotId}
                  user={user}
                  getSportName={getSportName}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onNavigateToProfile={onNavigateToProfile}
                  commentModalSlot={commentModalSlot}
                  onOpenReplyModal={onOpenReplyModal}
                  onOpenNewCommentModal={onOpenNewCommentModal}
                  highlightCommentId={
                    review.id === targetReviewId ? targetCommentId : undefined
                  }
                  autoExpandComments={
                    review.id === targetReviewId && !!targetCommentId
                  }
                  parentCommentId={
                    review.id === targetReviewId
                      ? targetParentCommentId
                      : undefined
                  }
                  registerLayout={registerLayout}
                />
                {index < reviews.length - 1 && (
                  <View className="px-6">
                    <View className="h-px bg-gray-200 py-4" />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </VStack>
      )}

      {/* Espacio al final */}
      <View className="h-4" />

      {/* Overlay de carga durante eliminación */}
      {isDeleting && (
        <View className="absolute inset-0 bg-black/30 justify-center items-center">
          <View className="bg-white p-6 rounded-lg items-center gap-3">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="text-gray-700 font-medium">
              Deleting review...
            </Text>
          </View>
        </View>
      )}

      <ReviewFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        selectedSportId={selectedSportId}
        onApply={(sportId) => onSportFilterChange?.(sportId)}
        onClear={() => onSportFilterChange?.("")}
        availableSports={availableSports}
      />
    </VStack>
  );
};
