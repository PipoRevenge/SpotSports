// Exportaciones públicas de la feature spot

// Types
export type { SpotSearchFilters } from './components/spot-search/spot-search-filter-modal';
export type { MediaItem, SpotCreateFormData, SpotCreateFormProps, SpotFormErrors, SpotFormState } from './types/spot-types';

// Components - Create
export { SpotCreateForm } from './components/spot-create/spot-create-form';

// Components - View
export { SpotDataDetails } from './components/spot-view/spot-data-details';
export { SpotImageGallery } from './components/spot-view/spot-image-gallery';
export { SpotSportsTable } from './components/spot-view/spot-sports-table';

// Components - Search
export { SpotCard } from './components/spot-search/spot-card';
export { SpotListCard } from './components/spot-search/spot-list-card';
export { SpotSearchFilterModal } from './components/spot-search/spot-search-filter-modal';


// Components - Filter Components  
export {
    DIFFICULTY_OPTIONS, DISTANCE_CONFIG, DistanceFilter, RATING_CONFIG, RatingFilter,
    SportFilter,
    SportSelectedFilter,
    VerifiedFilter
} from './components/spot-filter-components';

export type {
    DifficultyLevel, SportFilterCriteria
} from './components/spot-filter-components';

// Hooks
export { useCreateSpot } from './hooks/use-create-spot';
export { useSpotDetails } from './hooks/use-spot-details';
export { useSpotFilters } from './hooks/use-spot-filters';
export { useSpotMapSearch } from './hooks/use-spot-map-search';
export { useSpotSearch } from './hooks/use-spot-search';

// Utils
export {
    validateAvailableSports, validateContactEmail,
    validateContactWebsite, validateLocation, validateMedia, validateSpotCreateForm, validateSpotDescription, validateSpotName
} from './utils/spot-validations';


