import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { VStack } from "@/src/components/ui/vstack";
import React from "react";
import { MapSearchResultItemProps } from "../types/map-types";

/**
 * Componente genérico para item de resultado de búsqueda
 * 
 * Usa render props para permitir contenido completamente personalizado.
 * Proporciona la estructura base (card, press, selección) y delega
 * el contenido a la función renderContent.
 * 
 * @example
 * ```tsx
 * <MapSearchResultItem
 *   item={spot}
 *   distance={result.location.distance}
 *   onPress={(spot) => navigate(`/spot/${spot.id}`)}
 *   isSelected={selectedSpotId === spot.id}
 *   renderContent={(spot, distance) => (
 *     <HStack className="gap-3">
 *       <Image source={{ uri: spot.details.media[0] }} />
 *       <VStack>
 *         <Text>{spot.details.name}</Text>
 *         <Text>{distance} km</Text>
 *       </VStack>
 *     </HStack>
 *   )}
 *   renderActions={(spot) => (
 *     <Button onPress={() => addFavorite(spot)}>
 *       <Heart />
 *     </Button>
 *   )}
 * />
 * ```
 */
export const MapSearchResultItem = <T,>({
  item,
  distance,
  onPress,
  isSelected = false,
  renderContent,
  renderActions,
}: MapSearchResultItemProps<T>): React.ReactElement => {
  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`
        w-full bg-white rounded-lg shadow-sm border
        ${isSelected ? "border-blue-500 border-2" : "border-gray-200"}
        ${onPress ? "active:bg-gray-50" : ""}
        overflow-hidden
      `}
    >
      <VStack className="p-4">
        {/* Contenido personalizado */}
        <VStack className="flex-1">
          {renderContent(item, distance)}
        </VStack>

        {/* Acciones opcionales */}
        {renderActions && (
          <HStack className="pt-3 border-t border-gray-100 justify-end">
            {renderActions(item)}
          </HStack>
        )}
      </VStack>

      {/* Indicador de selección */}
      {isSelected && (
        <VStack className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      )}
    </Pressable>
  );
};
