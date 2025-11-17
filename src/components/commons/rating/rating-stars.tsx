import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import SingleStar from './single-star';

export interface RatingStarsProps {
  value?: number; // e.g., 4.5 for 4.5 stars
  rating?: number; // Alias for value (for backward compatibility)
  max?: number; // Default 5
  maxStars?: number; // Alias for max (for backward compatibility)
  onChange?: (value: number) => void; // For interactive mode
  onRatingChange?: (value: number) => void; // Alias for onChange (for backward compatibility)
  size?: number | 'sm' | 'md' | 'lg'; // Size in pixels or preset
  color?: string;
  emptyColor?: string;
  disabled?: boolean;
  editable?: boolean; // Opposite of disabled (for backward compatibility)
  showValue?: boolean; // Show numeric value in parentheses
  allowHalf?: boolean; // Allow half-star ratings (for backward compatibility)
}

/**
 * Componente para mostrar y editar un rating con estrellas.
 * Soporta ratings decimales (e.g., 4.5) y selección de medio en medio.
 */
const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  rating,
  max,
  maxStars,
  onChange,
  onRatingChange,
  size = 24,
  color = '#fbbf24',
  emptyColor = '#d1d5db',
  disabled = false,
  editable,
  showValue = false,
  allowHalf = true,
}) => {
  // Handle backward compatibility aliases
  const actualValue = value ?? rating ?? 0;
  const actualMax = max ?? maxStars ?? 5;
  const actualOnChange = onChange ?? onRatingChange;
  // editable prop takes precedence if explicitly set, otherwise use disabled
  const isDisabled = editable !== undefined ? !editable : disabled;
  
  // Convert size presets to pixel values
  const sizeMap: Record<string, number> = {
    sm: 16,
    md: 24,
    lg: 32,
  };
  const actualSize = typeof size === 'string' ? sizeMap[size] : size;

  const clampedValue = Math.max(0, Math.min(actualMax, actualValue));

  const handleHalfStarPress = (starIndex: number, isRightHalf: boolean) => {
    if (actualOnChange && !isDisabled) {
      const newValue = isRightHalf ? starIndex + 1 : starIndex + 0.5;
      actualOnChange(newValue);
    }
  };

  return (
    <HStack space="xs" className="items-center">
      {Array.from({ length: actualMax }, (_, index) => {
        // Calculate fill level for this star (0-1)
        let fillLevel = 0;
        if (clampedValue >= index + 1) {
          fillLevel = 1; // Full star
        } else if (clampedValue > index) {
          fillLevel = clampedValue - index; // Partial star (e.g., 0.5)
        }

        return (
          <View key={index} style={{ position: 'relative', width: actualSize, height: actualSize }}>
            {/* Star display */}
            <SingleStar
              fillLevel={fillLevel}
              size={actualSize}
              color={color}
              emptyColor={emptyColor}
            />
            
            {/* Interactive zones (left and right halves) */}
            {actualOnChange && !isDisabled && (
              <View style={{ position: 'absolute', top: 0, left: 0, width: actualSize, height: actualSize, flexDirection: 'row' }}>
                {/* Left half - sets to X.5 */}
                <TouchableOpacity
                  style={{ width: actualSize / 2, height: actualSize }}
                  onPress={() => handleHalfStarPress(index, false)}
                  activeOpacity={0.7}
                />
                {/* Right half - sets to X+1 */}
                <TouchableOpacity
                  style={{ width: actualSize / 2, height: actualSize }}
                  onPress={() => handleHalfStarPress(index, true)}
                  activeOpacity={0.7}
                />
              </View>
            )}
          </View>
        );
      })}
      {showValue && (
        <Text className="text-sm text-typography-600 ml-1">
          ({clampedValue.toFixed(1)})
        </Text>
      )}
    </HStack>
  );
};

export default RatingStars;
export { RatingStars };

