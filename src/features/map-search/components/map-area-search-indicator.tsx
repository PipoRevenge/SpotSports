import React from "react";
import { Text, View } from "react-native";
import { HStack } from "../../../components/ui/hstack";
import { VStack } from "../../../components/ui/vstack";

interface MapAreaSearchIndicatorProps {
  searchLocation: { latitude: number; longitude: number } | undefined;
  searchRadius: number | undefined;
}

/**
 * Indicador visual que muestra cuando se está buscando en un área específica del mapa
 * 
 * Responsabilidades:
 * - Muestra información sobre el área de búsqueda activa
 * - Indica visualmente que la búsqueda está limitada a una región
 */
export const MapAreaSearchIndicator: React.FC<MapAreaSearchIndicatorProps> = ({
  searchLocation,
  searchRadius,
}) => {
  if (!searchLocation || !searchRadius) {
    return null;
  }

  return (
    <View className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-md">
      <HStack className="items-center gap-2">
        <View className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <VStack>
          <Text className="text-xs font-semibold text-gray-700">
            Buscando en esta área
          </Text>
          <Text className="text-xs text-gray-500">
            Radio: {searchRadius.toFixed(1)} km
          </Text>
        </VStack>
      </HStack>
    </View>
  );
};
