import { SpotCreateFormData, SpotFormErrors } from "../types/spot-types";

// Regex patterns para validaciones
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Mensajes de validación
export const SPOT_VALIDATION_MESSAGES = {
  name: {
    required: "El nombre del spot es obligatorio",
    minLength: "El nombre debe tener al menos 3 caracteres",
    maxLength: "El nombre no puede tener más de 100 caracteres"
  },
  description: {
    required: "La descripción es obligatoria",
    minLength: "La descripción debe tener al menos 10 caracteres",
    maxLength: "La descripción no puede tener más de 500 caracteres"
  },
  availableSports: {
    required: "Debe seleccionar al menos un deporte"
  },
  media: {
    required: "Debe añadir al menos una foto o video del spot"
  },
  location: {
    required: "Debe seleccionar una ubicación en el mapa"
  },
  contactEmail: {
    invalid: "El formato del email no es válido"
  },
  contactWebsite: {
    invalid: "El formato de la URL no es válido"
  }
} as const;

/**
 * Valida el nombre del spot
 */
export const validateSpotName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return SPOT_VALIDATION_MESSAGES.name.required;
  }
  
  if (name.trim().length < 3) {
    return SPOT_VALIDATION_MESSAGES.name.minLength;
  }
  
  if (name.trim().length > 100) {
    return SPOT_VALIDATION_MESSAGES.name.maxLength;
  }
  
  return null;
};

/**
 * Valida la descripción del spot
 */
export const validateSpotDescription = (description: string): string | null => {
  if (!description || description.trim().length === 0) {
    return SPOT_VALIDATION_MESSAGES.description.required;
  }
  
  if (description.trim().length < 10) {
    return SPOT_VALIDATION_MESSAGES.description.minLength;
  }
  
  if (description.trim().length > 500) {
    return SPOT_VALIDATION_MESSAGES.description.maxLength;
  }
  
  return null;
};

/**
 * Valida los deportes disponibles
 */
export const validateAvailableSports = (sports: string[]): string | null => {
  if (!sports || sports.length === 0) {
    return SPOT_VALIDATION_MESSAGES.availableSports.required;
  }
  
  return null;
};

/**
 * Valida los archivos multimedia
 */
export const validateMedia = (media: any[]): string | null => {
  if (!media || media.length === 0) {
    return SPOT_VALIDATION_MESSAGES.media.required;
  }
  
  return null;
};

/**
 * Valida la ubicación
 */
export const validateLocation = (location: any): string | null => {
  if (!location || !location.latitude || !location.longitude) {
    return SPOT_VALIDATION_MESSAGES.location.required;
  }
  
  return null;
};

/**
 * Valida el email de contacto (opcional)
 */
export const validateContactEmail = (email?: string): string | null => {
  if (!email || email.trim().length === 0) {
    return null; // Es opcional
  }
  
  if (!EMAIL_REGEX.test(email.trim())) {
    return SPOT_VALIDATION_MESSAGES.contactEmail.invalid;
  }
  
  return null;
};

/**
 * Valida la URL del website (opcional)
 */
export const validateContactWebsite = (website?: string): string | null => {
  if (!website || website.trim().length === 0) {
    return null; // Es opcional
  }
  
  if (!URL_REGEX.test(website.trim())) {
    return SPOT_VALIDATION_MESSAGES.contactWebsite.invalid;
  }
  
  return null;
};

/**
 * Valida todo el formulario de creación de spot
 */
export const validateSpotCreateForm = (formData: SpotCreateFormData): {
  isValid: boolean;
  errors: SpotFormErrors;
} => {
  const errors: SpotFormErrors = {};
  
  // Validar nombre
  const nameError = validateSpotName(formData.name);
  if (nameError) errors.name = nameError;
  
  // Validar descripción
  const descriptionError = validateSpotDescription(formData.description);
  if (descriptionError) errors.description = descriptionError;
  
  // Validar deportes disponibles
  const sportsError = validateAvailableSports(formData.availableSports);
  if (sportsError) errors.availableSports = sportsError;
  
  // Validar media
  const mediaError = validateMedia(formData.media);
  if (mediaError) errors.media = mediaError;
  
  // Validar ubicación
  const locationError = validateLocation(formData.location);
  if (locationError) errors.location = locationError;
  
  // Validar email de contacto (opcional)
  const emailError = validateContactEmail(formData.contactEmail);
  if (emailError) errors.contactEmail = emailError;
  
  // Validar website de contacto (opcional)
  const websiteError = validateContactWebsite(formData.contactWebsite);
  if (websiteError) errors.contactWebsite = websiteError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
