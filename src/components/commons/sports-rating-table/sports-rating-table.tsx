import { RatingDifficulty } from "@/src/components/commons/rating/rating-difficulty";
import { RatingStars } from "@/src/components/commons/rating/rating-stars";
import SingleStar from "@/src/components/commons/rating/single-star";
import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
} from "@/src/components/ui/popover";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { ChevronDown, ChevronUp, InfoIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

/**
 * Interfaz para un deporte con rating y dificultad
 */
export interface SportRatingData {
  sportId: string;
  sportName: string;
  sportDescription?: string;
  sportComment?: string; // Comentario específico del deporte (para reviews)
  rating?: number;
  difficulty: number;
}

/**
 * Props del componente SportsRatingTable
 */
export interface SportsRatingTableProps {
  /**
   * Lista de deportes con sus ratings y dificultades
   */
  sports: SportRatingData[];

  /**
   * Variante de visualización
   * @default "full" - tabla completa con todos los detalles
   * "compact" - versión simplificada sin popover de info
   * "expandable" - con filas expandibles para comentarios/descripciones
   */
  variant?: "full" | "compact" | "expandable";

  /**
   * Mostrar header de tabla
   * @default true
   */
  showHeader?: boolean;
  /**
   * Mostrar el icono de info/popover en la fila deportiva (solo en variante full)
   * @default true
   */
  showInfoIcon?: boolean;

  /**
   * Tamaño de los componentes
   * @default "sm"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Texto personalizado para columnas
   */
  labels?: {
    sport?: string;
    difficulty?: string;
    rating?: string;
  };

  /**
   * Mostrar descripción o comentario en fila expandible
   * @default "description" - muestra sportDescription
   * "comment" - muestra sportComment
   */
  expandableContent?: "description" | "comment";
}

/**
 * Componente reutilizable para mostrar tabla de deportes con rating y dificultad
 *
 * @example
 * ```tsx
 * <SportsRatingTable
 *   sports={[
 *     { sportId: "1", sportName: "Basketball", rating: 4.5, difficulty: 6.5 }
 *   ]}
 *   variant="full"
 * />
 * ```
 */
export const SportsRatingTable: React.FC<SportsRatingTableProps> = ({
  sports,
  variant = "full",
  showHeader = true,
  size = "sm",
  labels = {},
  expandableContent = "description",
  showInfoIcon = true,
}) => {
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const togglePopover = (index: number) => {
    setOpenPopoverIndex(openPopoverIndex === index ? null : index);
  };

  const toggleExpanded = (index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const {
    sport: sportLabel = "Deporte",
    difficulty: difficultyLabel = "Dificultad",
    rating: ratingLabel = "Rating",
  } = labels;

  return (
    <View className="w-full">
      {/* Header */}
      {/* Header */}
      {showHeader && (
        <HStack className="bg-gray-50 px-2 py-2 border-b border-gray-200">
          <View className="flex-1 min-w-[80px]">
            <Text className="text-xs font-semibold text-gray-600">
              {sportLabel}
            </Text>
          </View>
          <View
            className={`flex-shrink-0 ${
              variant === "compact" ? "w-20" : "w-32"
            }`}
          >
            <Text className="text-xs font-semibold text-gray-600 text-center">
              {ratingLabel}
            </Text>
          </View>
          <View
            className={`flex-shrink-0 ${
              variant === "compact" ? "w-20" : "w-24"
            }`}
          >
            <Text className="text-xs font-semibold text-gray-600 text-center">
              {difficultyLabel}
            </Text>
          </View>
        </HStack>
      )}

      {/* Filas de deportes */}
      {sports.map((sport, index) => {
        const isExpanded = expandedRows.has(index);
        const hasExpandableContent =
          Boolean(expandableContent) &&
          ((expandableContent === "description" && sport.sportDescription) ||
            (expandableContent === "comment" && sport.sportComment));
        const contentToShow =
          expandableContent === "description"
            ? sport.sportDescription
            : sport.sportComment;

        return (
          <VStack key={sport.sportId}>
            {/* Fila principal */}
            <HStack
              className={`px-2 py-2.5 ${
                !isExpanded && index < sports.length - 1
                  ? "border-b border-gray-300"
                  : ""
              }`}
            >
              {/* Columna de nombre del deporte */}
              <HStack
                className="flex-1 items-center gap-1 pr-1 min-w-[80px]"
                style={{ minWidth: 0 }}
              >
                {/* Botón de expandir (solo en variant expandable) */}
                {hasExpandableContent && (
                  <Pressable
                    onPress={() => toggleExpanded(index)}
                    className="p-1 flex-shrink-0"
                  >
                    <Icon
                      as={isExpanded ? ChevronUp : ChevronDown}
                      className="text-gray-600 w-4 h-4"
                    />
                  </Pressable>
                )}

                <Text
                  className="text-sm text-gray-800 font-medium flex-shrink"
                  numberOfLines={2}
                >
                  {sport.sportName}
                </Text>

                {/* Info button (solo en variant full sin expandable) */}
                {variant === "full" &&
                  sport.sportDescription &&
                  showInfoIcon && (
                    <Popover
                      isOpen={openPopoverIndex === index}
                      onClose={() => setOpenPopoverIndex(null)}
                      trigger={(triggerProps) => (
                        <Pressable
                          {...triggerProps}
                          onPress={() => togglePopover(index)}
                          className="p-1 flex-shrink-0"
                        >
                          <Icon
                            as={InfoIcon}
                            className="text-blue-600 w-4 h-4"
                          />
                        </Pressable>
                      )}
                      placement="bottom"
                    >
                      <PopoverContent className="w-56">
                        <PopoverArrow />
                        <PopoverHeader>
                          <Text className="text-base font-bold">
                            {sport.sportName}
                          </Text>
                        </PopoverHeader>
                        <PopoverBody>
                          <Text className="text-gray-600">
                            {sport.sportDescription ||
                              "No description available"}
                          </Text>
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  )}
              </HStack>

              {/* Columna de rating */}
              <View
                className={`${
                  variant === "compact" ? "w-20" : "w-32"
                } items-center justify-center flex-shrink-0`}
              >
                {sport.rating !== undefined ? (
                  variant === "compact" ? (
                    <HStack className="items-center justify-center">
                      <SingleStar
                        fillLevel={Math.max(
                          0,
                          Math.min(1, (sport.rating ?? 0) / 5)
                        )}
                        size={14}
                      />
                      <Text className="text-xs text-gray-700 pl-1">
                        {(sport.rating ?? 0).toFixed(1)}
                      </Text>
                    </HStack>
                  ) : (
                    <RatingStars
                      rating={sport.rating}
                      maxStars={5}
                      size={14}
                      showValue={true}
                      disabled={true}
                    />
                  )
                ) : (
                  <Text className="text-xs text-gray-400">N/A</Text>
                )}
              </View>

              {/* Columna de dificultad */}
              <View
                className={`${
                  variant === "compact" ? "w-16" : "w-24"
                } items-center justify-center flex-shrink-0`}
              >
                {variant === "compact" ? (
                  <RatingDifficulty
                    difficulty={sport.difficulty}
                    variant="badge"
                    size={size}
                    showValue={true}
                    showLabel={false}
                  />
                ) : (
                  <RatingDifficulty
                    difficulty={sport.difficulty}
                    variant="badge"
                    size={size}
                    showValue={true}
                    showLabel={true}
                  />
                )}
              </View>
            </HStack>

            {/* Fila expandible con comentario/descripción */}
            {hasExpandableContent && isExpanded && (
              <View
                className={`px-3 py-3 bg-gray-50 ${
                  index < sports.length - 1 ? "border-b border-gray-300" : ""
                }`}
              >
                <Text className="text-sm text-gray-700 leading-5">
                  {contentToShow}
                </Text>
              </View>
            )}
          </VStack>
        );
      })}
    </View>
  );
};
