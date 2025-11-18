import { HStack } from "@/src/components/ui/hstack";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/src/components/ui/slider";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import {
  DIFFICULTY_CONFIG,
  DIFFICULTY_MARKERS,
  DIFFICULTY_RANGE,
  DifficultyLevel,
  numberToDifficulty,
} from "@/src/types/difficulty";
import React, { useState } from "react";
import { View } from "react-native";

export interface RatingDifficultySliderProps {
  /**
   * Nivel de dificultad actual
   */
  difficulty: DifficultyLevel;
  
  /**
   * Callback cuando cambia la dificultad (nivel categórico)
   */
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  
  /**
   * Callback cuando cambia el valor numérico exacto (0-10)
   * Útil para trabajar directamente con valores numéricos
   */
  onValueChange?: (value: number) => void;
  
  /**
   * Si es editable
   * @default true
   */
  editable?: boolean;
  
  /**
   * Tamaño del componente
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Variante del componente
   * - slider: Vista interactiva con slider (editable)
   * - progress: Vista de solo lectura con barra de progreso
   * @default "slider"
   */
  variant?: "slider" | "progress";
  
  /**
   * Mostrar el valor numérico junto al label
   * @default true
   */
  showValueLabel?: boolean;
}

/**
 * Componente slider para seleccionar nivel de dificultad (0-10)
 * Muestra marcas visuales de los rangos y el nombre del nivel actual
 * 
 * @example
 * <RatingDifficultySlider 
 *   difficulty={difficulty}
 *   onDifficultyChange={setDifficulty}
 *   size="md"
 * />
 */
export const RatingDifficultySlider: React.FC<RatingDifficultySliderProps> = ({
  difficulty,
  onDifficultyChange,
  onValueChange,
  editable = true,
  size = "md",
  variant = "slider",
  showValueLabel = true,
}) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Usar el valor central del rango como valor inicial
  const [sliderValue, setSliderValue] = useState(config.centerValue);

  const sizeClasses = {
    sm: {
      slider: "h-2",
      text: "text-xs",
      label: "text-sm",
    },
    md: {
      slider: "h-3",
      text: "text-sm",
      label: "text-base",
    },
    lg: {
      slider: "h-4",
      text: "text-base",
      label: "text-lg",
    },
  };

  const handleSliderChange = (value: number) => {
    // Redondear a 1 decimal para evitar problemas de precisión
    const roundedValue = Math.round(value * 10) / 10;
    setSliderValue(roundedValue);
  };

  const handleSliderChangeEnd = (value: number) => {
    // Redondear a 1 decimal
    const roundedValue = Math.round(value * 10) / 10;
    
    // Emitir el valor numérico exacto
    if (onValueChange) {
      onValueChange(roundedValue);
    }
    
    // Emitir el nivel categórico
    const newLevel = numberToDifficulty(roundedValue);
    if (newLevel !== difficulty) {
      onDifficultyChange(newLevel);
    }
  };

  // Vista de solo lectura con barra de progreso
  if (variant === "progress") {
    const percentage = (sliderValue / 10) * 100;
    
    return (
      <VStack className="w-full gap-3">
        {/* Label y valor */}
        <HStack className="justify-between items-center">
          <Text className={`font-bold ${config.textColor} ${sizeClasses[size].label}`}>
            {config.label}
          </Text>
          {showValueLabel && (
            <Text className={`${sizeClasses[size].text} text-gray-600 font-medium`}>
              {sliderValue.toFixed(1)}/10
            </Text>
          )}
        </HStack>

        {/* Barra de progreso con segmentos de color */}
        <View className="w-full">
          <View className={`w-full ${sizeClasses[size].slider} bg-gray-200 rounded-full overflow-hidden`}>
            <View 
              className={`h-full ${config.barColor} rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </View>

          {/* Marcadores en el centro de cada franja */}
          <View className="w-full mt-3 relative" style={{ height: 60 }}>
            {DIFFICULTY_MARKERS.map((marker) => {
              const markerConfig = DIFFICULTY_CONFIG[marker.level];
              const isActive = difficulty === marker.level;
              const positionPercent = (marker.value / DIFFICULTY_RANGE.MAX) * 100;
              
              return (
                <View 
                  key={marker.value}
                  className="items-center absolute"
                  style={{ 
                    left: `${positionPercent}%`,
                    transform: [{ translateX: -25 }], // Centrar el marcador (aprox mitad del ancho)
                  }}
                >
                  {/* Línea vertical del marcador */}
                  <View className={`w-0.5 h-2 ${isActive ? markerConfig.barColor : 'bg-gray-300'}`} />
                  
                  {/* Label del nivel */}
                  <Text className={`${sizeClasses[size].text} mt-1 text-center ${
                    isActive ? `${markerConfig.textColor} font-bold` : 'text-gray-500'
                  }`}>
                    {marker.label}
                  </Text>
                  
                  {/* Rango numérico */}
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {marker.subLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </VStack>
    );
  }

  // Vista interactiva con slider (por defecto)
  return (
    <VStack className="w-full gap-3">
      {/* Label y valor */}
      <HStack className="justify-between items-center">
        <Text className={`font-bold ${config.textColor} ${sizeClasses[size].label}`}>
          {config.label}
        </Text>
        {showValueLabel && (
          <Text className={`${sizeClasses[size].text} text-gray-600 font-medium`}>
            {sliderValue.toFixed(1)}/10
          </Text>
        )}
      </HStack>

      {/* Slider - Arrastrable y simétrico */}
      <View className="w-full">
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          onChangeEnd={handleSliderChangeEnd}
          minValue={DIFFICULTY_RANGE.MIN}
          maxValue={DIFFICULTY_RANGE.MAX}
          step={DIFFICULTY_RANGE.STEP}
          isDisabled={!editable}
          className="w-full"
        >
          <SliderTrack className={`${sizeClasses[size].slider} bg-gray-200 rounded-full`}>
            <SliderFilledTrack className={config.barColor} />
          </SliderTrack>
          <SliderThumb 
            className="w-8 h-8 bg-white border-2 shadow-lg rounded-full"
            style={{ borderColor: config.sliderColor }}
          />
        </Slider>

        {/* Marcadores en el centro de cada franja */}
        <View className="w-full mt-3 relative" style={{ height: 60 }}>
          {DIFFICULTY_MARKERS.map((marker) => {
            const markerConfig = DIFFICULTY_CONFIG[marker.level];
            const isActive = difficulty === marker.level;
            const positionPercent = (marker.value / DIFFICULTY_RANGE.MAX) * 100;
            
            return (
              <View 
                key={marker.value}
                className="items-center absolute"
                style={{ 
                  left: `${positionPercent}%`,
                  transform: [{ translateX: -25 }],
                }}
              >
                {/* Label del nivel */}
                <Text className={`${sizeClasses[size].text} mt-1 text-center ${
                  isActive ? `${markerConfig.textColor} font-bold` : 'text-gray-500'
                }`}>
                  {marker.label}
                </Text>
                
                {/* Rango numérico */}
                <Text className="text-xs text-gray-400 mt-0.5">
                  {marker.subLabel}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Guía visual de rangos - Barra dividida en 4 segmentos */}
        <View className="w-full mt-2 flex-row h-1.5 rounded-full overflow-hidden">
          <View className="flex-1 bg-emerald-500" style={{ width: '25%' }} />
          <View className="flex-1 bg-yellow-500" style={{ width: '25%' }} />
          <View className="flex-1 bg-orange-500" style={{ width: '25%' }} />
          <View className="flex-1 bg-red-600" style={{ width: '25%' }} />
        </View>
      </View>
    </VStack>
  );
};
