import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Callout } from "react-native-maps";
import type { Spot } from "../../../../entities/spot/model/spot";

interface SpotMapCalloutProps {
  spot: Spot;
  onPress: (spot: Spot) => void;
  getSportName?: (sportId: string) => string;
}

/**
 * Callout que se muestra al tocar un marcador de spot en el mapa
 * 
 * Responsabilidades:
 * - Renderiza información resumida del spot en el callout
 * - Maneja el press para abrir más detalles
 */
export const SpotMapCallout: React.FC<SpotMapCalloutProps> = ({
  spot,
  onPress,
  getSportName,
}) => {
  return (
    <Callout onPress={() => onPress(spot)} tooltip>
      <Pressable
        onPress={() => onPress(spot)}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ width: 250 }}
      >
        {/* Imagen del spot */}
        {spot.details.media && spot.details.media.length > 0 ? (
          <Image
            source={{ uri: spot.details.media[0] }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-4xl">📍</Text>
          </View>
        )}

        {/* Información del spot */}
        <View className="p-3 gap-2">
          {/* Nombre */}
          <Text
            className="font-bold text-typography-900 text-base"
            numberOfLines={2}
          >
            {spot.details.name}
          </Text>

          {/* Rating */}
          {spot.details.overallRating !== undefined && (
            <View className="flex-row items-center gap-1">
              <Text className="text-yellow-500">⭐</Text>
              <Text className="text-typography-700 text-sm">
                {spot.details.overallRating.toFixed(1)}
              </Text>
              {spot.activity?.reviewsCount !== undefined && (
                <Text className="text-typography-500 text-sm">
                  ({spot.activity.reviewsCount})
                </Text>
              )}
            </View>
          )}

          {/* Deportes disponibles */}
          {spot.details.availableSports && spot.details.availableSports.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {spot.details.availableSports.slice(0, 3).map((sportId) => (
                <View
                  key={sportId}
                  className="bg-blue-100 px-2 py-1 rounded"
                >
                  <Text className="text-blue-700 text-xs font-medium">
                    {getSportName ? getSportName(sportId) : sportId}
                  </Text>
                </View>
              ))}
              {spot.details.availableSports.length > 3 && (
                <View className="bg-gray-100 px-2 py-1 rounded">
                  <Text className="text-gray-600 text-xs">
                    +{spot.details.availableSports.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Indicador de verificación */}
          {spot.metadata.isVerified && (
            <View className="flex-row items-center gap-1">
              <Text className="text-green-500">✓</Text>
              <Text className="text-green-600 text-xs font-medium">
                Verificado
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Callout>
  );
};
