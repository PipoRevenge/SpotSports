import { Region } from "react-native-maps";

/**
 * Tipos compartidos para componentes de mapa
 * 
 * Estos tipos abstraen react-native-maps para facilitar
 * el uso de componentes de mapa en toda la aplicación
 */

// ==================== COORDENADAS Y UBICACIÓN ====================

/**
 * Coordenadas geográficas básicas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Ubicación con información adicional
 */
export interface Location extends Coordinates {
  /** Precisión de la ubicación en metros */
  accuracy?: number;
  /** Altitud en metros */
  altitude?: number;
  /** Precisión de la altitud en metros */
  altitudeAccuracy?: number;
  /** Dirección del movimiento en grados (0-360) */
  heading?: number;
  /** Velocidad en m/s */
  speed?: number;
  /** Timestamp de cuando se obtuvo la ubicación */
  timestamp?: number;
}

// ==================== REGIÓN DEL MAPA ====================

/**
 * Re-export de Region de react-native-maps para consistencia
 */
export type MapRegion = Region;

// ==================== MARCADORES ====================

/**
 * Propiedades base para un marcador en el mapa
 */
export interface BaseMarkerProps {
  /** Coordenadas del marcador */
  coordinate: Coordinates;
  /** ID único del marcador */
  id?: string;
  /** Título del marcador */
  title?: string;
  /** Descripción del marcador */
  description?: string;
  /** Color del marcador */
  color?: string;
  /** Tamaño del marcador */
  size?: number;
  /** Callback cuando se presiona el marcador */
  onPress?: () => void;
  /** Si el marcador está seleccionado */
  isSelected?: boolean;
}

/**
 * Propiedades para marcadores personalizados
 */
export interface CustomMarkerProps<T = unknown> extends BaseMarkerProps {
  /** Datos asociados al marcador */
  data: T;
  /** Renderizado personalizado del contenido del marcador */
  renderMarkerContent?: (data: T, isSelected: boolean) => React.ReactNode;
  /** Renderizado personalizado del callout */
  renderCallout?: (data: T) => React.ReactNode;
  /** Callback cuando se presiona el callout */
  onCalloutPress?: () => void;
  /** Configuración del callout */
  calloutConfig?: {
    /** Si se debe mostrar el callout por defecto */
    showDefault?: boolean;
    /** Si el callout es tooltip (sin flecha) */
    tooltip?: boolean;
  };
}

// ==================== CALLOUTS ====================

/**
 * Propiedades base para callouts
 */
export interface BaseCalloutProps<T = unknown> {
  /** Datos a mostrar en el callout */
  data: T;
  /** Callback cuando se presiona el callout */
  onPress?: (data: T) => void;
  /** Si el callout es tooltip (sin flecha) */
  tooltip?: boolean;
}

/**
 * Propiedades para callouts personalizados con render prop
 */
export interface CustomCalloutProps<T = unknown> extends BaseCalloutProps<T> {
  /** Renderizado personalizado del contenido del callout */
  renderContent: (data: T) => React.ReactNode;
}

// ==================== CÍRCULOS Y OVERLAYS ====================

/**
 * Propiedades para círculos en el mapa
 */
export interface MapCircleProps {
  /** Centro del círculo */
  center: Coordinates;
  /** Radio en metros */
  radius: number;
  /** Color del borde */
  strokeColor?: string;
  /** Ancho del borde */
  strokeWidth?: number;
  /** Color de relleno */
  fillColor?: string;
}

// ==================== CONFIGURACIÓN DEL MAPA ====================

/**
 * Configuración de región del mapa
 */
export interface MapRegionConfig {
  /** Región inicial del mapa */
  initialRegion?: MapRegion;
  /** Si se debe centrar automáticamente en la ubicación del usuario */
  autoCenter?: boolean;
  /** Si se debe centrar automáticamente en los resultados */
  autoCenterOnResults?: boolean;
  /** Nivel de zoom por defecto (delta) */
  defaultZoom?: number;
  /** Latitud por defecto si no hay ubicación */
  defaultLatitude?: number;
  /** Longitud por defecto si no hay ubicación */
  defaultLongitude?: number;
}

/**
 * Configuración de marcadores
 */
export interface MapMarkerConfig {
  /** Color por defecto de los marcadores */
  color?: string;
  /** Color cuando está seleccionado */
  selectedColor?: string;
  /** Tamaño por defecto */
  size?: number;
}

/**
 * Configuración completa del mapa
 */
export interface MapConfig {
  /** Configuración de la región */
  region?: MapRegionConfig;
  /** Configuración de marcadores */
  marker?: MapMarkerConfig;
  /** Si se muestra la ubicación del usuario */
  showUserLocation?: boolean;
  /** Si se muestra el botón de mi ubicación */
  showMyLocationButton?: boolean;
  /** Si el mapa sigue la ubicación del usuario */
  followsUserLocation?: boolean;
  /** Si se muestran esquinas redondeadas */
  roundedCorners?: boolean;
}

// ==================== ESTILOS DE MAPA ====================

/**
 * Tema del mapa
 */
export type MapTheme = "light" | "dark" | "custom";

/**
 * Configuración de estilo del mapa
 */
export interface MapStyleConfig {
  /** Tema del mapa */
  theme?: MapTheme;
  /** Estilo personalizado (MapView customMapStyle) */
  customStyle?: Record<string, unknown>[];
}
