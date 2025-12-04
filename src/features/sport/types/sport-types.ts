import { Sport as DomainSport, SimpleSport as DomainSimpleSport } from '@/src/entities/sport/model/sport';
import { SPORT_CATEGORIES } from '../utils/sport-constants';

// Re-exportar el tipo Sport del dominio
export type Sport = DomainSport;

/**
 * Categoría de deporte
 */
export type SportCategory = typeof SPORT_CATEGORIES[keyof typeof SPORT_CATEGORIES];

/**
 * Tipo simplificado para la UI de deportes
 */
// Reusar el tipo SimpleSport del dominio para mantener consistencia
export type SportSimple = DomainSimpleSport & { category?: SportCategory };

/**
 * Deporte con estado de selección para componentes de UI
 */
export interface SportOption extends SportSimple {
  selected: boolean;
}

/**
 * Datos del formulario para crear un deporte (categoría opcional)
 */
export interface CreateSportFormData {
  name: string;
  description: string;
  category: string; // Puede estar vacío en el formulario
  icon?: string;
}

/**
 * Datos para crear un nuevo deporte (categoría procesada)
 */
export interface CreateSportData {
  name: string;
  description: string;
  category?: SportCategory; // Opcional - puede no tener categoría
  icon?: string;
}

/**
 * Props para el componente SportsSelectorModal
 */
export interface SportsSelectorProps {
  selectedSports: string[];
  onSportsChange: (selectedSports: string[]) => void;
  error?: string;
  required?: boolean;
  availableSports?: SportSimple[];
  allowCreate?: boolean;
  allowSearch?: boolean;
  onCreateSport?: (sportData: CreateSportData) => Promise<string>;
}

/**
 * Ref methods para SportsSelectorModal
 */
export interface SportsSelectorRef {
  validate: () => boolean;
  getSelectedSports: () => string[];
  reset: () => void;
}

/**
 * Filtros para búsqueda de deportes
 */
export interface SportFilters {
  query?: string;
  category?: SportCategory;
}

/**
 * Opciones de configuración para useSearchSports
 */
export interface UseSportsSearchOptions {
  autoLoad?: boolean;
  searchDelay?: number;
  defaultFilters?: SportFilters;
}

/**
 * Estado interno del hook useSearchSports
 */
export interface SportState {
  sports: SportSimple[];
  loading: boolean;
  error: string | null;
  searchResults: SportSimple[];
  searchLoading: boolean;
  searchError: string | null;
}

/**
 * Resultado del hook useSearchSports
 */
export interface UseSearchSportsResult {
  // Estado
  sports: SportSimple[];
  loading: boolean;
  error: string | null;
  searchResults: SportSimple[];
  searchLoading: boolean;
  searchError: string | null;
  
  // Acciones
  loadSports: () => Promise<void>;
  searchSports: (query: string) => Promise<void>;
  debouncedSearch: (query: string) => () => void;
  clearSearch: () => void;
  reload: () => void;
}

/**
 * Resultado del hook useSelectSports
 */
export interface UseSelectSportsResult {
  // Estado
  sportOptions: SportOption[];
  loading: boolean;
  error: string | null;
  availableSports: SportSimple[];
  
  // Acciones de selección
  toggleSport: (sportId: string) => void;
  addAndSelectSport: (sport: SportSimple) => void;
  getSelectedSports: () => string[];
  setSelectedSports: (selectedSportIds: string[]) => void;
  resetSelection: () => void;
  validateSelection: () => boolean;
  
  // Acciones de datos
  reloadSports: () => Promise<void>;
}

/**
 * Resultado del hook useCreateSport
 */
export interface UseCreateSportResult {
  // Estado
  isCreating: boolean;
  createError: string | null;
  
  // Acciones
  createSport: (sportData: CreateSportData) => Promise<string>;
  clearCreateError: () => void;
  reset: () => void;
}