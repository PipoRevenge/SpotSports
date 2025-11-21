import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from "@/src/components/ui/select";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Review } from "@/src/entities/review/model/review";
import { User } from "@/src/entities/user/model/user";
import { ChevronDown } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useReviewLoad } from "../../hooks/use-review-load";
import { ReviewSortOption } from "../../hooks/use-spot-reviews";
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
  sortBy: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
  
  // Interacciones
  onReply?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  onCreate?: () => void;
  onDelete?: (reviewId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  
  // Personalización
  emptyMessage?: string;
  listHeaderComponent?: React.ReactElement | null;
  
  // Total de reviews sin filtrar (para saber si realmente hay 0 reviews en el spot)
  totalReviews?: number;
}

/**
 * Opciones de ordenamiento con etiquetas
 */
const SORT_OPTIONS: { value: ReviewSortOption; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "rating-high", label: "Mayor calificación" },
  { value: "rating-low", label: "Menor calificación" },
];

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
  emptyMessage = "No hay reviews disponibles",
  listHeaderComponent,
  totalReviews = 0,
}) => {
  // Estado local para detectar si usuario tiene review
  const [hasUserReview, setHasUserReview] = useState(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const { loadReview } = useReviewLoad();
  
  // Verificar si el usuario ya tiene una review (SOLO una vez al montar)
  useEffect(() => {
    let mounted = true;
    const checkUserReview = async () => {
      const existingReview = await loadReview(spotId);
      if (mounted) {
        setHasUserReview(!!existingReview);
        setUserReviewId(existingReview?.id ?? null);
      }
    };
    checkUserReview();
    
    return () => { mounted = false; };
  }, []); // Solo en mount, sin spotId ni loadReview

  // Determinar si realmente no hay reviews en el spot (sin filtros)
  const hasNoReviewsAtAll = totalReviews === 0;
  // Determinar si hay reviews pero ninguna coincide con el filtro actual
  const hasNoMatchingReviews = !hasNoReviewsAtAll && reviews.length === 0;

  /**
   * Estado de carga
   */
  if (loading) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Cargando reviews...</Text>
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
          ⚠️ Error al cargar reviews
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
        <VStack className="gap-3 px-6 pb-4">
          {/* Contador de reviews y botón de escribir */}
          <HStack className="justify-between items-center">
            <Text className="text-lg font-bold text-gray-900">
              0 Reviews
            </Text>
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
                {hasUserReview ? "Actualizar Review" : "Escribir Review"}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>

        {/* Mensaje vacío */}
        <VStack className="items-center justify-center p-8">
          <Text className="text-gray-400 text-6xl pb-4">💬</Text>
          <Text className="text-gray-600 text-center">{emptyMessage}</Text>
        </VStack>
      </VStack>
    );
  }

  /**
   * Lista de reviews (con o sin resultados de filtro)
   */
  return (
    <VStack className="gap-3">
      {/* Header adicional (ej: detalles del spot) */}
      {listHeaderComponent}

      {/* Filtros y contador de reviews */}
      <VStack className="gap-3 px-6 pb-4">
        {/* Contador de reviews y botón de escribir */}
        <HStack className="justify-between items-center">
          <Text className="text-lg font-bold text-gray-900">
            {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
          </Text>
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
              {hasUserReview ? "Actualizar Review" : "Escribir Review"}
            </ButtonText>
          </Button>
        </HStack>

        {/* Filtros y ordenamiento */}
        <HStack className="gap-2 flex-wrap items-center">
          {/* Filtro por deporte - Selector simple */}
          {availableSports && availableSports.length > 0 && (
            <Select
              selectedValue={selectedSportId}
              onValueChange={(value) => onSportFilterChange?.(value)}
            >
              <SelectTrigger variant="outline" size="sm" className="min-w-[160px]">
                <SelectInput placeholder="Todos los deportes" />
                <SelectIcon className="pr-3" as={ChevronDown} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem label="Todos los deportes" value="" />
                  {availableSports.map((sport) => (
                    <SelectItem key={sport.id} label={sport.name} value={sport.id} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          )}

          {/* Ordenamiento */}
          <Select
            selectedValue={sortBy}
            onValueChange={(value) => onSortChange(value as ReviewSortOption)}
          >
            <SelectTrigger variant="outline" size="sm" className="min-w-[160px]">
              <SelectInput placeholder="Ordenar por" />
              <SelectIcon className="pr-3" as={ChevronDown} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} label={option.label} value={option.value} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </HStack>
      </VStack>

      {/* Reviews o mensaje de sin resultados */}
      {hasNoMatchingReviews ? (
        <VStack className="items-center justify-center p-8">
          <Text className="text-gray-400 text-5xl pb-4">🔍</Text>
          <Text className="text-gray-600 text-center font-semibold">
            No se encontraron reviews con los filtros aplicados
          </Text>
          <Text className="text-gray-500 text-center text-sm pt-2">
            Intenta cambiar los filtros para ver más resultados
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
            <Text className="text-gray-700 font-medium">Eliminando review...</Text>
          </View>
        </View>
      )}
    </VStack>
  );
};
