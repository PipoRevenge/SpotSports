// Exportaciones públicas de la feature spot

// Context
export { SelectedSpotProvider, useSelectedSpot } from '../../context/selected-spot-context';

// Hooks - Optimized with React Query
export { useSpotCounters } from './hooks/use-spot-counters';
export { useSpotData } from './hooks/use-spot-data';
export { useSpotDetails } from './hooks/use-spot-details';
export { useSpotPrefetch } from './hooks/use-spot-prefetch';

// Types
export type { SportFilterCriteria, SpotSearchFilters } from './types/spot-search-types';
export { DISTANCE_CONFIG, RATING_CONFIG } from './types/spot-types';
export type { MediaItem, SpotCreateFormData, SpotCreateFormProps, SpotFormErrors, SpotFormState } from './types/spot-types';

// Components - Create
export { SpotCreateForm } from './components/spot-create/spot-create-form';

// Components - View
// Note: SpotCollectionSelector moved to spot-collection feature
export { SpotDataDetails } from './components/spot-view/spot-data-details';
export { SpotImageGallery } from './components/spot-view/spot-image-gallery';
export { SpotSportsTable } from './components/spot-view/spot-sports-table';

// Components - Search
export { SpotCard } from './components/spot-search/spot-card';
export { SpotListCard } from './components/spot-search/spot-list-card';
export { SpotSearchFilterModal } from './components/spot-search/spot-search-filter-modal';


// Components - Filter Components  
export {
  DistanceFilter,
  RatingFilter,
  SportFilter,
  SportSelectedFilter,
  VerifiedFilter
} from './components/spot-filter-components';

// Hooks
export { useCreateSpot } from './hooks/use-create-spot';
export { useSpotsByIds } from './hooks/use-spots';


// Utils
export {
  validateAvailableSports, validateContactEmail,
  validateContactWebsite, validateLocation, validateMedia, validateSpotCreateForm, validateSpotDescription, validateSpotName
} from './utils/spot-validations';

