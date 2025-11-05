import { GeoPoint } from "@/src/types/geopoint";
import { ReactNode } from "react";
import { Region } from "react-native-maps";

/**
 * Tipos genéricos para búsqueda en mapa
 * Estos tipos son independientes del tipo de entidad (Spot, Event, etc.)
 */

// ==================== INTERFACES DE UBICACIÓN ====================

/**
 * Ubicación con información adicional
 */
export interface LocationInfo extends GeoPoint {
  address?: string;
  city?: string;
  country?: string;
}

/**
 * Resultado de ubicación con distancia calculada
 */
export interface LocationWithDistance extends LocationInfo {
  distance?: number; // Distancia en kilómetros
}

// ==================== INTERFACES DE BÚSQUEDA ====================

/**
 * Filtros base para búsqueda en mapa
 * Las features específicas deben extender esta interfaz con sus propios filtros
 */
export interface BaseMapSearchFilters {
  searchQuery: string;
  maxDistance?: number; // Distancia máxima en km
  visibleRegion?: Region; // Región visible del mapa para buscar en ella
  sortBy?: "distance" | "rating" | "name" | "recent";
  sortOrder?: "asc" | "desc";
}

/**
 * Resultados de búsqueda con información de ubicación
 * T es el tipo de entidad (Spot, Event, etc.)
 */
export interface MapSearchResult<T> {
  item: T;
  location: LocationWithDistance;
  relevanceScore?: number; // Score de relevancia (0-1)
}

/**
 * Estado de búsqueda en mapa
 */
export interface MapSearchState<T> {
  results: MapSearchResult<T>[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  hasMore: boolean;
}

// ==================== INTERFACES DE CONFIGURACIÓN ====================

/**
 * Configuración de marcador en el mapa
 */
export interface MapMarkerConfig {
  color?: string;
  selectedColor?: string;
  size?: number;
  showCallout?: boolean;
}

/**
 * Configuración de región del mapa
 */
export interface MapRegionConfig {
  initialRegion?: Region;
  defaultLatitude?: number;
  defaultLongitude?: number;
  defaultZoom?: number;
  autoCenter?: boolean; // Centrar automáticamente en la ubicación del usuario
  autoCenterOnResults?: boolean; // Centrar automáticamente en los resultados
}

/**
 * Configuración del círculo de distancia
 */
export interface DistanceCircleConfig {
  enabled: boolean;
  maxDistance?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
}

/**
 * Configuración completa del mapa de búsqueda
 */
export interface MapSearchConfig {
  marker: MapMarkerConfig;
  region: MapRegionConfig;
  distanceCircle: DistanceCircleConfig;
  showUserLocation?: boolean;
  showMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  roundedCorners?: boolean; // Si el mapa tiene bordes redondeados
}

// ==================== INTERFACES DE COMPONENTES ====================

/**
 * Props para el componente de barra de búsqueda
 */
export interface MapSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  filterCount?: number; // Cantidad de filtros activos
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightActions?: ReactNode;
}

/**
 * Props para el modal de filtros
 * El contenido de los filtros se pasa como children (slot pattern)
 */
export interface MapSearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  applyButtonText?: string;
  resetButtonText?: string;
  cancelButtonText?: string;
  children: ReactNode; // Slot para filtros personalizados
}

/**
 * Props para el item de resultado
 * T es el tipo de entidad (Spot, Event, etc.)
 */
export interface MapSearchResultItemProps<T> {
  item: T;
  distance?: number;
  onPress?: (item: T) => void;
  isSelected?: boolean;
  renderContent: (item: T, distance?: number) => ReactNode; // Render prop para contenido personalizado
  renderActions?: (item: T) => ReactNode; // Render prop para acciones personalizadas
}

/**
 * Props para la lista de resultados
 */
export interface MapSearchResultListProps<T> {
  results: MapSearchResult<T>[];
  onItemPress?: (item: T) => void;
  selectedItemId?: string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  renderItem: (result: MapSearchResult<T>) => ReactNode; // Render prop para item personalizado
  listHeaderComponent?: ReactNode;
  listFooterComponent?: ReactNode;
}

/**
 * Props para el mapa de búsqueda
 */
export interface MapSearchMapProps<T> {
  results: MapSearchResult<T>[];
  userLocation?: GeoPoint;
  selectedItemId?: string;
  onMarkerPress?: (item: T) => void;
  onCalloutPress?: (item: T) => void; // Callback cuando se presiona el callout
  onRegionChangeComplete?: (region: Region) => void; // Callback cuando cambia la región del mapa
  initialRegion?: Region; // Región inicial del mapa
  config?: Partial<MapSearchConfig>;
  getItemId: (item: T) => string; // Función para obtener el ID de un item
  getItemLocation: (item: T) => GeoPoint; // Función para obtener la ubicación de un item
  getItemTitle: (item: T) => string; // Función para obtener el título de un item
  getItemDescription?: (item: T) => string; // Función para obtener la descripción de un item
  renderCustomMarker?: (item: T, isSelected: boolean) => ReactNode; // Render prop para marcador personalizado
  renderCallout?: (item: T, distance?: number) => ReactNode; // Render prop para callout personalizado
}

// ==================== TIPOS DE VISTA ====================

/**
 * Tipos de vista disponibles
 */
export type MapSearchViewMode = "map" | "list" | "split";

// ==================== TIPOS DE AYUDA ====================

/**
 * Función de búsqueda genérica
 * T es el tipo de entidad, F es el tipo de filtros
 */
export type SearchFunction<T, F extends BaseMapSearchFilters> = (
  filters: F,
  userLocation?: GeoPoint
) => Promise<T[]>;

/**
 * Función de transformación de entidad a resultado de búsqueda
 */
export type TransformToSearchResult<T> = (
  item: T,
  userLocation?: GeoPoint
) => MapSearchResult<T>;

/**
 * Opciones de ordenamiento
 */
export interface SortOption {
  key: string;
  label: string;
  value: "distance" | "rating" | "name" | "recent";
}

/**
 * Configuración por defecto del mapa
 */
export const DEFAULT_MAP_CONFIG: MapSearchConfig = {
  marker: {
    color: "#ef4444",
    selectedColor: "#22c55e",
    size: 40,
    showCallout: true,
  },
  region: {
    defaultLatitude: 40.4168,
    defaultLongitude: -3.7038,
    defaultZoom: 0.05,
    autoCenter: true,
    autoCenterOnResults: false,
  },
  distanceCircle: {
    enabled: true,
    strokeColor: "rgba(59, 130, 246, 0.5)",
    fillColor: "rgba(59, 130, 246, 0.1)",
    strokeWidth: 2,
  },
  showUserLocation: true,
  showMyLocationButton: true,
  followsUserLocation: false,
  roundedCorners: false, // Por defecto sin bordes redondeados
};

/**
 * Opciones de ordenamiento por defecto
 */
export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { key: "distance", label: "Distancia", value: "distance" },
  { key: "rating", label: "Mejor valorados", value: "rating" },
  { key: "name", label: "Nombre", value: "name" },
  { key: "recent", label: "Más recientes", value: "recent" },
];
