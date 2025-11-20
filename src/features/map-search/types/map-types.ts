/**
 * Tipos y configuraciones para el feature de búsqueda en mapa
 * 
 * Este archivo contiene todas las definiciones de tipos genéricos
 * que permiten usar el sistema de búsqueda en mapa para cualquier
 * tipo de entidad (Spots, Events, Users, etc.)
 */

import { GeoPoint } from "@/src/types/geopoint";
import React, { ReactNode } from "react";
import { Region } from "react-native-maps";

// ==================== TIPOS BASE ====================

/**
 * Ubicación con información de distancia calculada
 */
export interface LocationWithDistance extends GeoPoint {
  distance?: number; // Distancia en kilómetros desde ubicación del usuario
}

/**
 * Información completa de ubicación
 */
export interface LocationInfo {
  address?: string;
  city?: string;
  country?: string;
  coordinates: GeoPoint;
}

/**
 * Resultado de búsqueda en mapa (genérico)
 * @template T - Tipo de entidad (Spot, Event, etc.)
 */
export interface MapSearchResult<T> {
  item: T; // La entidad completa
  location: LocationWithDistance; // Ubicación con distancia calculada
}

/**
 * Estado de la búsqueda en mapa
 */
export interface MapSearchState<T> {
  results: MapSearchResult<T>[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  hasMore: boolean; // Para paginación futura
}

/**
 * Filtros base de búsqueda
 * Las features específicas pueden extender estos filtros
 */
export interface BaseMapSearchFilters {
  searchQuery?: string;
  maxDistance?: number; // En kilómetros
  sortBy?: "distance" | "rating" | "name" | "recent";
  sortOrder?: "asc" | "desc";
}

/**
 * Modo de visualización
 */
export type MapSearchViewMode = "map" | "list" | "split";

/**
 * Opción de ordenamiento
 */
export interface SortOption {
  value: "distance" | "rating" | "name" | "recent";
  label: string;
  icon?: ReactNode;
}

// ==================== FUNCIONES GENÉRICAS ====================

/**
 * Función de búsqueda genérica
 * @template T - Tipo de entidad
 * @template F - Tipo de filtros (debe extender BaseMapSearchFilters)
 */
export type SearchFunction<T, F> = (
  filters: F,
  userLocation: GeoPoint | undefined
) => Promise<T[]>;

/**
 * Función para transformar una entidad a resultado de búsqueda
 */
export type TransformToSearchResult<T> = (
  item: T,
  userLocation?: GeoPoint
) => MapSearchResult<T>;

// ==================== CONFIGURACIÓN DE MAPA ====================

/**
 * Configuración de región del mapa
 */
export interface MapRegionConfig {
  initialRegion?: Region;
  autoCenter?: boolean; // Centrar en ubicación del usuario
  autoCenterOnResults?: boolean; // Centrar en resultados cuando se encuentren
  defaultZoom?: number; // Delta por defecto (0.05 = zoom cercano)
  defaultLatitude?: number; // Latitud por defecto si no hay ubicación
  defaultLongitude?: number; // Longitud por defecto si no hay ubicación
}

/**
 * Configuración de círculo de distancia
 */
export interface DistanceCircleConfig {
  enabled: boolean;
  maxDistance?: number; // En kilómetros
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

/**
 * Configuración de marcadores
 */
export interface MapMarkerConfig {
  clusteringEnabled?: boolean; // Para agrupación de marcadores cercanos
  customMarkerComponent?: React.ComponentType<any>;
  showCallout?: boolean; // Mostrar callout al presionar marcador
  animateMarkerEntrance?: boolean;
  color?: string; // Color del marcador
  selectedColor?: string; // Color del marcador seleccionado
  size?: number; // Tamaño del marcador
}

/**
 * Configuración completa del mapa
 */
export interface MapSearchConfig {
  region: MapRegionConfig;
  distanceCircle: DistanceCircleConfig;
  marker?: MapMarkerConfig;
  showUserLocation?: boolean;
  showMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  enablePanDrag?: boolean;
  enableZoom?: boolean;
}

/**
 * Configuración por defecto del mapa
 */
export const DEFAULT_MAP_CONFIG: MapSearchConfig = {
  region: {
    autoCenter: true,
    autoCenterOnResults: true,
    defaultZoom: 0.05,
    defaultLatitude: 40.4168, // Madrid por defecto
    defaultLongitude: -3.7038,
  },
  distanceCircle: {
    enabled: true,
    strokeWidth: 2,
    strokeColor: "#3b82f6",
    fillColor: "rgba(59, 130, 246, 0.1)",
  },
  marker: {
    clusteringEnabled: false,
    showCallout: true,
    animateMarkerEntrance: false,
  },
  showUserLocation: true,
  showMyLocationButton: true,
  followsUserLocation: false,
  enablePanDrag: true,
  enableZoom: true,
};

/**
 * Opciones de ordenamiento por defecto
 */
export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "distance", label: "Distancia" },
  { value: "rating", label: "Valoración" },
  { value: "name", label: "Nombre" },
  { value: "recent", label: "Recientes" },
];

// ==================== PROPS DE COMPONENTES ====================

/**
 * Props del componente MapSearchBar
 */
export interface MapSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  filterCount?: number;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightActions?: ReactNode;
}

/**
 * Props del componente MapSearchMap
 */
export interface MapSearchMapProps<T> {
  results: MapSearchResult<T>[];
  userLocation?: GeoPoint;
  onMarkerPress?: (item: T) => void;
  onCalloutPress?: (item: T) => void;
  onMapPress?: (coordinate: GeoPoint) => void;
  onRegionChangeComplete?: (region: Region) => void;
  initialRegion?: Region;
  config?: Partial<MapSearchConfig>;
  selectedItemId?: string | number;
  getItemId: (item: T) => string | number;
  getItemLocation: (item: T) => GeoPoint;
  getItemTitle?: (item: T) => string;
  getItemDescription?: (item: T) => string;
  renderMarker?: (item: T, isSelected?: boolean) => ReactNode;
  renderCustomMarker?: (item: T, isSelected?: boolean) => ReactNode;
  renderCustomCallout?: (item: T) => ReactNode;
  renderCompleteMarker?: (
    item: T,
    isSelected: boolean,
    onPress: () => void,
    onCalloutPress: () => void
  ) => ReactNode;
  children?: ReactNode;
}

/**
 * Props del componente MapSearchResultItem
 */
export interface MapSearchResultItemProps<T> {
  item: T;
  distance?: number;
  onPress?: (item: T) => void;
  isSelected?: boolean;
  renderContent: (item: T, distance?: number) => ReactNode;
  renderActions?: (item: T) => ReactNode;
}

/**
 * Props del componente MapSearchResultList
 */
export interface MapSearchResultListProps<T> {
  results: MapSearchResult<T>[];
  onItemPress?: (item: T) => void;
  selectedItemId?: string | number;
  getItemId?: (item: T) => string | number;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  renderContent?: (item: T, distance?: number) => ReactNode;
  renderActions?: (item: T) => ReactNode;
  renderItem: (result: MapSearchResult<T>) => ReactNode;
  listHeaderComponent?: ReactNode;
  listFooterComponent?: ReactNode;
}

/**
 * Props del componente MapSearchFilterModal
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
  children: ReactNode;
}
