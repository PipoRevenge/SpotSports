import { Box } from '@/src/components/ui/box';
import { Icon } from '@/src/components/ui/icon';
import { Star } from 'lucide-react-native';
import React from 'react';

interface SingleStarProps {
  fillLevel?: number; // 0 to 1
  size?: number;
  color?: string;
  emptyColor?: string;
}

/**
 * Componente para una estrella individual que se puede rellenar parcialmente.
 */
const SingleStar: React.FC<SingleStarProps> = ({
  fillLevel = 0,
  size = 24,
  color = '#fbbf24', // Direct yellow color for filled star
  emptyColor = '#d1d5db', // Direct gray color for empty star
}) => {
  // Clamp fillLevel between 0 and 1
  const clampedFillLevel = Math.max(0, Math.min(1, fillLevel));
  // Use numeric width in pixels so the style width is a number (compatible with ViewStyle)
  const fillWidth = clampedFillLevel * size;

  return (
    <Box className="relative justify-center items-center" style={{ width: size, height: size }}>
      {/* Estrella de fondo (vacía) */}
      <Box className="absolute top-0 left-0" style={{ width: size, height: size }}>
        <Icon
          as={Star}
          className="text-typography-950"
          style={{ width: size, height: size, color: emptyColor }}
        />
      </Box>

      {/* Contenedor de relleno con clipping horizontal */}
      <Box
        className="absolute top-0 left-0 overflow-hidden"
        style={{ width: fillWidth, height: size }}
      >
        <Box style={{ width: size, height: size }}>
          <Icon
            as={Star}
            className="text-typography-950"
            style={{ width: size, height: size, color: color, fill: color }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SingleStar;
