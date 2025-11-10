import React from "react";
import { Circle } from "react-native-maps";
import type { MapCircleProps } from "./types";

/**
 * Componente de círculo genérico para mapas
 * 
 * Abstrae el Circle de react-native-maps para mostrar áreas circulares
 * como rangos de distancia, zonas de búsqueda, etc.
 * 
 * Responsabilidades:
 * - Mostrar un círculo en el mapa
 * - Configurar apariencia (colores, bordes)
 * - Representar distancias/radios
 * 
 * @example
 * ```tsx
 * // Círculo de 5km de radio
 * <MapCircle
 *   center={{ latitude: 40.4168, longitude: -3.7038 }}
 *   radius={5000} // metros
 *   strokeColor="rgba(59, 130, 246, 0.8)"
 *   fillColor="rgba(59, 130, 246, 0.1)"
 * />
 * ```
 */
export const MapCircle: React.FC<MapCircleProps> = ({
  center,
  radius,
  strokeColor = "rgba(59, 130, 246, 0.8)", // Azul por defecto
  strokeWidth = 2,
  fillColor = "rgba(59, 130, 246, 0.1)", // Azul translúcido
}) => {
  return (
    <Circle
      center={center}
      radius={radius}
      strokeWidth={strokeWidth}
      strokeColor={strokeColor}
      fillColor={fillColor}
    />
  );
};

MapCircle.displayName = "MapCircle";
