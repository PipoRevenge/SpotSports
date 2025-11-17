import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import {
  DIFFICULTY_CONFIG,
  DIFFICULTY_LEVELS,
  DifficultyLevel,
  numberToDifficulty,
} from "@/src/types/difficulty";
import React from "react";
import { View } from "react-native";

export type { DifficultyLevel } from "@/src/types/difficulty";

export interface RatingDifficultyProps {
  /**
   * Nivel de dificultad actual
   */
  difficulty: DifficultyLevel | number;
  
  /**
   * Callback cuando cambia la dificultad (solo si editable=true)
   */
  onDifficultyChange?: (difficulty: DifficultyLevel) => void;
  
  /**
   * Si es editable (permite seleccionar dificultad)
   * @default false
   */
  editable?: boolean;
  
  /**
   * Variante de visualización
   * @default "badge"
   */
  variant?: "badge" | "bar" | "buttons";
  
  /**
   * Tamaño del componente
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Mostrar la etiqueta de nivel
   * @default true
   */
  showLabel?: boolean;

  /**
   * Mostrar el valor numérico junto al badge
   * @default false
   */
  showValue?: boolean;
}

/**
 * Componente profesional para mostrar y editar niveles de dificultad
 * 
 * @example
 * // Badge de solo lectura
 * <RatingDifficulty difficulty="Intermediate" />
 * 
 * @example
 * // Selector editable
 * <RatingDifficulty 
 *   difficulty={difficulty}
 *   onDifficultyChange={setDifficulty}
 *   editable
 *   variant="buttons"
 * />
 * 
 * @example
 * // Barra de progreso con valor numérico
 * <RatingDifficulty difficulty={7} variant="bar" />
 */
export const RatingDifficulty: React.FC<RatingDifficultyProps> = ({
  difficulty,
  onDifficultyChange,
  editable = false,
  variant = "badge",
  size = "md",
  showLabel = true,
  showValue = false,
}) => {
  // Normalizar la dificultad a un nivel
  const difficultyLevel: DifficultyLevel = 
    typeof difficulty === "number" 
      ? numberToDifficulty(difficulty) 
      : difficulty;
  
  const config = DIFFICULTY_CONFIG[difficultyLevel];
  
  // Calcular el porcentaje para la barra (usar maxValue en vez de value fijo)
  const percentage = (config.maxValue / 10) * 100;

  // Obtener el valor numérico para mostrar
  const numericValue = typeof difficulty === "number" 
    ? difficulty 
    : config.centerValue;

  /**
   * Tamaños responsivos
   */
  const sizeClasses = {
    sm: {
      badge: "px-2 py-1 text-xs",
      button: "px-3 py-1.5 text-xs",
      bar: "h-2",
      text: "text-xs",
    },
    md: {
      badge: "px-3 py-1.5 text-sm",
      button: "px-4 py-2 text-sm",
      bar: "h-3",
      text: "text-sm",
    },
    lg: {
      badge: "px-4 py-2 text-base",
      button: "px-5 py-2.5 text-base",
      bar: "h-4",
      text: "text-base",
    },
  };

  /**
   * Renderiza como badge (chip)
   */
  const renderBadge = () => (
      <View className={`rounded-full ${config.bgColor} ${config.borderColor} border ${sizeClasses[size].badge}`}>
        <Text className={`font-medium ${config.textColor}`}>
          {showLabel ? config.label : typeof difficulty === "number" ? `${difficulty}/10` : ""}
        </Text>
        {showValue && (
        <Text className={`${sizeClasses[size].text} ${config.textColor} font-semibold`}>
          {numericValue.toFixed(1)}
        </Text>
      )}
    </View>
      
    
  );

  /**
   * Renderiza como barra de progreso
   */
  const renderBar = () => (
    <VStack className="w-full gap-1">
      {showLabel && (
        <HStack className="justify-between items-center">
          <Text className={`font-medium ${config.textColor} ${sizeClasses[size].text}`}>
            {config.label}
          </Text>
          <Text className={`${sizeClasses[size].text} text-gray-600`}>
            {typeof difficulty === "number" ? `${difficulty}/10` : `${config.maxValue}/10`}
          </Text>
        </HStack>
      )}
      <View className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size].bar}`}>
        <View 
          className={`${config.barColor} h-full rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </VStack>
  );

  /**
   * Renderiza como botones seleccionables
   */
  const renderButtons = () => (
    <HStack className="gap-2 flex-wrap">
      {DIFFICULTY_LEVELS.map((level) => {
        const levelConfig = DIFFICULTY_CONFIG[level];
        const isSelected = level === difficultyLevel;
        
        const ButtonWrapper = editable ? Pressable : View;
        
        return (
          <ButtonWrapper
            key={level}
            onPress={() => editable && onDifficultyChange?.(level)}
            className={`
              rounded-full border
              ${isSelected 
                ? `${levelConfig.bgColor} ${levelConfig.borderColor}` 
                : "bg-white border-gray-300"
              }
              ${sizeClasses[size].button}
            `}
            accessibilityRole={editable ? "button" : undefined}
            accessibilityLabel={editable ? `Select ${level} difficulty` : undefined}
          >
            <Text 
              className={`
                font-medium
                ${isSelected ? levelConfig.textColor : "text-gray-600"}
              `}
            >
              {levelConfig.label}
            </Text>
          </ButtonWrapper>
        );
      })}
    </HStack>
  );

  // Renderizar según la variante
  switch (variant) {
    case "bar":
      return renderBar();
    case "buttons":
      return renderButtons();
    case "badge":
    default:
      return renderBadge();
  }
};
