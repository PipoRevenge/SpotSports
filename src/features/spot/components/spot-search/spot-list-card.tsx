import { RatingStar } from "@/src/components/commons/rating-start/rating-star";
import { Badge, BadgeIcon, BadgeText } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { HStack } from "@/src/components/ui/hstack";
import { CheckIcon } from "@/src/components/ui/icon";
import { Image } from "@/src/components/ui/image";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import React from "react";

interface SpotListCardProps {
  spot: Spot;
  onPress?: () => void;
  distance?: number; // Distancia en km
  showDistance?: boolean;
}

/**
 * Tarjeta de spot para vista de lista
 * Muestra información detallada en formato horizontal
 */
export const SpotListCard: React.FC<SpotListCardProps> = ({
  spot,
  onPress,
  distance,
  showDistance = true,
}) => {
  const mainImage = spot.details.media[0] || "https://via.placeholder.com/150";

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3 overflow-hidden border border-background-200">
        <HStack className="gap-3">
          {/* Imagen */}
          <Image
            source={{ uri: mainImage }}
            alt={spot.details.name}
            className="w-24 h-24"
            resizeMode="cover"
          />

          {/* Información */}
          <VStack className="flex-1 p-3 justify-between">
            {/* Nombre y badges */}
            <VStack className="gap-1">
              <HStack className="items-center gap-2">
                <Text className="font-semibold text-lg flex-1" numberOfLines={1}>
                  {spot.details.name}
                </Text>
                {spot.metadata.isVerified && (
                  <Badge
                    size="sm"
                    variant="solid"
                    action="success"
                  >
                    <BadgeIcon as={CheckIcon} />
                    <BadgeText>Verificado</BadgeText>
                  </Badge>
                )}
              </HStack>

              {/* Descripción */}
              <Text className="text-sm text-typography-500" numberOfLines={2}>
                {spot.details.description}
              </Text>
            </VStack>

            {/* Rating y distancia */}
            <HStack className="items-center justify-between mt-2">
              <RatingStar rating={spot.details.overallRating} />
              
              {showDistance && distance !== undefined && (
                <Text className="text-sm text-typography-500">
                  📍 {distance.toFixed(1)} km
                </Text>
              )}
            </HStack>

            {/* Deportes disponibles */}
            {spot.details.availableSports.length > 0 && (
              <HStack className="gap-1 mt-2 flex-wrap">
                {spot.details.availableSports.slice(0, 3).map((sportId) => (
                  <Badge
                    key={sportId}
                    size="sm"
                    variant="outline"
                    action="info"
                  >
                    <BadgeText>{sportId}</BadgeText>
                  </Badge>
                ))}
                {spot.details.availableSports.length > 3 && (
                  <Badge
                    size="sm"
                    variant="outline"
                    action="muted"
                  >
                    <BadgeText>+{spot.details.availableSports.length - 3}</BadgeText>
                  </Badge>
                )}
              </HStack>
            )}
          </VStack>
        </HStack>
      </Card>
    </Pressable>
  );
};
