import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { ScrollView } from "@/src/components/ui/scroll-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React from "react";
import { SportCategory } from "../../types/sport-types";
import { SPORT_CATEGORIES_LIST, SPORT_PLACEHOLDERS } from "../../utils/sport-constants";

interface CategoryFilterProps {
  selectedCategory?: SportCategory;
  onCategoryChange: (category?: SportCategory) => void;
  showLabel?: boolean;
}

/**
 * Componente para filtrar deportes por categoría
 * Solo maneja la UI del filtro, la lógica está en los hooks
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  showLabel = true
}) => {
  /**
   * Maneja la selección de categoría
   */
  const handleCategoryPress = (category: SportCategory) => {
    // Si ya está seleccionada, deseleccionar
    if (selectedCategory === category) {
      onCategoryChange(undefined);
    } else {
      onCategoryChange(category);
    }
  };

  /**
   * Limpia el filtro de categoría
   */
  const handleClearFilter = () => {
    onCategoryChange(undefined);
  };

  return (
    <VStack space="sm">
      {showLabel && (
        <HStack className="items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">
            {SPORT_PLACEHOLDERS.FILTER_CATEGORY}
          </Text>
          {selectedCategory && (
            <Pressable onPress={handleClearFilter}>
              <Text className="text-sm text-blue-600">Limpiar</Text>
            </Pressable>
          )}
        </HStack>
      )}
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space="xs" className="py-1">
          {SPORT_CATEGORIES_LIST.map((category) => {
            const isSelected = selectedCategory === category.value;
            
            return (
              <Pressable
                key={category.value}
                onPress={() => handleCategoryPress(category.value)}
                className={`px-3 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>
    </VStack>
  );
};