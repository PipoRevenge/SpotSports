// Exportaciones públicas de la feature spot

// Types
export type { MediaItem, SpotCreateFormData, SpotCreateFormProps, SpotFormErrors, SpotFormState } from './types/spot-types';

// Components
export { SpotCreateForm } from './components/spot-create-form';
export { SpotDataDetails } from './components/spot-data-details';
export { SpotImageGallery } from './components/spot-image-gallery';

// Hooks
export { useCreateSpot } from './hooks/use-create-spot';
export { useSpotDetails } from './hooks/use-spot-details';

// Utils
export {
    SPOT_VALIDATION_MESSAGES, validateAvailableSports, validateContactEmail,
    validateContactWebsite, validateLocation, validateMedia, validateSpotCreateForm, validateSpotDescription, validateSpotName
} from './utils/spot-validations';

