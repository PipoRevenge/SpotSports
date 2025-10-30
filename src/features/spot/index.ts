// Exportaciones públicas de la feature spot

// Types
export type { SpotSearchFilters } from './components/spot-search/spot-search-filter-modal';
export type { MediaItem, SpotCreateFormData, SpotCreateFormProps, SpotFormErrors, SpotFormState } from './types/spot-types';

// Components - Create
export { SpotCreateForm } from './components/spot-create/spot-create-form';

// Components - View
export { SpotDataDetails } from './components/spot-view/spot-data-details';
export { SpotImageGallery } from './components/spot-view/spot-image-gallery';

// Components - Search
export { SpotCard } from './components/spot-search/spot-card';
export { SpotListCard } from './components/spot-search/spot-list-card';
export { SpotSearchBar } from './components/spot-search/spot-search-bar';
export { SpotSearchFilterModal } from './components/spot-search/spot-search-filter-modal';
export { SpotSearchMap } from './components/spot-search/spot-search-map';

// Hooks
export { useCreateSpot } from './hooks/use-create-spot';
export { useSpotDetails } from './hooks/use-spot-details';
export { useSpotSearch } from './hooks/use-spot-search';

// Utils
export {
    validateAvailableSports, validateContactEmail,
    validateContactWebsite, validateLocation, validateMedia, validateSpotCreateForm, validateSpotDescription, validateSpotName
} from './utils/spot-validations';


