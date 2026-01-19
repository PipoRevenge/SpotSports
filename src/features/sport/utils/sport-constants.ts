/**
 * Configuración por defecto para la búsqueda de deportes
 */
export const SPORT_SEARCH_CONFIG = {
  DEFAULT_SEARCH_DELAY: 300,
  MAX_SEARCH_RESULTS: 10,
  MIN_SEARCH_LENGTH: 1,
} as const;

/**
 * Límites de validación para deportes
 */
export const SPORT_VALIDATION_LIMITS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MIN_LENGTH: 5,
  DESCRIPTION_MAX_LENGTH: 200,
  CATEGORY_MAX_LENGTH: 30,
} as const;

/**
 * Mensajes de error para deportes
 */
export const SPORT_ERROR_MESSAGES = {
  REQUIRED_NAME: 'Sport name is required',
  REQUIRED_DESCRIPTION: 'Sport description is required', 
  REQUIRED_CATEGORY: 'Sport category is required', // Ya no se usa, la categoría es opcional
  NAME_TOO_SHORT: `Name must be at least ${SPORT_VALIDATION_LIMITS.NAME_MIN_LENGTH} characters long`,
  NAME_TOO_LONG: `Name cannot be longer than ${SPORT_VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`,
  DESCRIPTION_TOO_SHORT: `Description must be at least ${SPORT_VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH} characters long`,
  DESCRIPTION_TOO_LONG: `Description cannot be longer than ${SPORT_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
  CATEGORY_TOO_LONG: `Category cannot be longer than ${SPORT_VALIDATION_LIMITS.CATEGORY_MAX_LENGTH} characters`,
  SPORT_EXISTS: 'A sport with this name already exists',
  CREATE_ERROR: 'Error creating sport',
  LOAD_ERROR: 'Error loading sports',
  SEARCH_ERROR: 'Error searching sports',
  SELECTION_REQUIRED: 'Debe seleccionar al menos un deporte',
} as const;

/**
 * Categorías de deportes disponibles
 */
export const SPORT_CATEGORIES = {
  OUTDOOR: 'Outdoor',
  TEAM: 'Team', 
  FITNESS: 'Fitness',
  WATER: 'Water',
  WINTER: 'Winter',
  PRECISION: 'Precision',
  WELLNESS: 'Wellness',
  URBAN: 'Urban',
} as const;

/**
 * Array de categorías para uso en componentes
 */
export const SPORT_CATEGORIES_LIST = [
  { value: SPORT_CATEGORIES.OUTDOOR, label: 'Outdoor' },
  { value: SPORT_CATEGORIES.TEAM, label: 'Team' },
  { value: SPORT_CATEGORIES.FITNESS, label: 'Fitness' },
  { value: SPORT_CATEGORIES.WATER, label: 'Water' },
  { value: SPORT_CATEGORIES.WINTER, label: 'Winter' },
  { value: SPORT_CATEGORIES.PRECISION, label: 'Precision' },
  { value: SPORT_CATEGORIES.WELLNESS, label: 'Wellness' },
  { value: SPORT_CATEGORIES.URBAN, label: 'Urban' },
] as const;

/**
 * Placeholders para campos de deportes
 */
export const SPORT_PLACEHOLDERS = {
  SEARCH: 'Search sports...',
  NAME: 'e.g: Padel, Rugby, Crossfit...',
  DESCRIPTION: 'Briefly describe the sport and its main characteristics...',
  CATEGORY: 'Select a category...',
  FILTER_CATEGORY: 'Filter by category',
} as const;

/**
 * Estados de carga
 */
export const LOADING_STATES = {
  LOADING: 'Loading...',
  SEARCHING: 'Searching sports...',
  CREATING: 'Creating...',
  SAVING: 'Saving...',
} as const;