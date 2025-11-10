import React from "react";
import { Callout } from "react-native-maps";
import type { CustomCalloutProps } from "./types";

/**
 * Componente de callout genérico para marcadores de mapa
 * 
 * Abstrae el Callout de react-native-maps y permite renderizado personalizado
 * mediante render props pattern.
 * 
 * Responsabilidades:
 * - Proporcionar una interfaz consistente para callouts
 * - Soportar renderizado personalizado del contenido
 * - Manejar eventos de press
 * 
 * @example
 * ```tsx
 * <MapCallout
 *   data={spot}
 *   tooltip={true}
 *   onPress={(spot) => navigate(`/spot/${spot.id}`)}
 *   renderContent={(spot) => (
 *     <View className="bg-white p-3 rounded-lg">
 *       <Text>{spot.name}</Text>
 *     </View>
 *   )}
 * />
 * ```
 */
export const MapCallout = <T,>({
  data,
  onPress,
  tooltip = false,
  renderContent,
}: CustomCalloutProps<T>): React.ReactElement => {
  const handlePress = () => {
    if (onPress) {
      onPress(data);
    }
  };

  return (
    <Callout onPress={handlePress} tooltip={tooltip}>
      {renderContent(data)}
    </Callout>
  );
};

MapCallout.displayName = "MapCallout";
