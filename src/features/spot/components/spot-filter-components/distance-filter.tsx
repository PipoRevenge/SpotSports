import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "@/src/components/ui/checkbox";
import { HStack } from "@/src/components/ui/hstack";
import { CheckIcon } from "@/src/components/ui/icon";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/src/components/ui/slider";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React, { useState } from "react";
import { DISTANCE_CONFIG } from "../../types/spot-types";

interface DistanceFilterProps {
  maxDistance?: number;
  onDistanceChange: (distance: number | undefined) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

/**
 * Componente de filtro por distancia máxima
 * Slider para seleccionar distancia en kilómetros con opción de activar/desactivar
 */
export const DistanceFilter: React.FC<DistanceFilterProps> = ({
  maxDistance,
  onDistanceChange,
  minValue = DISTANCE_CONFIG.MIN,
  maxValue = DISTANCE_CONFIG.MAX,
  step = DISTANCE_CONFIG.STEP,
}) => {
  const isEnabled = maxDistance !== undefined;
  const currentDistance = maxDistance ?? DISTANCE_CONFIG.DEFAULT;
  
  // Estado local para mostrar el valor mientras se arrastra
  const [localDistance, setLocalDistance] = useState(currentDistance);

  // Actualizar el estado local cuando cambie el prop
  React.useEffect(() => {
    setLocalDistance(currentDistance);
  }, [currentDistance]);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onDistanceChange(DISTANCE_CONFIG.DEFAULT);
    } else {
      onDistanceChange(undefined);
    }
  };

  return (
    <VStack space="sm">
      <HStack className="justify-between items-center">
        <Checkbox
          value="distance"
          isChecked={isEnabled}
          onChange={handleToggle}
          aria-label="Activar filtro de distancia"
        >
          <CheckboxIndicator>
            <CheckboxIcon as={CheckIcon} />
          </CheckboxIndicator>
          <CheckboxLabel>
            <Text className="font-semibold text-typography-900">
              Distancia máxima
            </Text>
          </CheckboxLabel>
        </Checkbox>
        {isEnabled && (
          <Text className="text-primary-600 font-medium">
            {localDistance} km
          </Text>
        )}
      </HStack>

      {isEnabled && (
        <>
          <Slider
            value={localDistance}
            onChange={(value) => {
              // Solo actualizar el estado local mientras se arrastra
              setLocalDistance(value);
            }}
            onChangeEnd={(value) => {
              // Aplicar el cambio cuando el usuario suelta el slider
              onDistanceChange(value);
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
            <Text className="text-xs text-typography-500">{minValue} km</Text>
            <Text className="text-xs text-typography-500">{maxValue} km</Text>
          </HStack>
        </>
      )}
    </VStack>
  );
};
