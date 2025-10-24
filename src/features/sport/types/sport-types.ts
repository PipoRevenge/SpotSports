import { Sport as DomainSport } from '@/src/entities/sport/model/sport';

// Re-exportar el tipo Sport del dominio
export type Sport = DomainSport;

// Tipo simplificado para la UI
export interface SportSimple {
  id: string;
  name: string;
}

export interface SportOption extends SportSimple {
  selected: boolean;
}

// Props para crear nuevo deporte
export interface CreateSportData {
  name: string;
  description: string; // Ahora es requerido
  category?: string;
  icon?: string;
}

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

export interface SportsSelectorRef {
  validate: () => boolean;
  getSelectedSports: () => string[];
  reset: () => void;
}

// Props para hook de búsqueda
export interface UseSportsSearchOptions {
  autoLoad?: boolean;
  searchDelay?: number;
}

// Estado del hook de deportes
export interface SportState {
  sports: SportSimple[];
  loading: boolean;
  error: string | null;
  searchResults: SportSimple[];
  searchLoading: boolean;
  searchError: string | null;
}