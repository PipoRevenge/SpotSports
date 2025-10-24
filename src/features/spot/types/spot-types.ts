import { GeoPoint } from "@/src/types/geopoint";
import React from "react";

// Form data para creación de spot
export interface SpotCreateFormData {
  name: string;
  description: string;
  availableSports: string[];
  media: string[];
  location: GeoPoint | null;
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
}

// Estado del formulario
export interface SpotFormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Errores de validación del formulario
export interface SpotFormErrors {
  name?: string;
  description?: string;
  availableSports?: string;
  location?: string;
  contactEmail?: string;
  contactWebsite?: string;
}

// Props para el slot de selección de deportes
export interface SportsSlotProps {
  selectedSports: string[];
  onSportsChange: (selectedSports: string[]) => void;
  error?: string;
}

// Props para componentes
export interface SpotCreateFormProps {
  onSuccess?: (spotId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<SpotCreateFormData>;
  sportsSlot?: React.ComponentType<SportsSlotProps>;
}
