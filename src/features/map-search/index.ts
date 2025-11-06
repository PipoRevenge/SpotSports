/**
 * Map Search Feature - Exportaciones Públicas
 * 
 * Feature genérica para búsqueda de entidades en mapa.
 * Proporciona componentes, hooks y utilidades reutilizables.
 */

// ==================== TIPOS ====================
export type {
    BaseMapSearchFilters,
    DistanceCircleConfig,
    LocationInfo,
    LocationWithDistance,
    MapMarkerConfig,
    MapRegionConfig,
    MapSearchBarProps,
    MapSearchConfig,
    MapSearchFilterModalProps,
    MapSearchMapProps,
    MapSearchResult,
    MapSearchResultItemProps,
    MapSearchResultListProps,
    MapSearchState,
    MapSearchViewMode,
    SearchFunction,
    SortOption,
    TransformToSearchResult
} from "./types/map-types";

export {
    DEFAULT_MAP_CONFIG,
    DEFAULT_SORT_OPTIONS
} from "./types/map-types";

// ==================== COMPONENTES ====================
export { MapAreaSearchIndicator } from "./components/map-area-search-indicator";
export { MapSearchBar } from "./components/map-search-bar";
export { MapSearchFilterModal } from "./components/map-search-filter-modal";
export { MapSearchMap } from "./components/map-search-map";
export { MapSearchResultItem } from "./components/map-search-result-item";
export { MapSearchResultList } from "./components/map-search-result-list";

// Componentes específicos de spots
export { SpotCardModal, SpotMapCallout } from "./components/spot-map-components";

// ==================== HOOKS ====================
export {
    useMapSearch,
    type UseMapSearchConfig,
    type UseMapSearchResult
} from "./hooks/use-map-search";

export {
    useMapAreaSearch
} from "./hooks/use-map-area-search";

// ==================== UTILIDADES ====================
export {
    calculateDistance,
    calculateRegionForDistance,
    calculateRegionForLocations,
    calculateStatistics,
    filterByDistance,
    filterByQuery,
    formatDistance,
    groupByDistance,
    isValidLocation,
    isValidMaxDistance,
    isWithinDistance,
    sortResults,
    transformToSearchResults,
    type SearchStatistics
} from "./utils/map-helpers";

