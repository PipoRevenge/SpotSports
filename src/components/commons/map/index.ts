/**
 * @module components/commons/map
 * 
 * Abstracción de react-native-maps para la aplicación
 * 
 * Este módulo proporciona componentes genéricos y reutilizables
 * para trabajar con mapas en toda la aplicación, abstrayendo
 * la complejidad de react-native-maps.
 * 
 * Componentes principales:
 * - MapView: Vista de mapa con configuración por defecto
 * - MapMarker: Marcador genérico con soporte para callouts personalizados
 * - MapCallout: Callout personalizable mediante render props
 * - MapCircle: Círculos para representar áreas/distancias
 * - UserLocationMarker: Marcador especial para ubicación del usuario
 * - SelectionMarker: Marcador para ubicaciones seleccionadas
 * - PointPicker: Selector de punto en el mapa
 * - LocationPickerModal: Modal para seleccionar ubicación
 */

// ==================== COMPONENTES CORE ====================
export { MapCallout } from "./map-callout";
export { MapCircle } from "./map-circle";
export { MapMarker } from "./map-marker";
export { default as MapView } from "./map-view";

// ==================== MARCADORES ESPECIALIZADOS ====================
export { default as MapMark } from "./map-mark"; // Legacy, deprecated
export { default as SelectionMarker } from "./selection-marker";
export { default as UserLocationMarker } from "./user-location-marker";

// ==================== UTILIDADES ====================
export { LocationPickerModal } from "./location-picker-modal";
export { default as PointPicker } from "./point-picker";

// ==================== TIPOS ====================
export type {
    BaseCalloutProps, BaseMarkerProps, Coordinates, CustomCalloutProps, CustomMarkerProps, Location, MapCircleProps, MapConfig, MapMarkerConfig, MapRegion, MapRegionConfig, MapStyleConfig, MapTheme
} from "./types";
