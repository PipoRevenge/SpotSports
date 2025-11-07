import { HStack } from "@/src/components/ui/hstack";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/src/components/ui/slider";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React, { useState } from "react";
import { RATING_CONFIG } from "./types";

interface RatingFilterProps {
  minRating: number;
  onRatingChange: (rating: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

/**
 * Componente de filtro por rating mínimo
 * Slider para seleccionar rating de 0 a 5 estrellas
 */
export const RatingFilter: React.FC<RatingFilterProps> = ({
  minRating,
  onRatingChange,
  minValue = RATING_CONFIG.MIN,
  maxValue = RATING_CONFIG.MAX,
  step = RATING_CONFIG.STEP,
}) => {
  // Estado local para mostrar el valor mientras se arrastra
  const [localRating, setLocalRating] = useState(minRating);

  // Actualizar el estado local cuando cambie el prop
  React.useEffect(() => {
    setLocalRating(minRating);
  }, [minRating]);

  return (
    <VStack space="sm">
      <HStack className="justify-between items-center">
        <Text className="font-semibold text-typography-900">
          Rating mínimo
        </Text>
        <HStack className="items-center gap-1">
          <Text className="text-primary-600 font-medium">
            {localRating.toFixed(1)}
          </Text>
          <Text className="text-yellow-500">⭐</Text>
        </HStack>
      </HStack>

      <Slider
        value={localRating}
        onChange={(value) => {
          // Solo actualizar el estado local mientras se arrastra
          setLocalRating(value);
        }}
        onChangeEnd={(value) => {
          // Aplicar el cambio cuando el usuario suelta el slider
          onRatingChange(value);
        }}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>

      <HStack className="justify-between">
        <Text className="text-xs text-typography-500">
          {minValue.toFixed(1)}
        </Text>
        <Text className="text-xs text-typography-500">
          {maxValue.toFixed(1)}
        </Text>
      </HStack>
    </VStack>
  );
};
