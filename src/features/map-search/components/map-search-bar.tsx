import { HStack } from "@/src/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/src/components/ui/input";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { Filter, Search } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { MapSearchBarProps } from "../types/map-types";

/**
 * Barra de búsqueda genérica para búsqueda en mapa
 * 
 * Características:
 * - Input de búsqueda con icono
 * - Botón de filtros con contador de filtros activos
 * - Acciones personalizadas (opcional)
 * - Estados disabled
 * 
 * @example
 * ```tsx
 * <MapSearchBar
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   onFilterPress={() => setShowFilters(true)}
 *   placeholder="Buscar spots..."
 *   filterCount={activeFiltersCount}
 * />
 * ```
 */
export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onFilterPress,
  onSearchPress,
  placeholder = "Buscar...",
  showFilterButton = true,
  filterCount = 0,
  disabled = false,
  leftIcon,
  rightActions,
}) => {
  return (
    <HStack className="w-full items-center gap-2 px-4 py-3 bg-white">
      {/* Icono izquierdo opcional */}
      {leftIcon && <View className="mr-1">{leftIcon}</View>}

      {/* Input de búsqueda */}
      <View className="flex-1">
        <Input
          variant="outline"
          size="md"
          isDisabled={disabled}
          className="bg-gray-50"
        >
          <InputSlot className="pl-3">
            <InputIcon as={Search} className="text-gray-500" />
          </InputSlot>
          <InputField
            placeholder={placeholder}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchPress}
            returnKeyType="search"
            editable={!disabled}
          />
        </Input>
      </View>

      {/* Botón de filtros */}
      {showFilterButton && onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          disabled={disabled}
          className={`
            relative p-3 rounded-lg border border-gray-300 bg-white
            ${disabled ? "opacity-50" : "active:bg-gray-100"}
          `}
        >
          <Filter size={20} color={filterCount > 0 ? "#3b82f6" : "#6b7280"} />
          
          {/* Badge con cantidad de filtros activos */}
          {filterCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {filterCount > 9 ? "9+" : filterCount}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Acciones personalizadas opcionales */}
      {rightActions && <View>{rightActions}</View>}
    </HStack>
  );
};
