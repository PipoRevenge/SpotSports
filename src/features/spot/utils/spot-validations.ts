import { GeoPoint } from '@/src/types/geopoint';
import { z } from 'zod';
import { MediaItem, SpotCreateFormData, SpotFormErrors } from "../types/spot-types";

// Regex patterns for validations
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/**
 * Zod schema for MediaItem
 */
const mediaItemSchema = z.object({
  uri: z.string().min(1, 'Media URI is required'),
  type: z.enum(['image', 'video']),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
});

/**
 * Zod schema for GeoPoint
 */
const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Zod schema for spot creation form data
 */
export const spotCreateFormSchema = z.object({
  name: z.string()
    .min(3, 'Spot name must be at least 3 characters long')
    .max(100, 'Spot name cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),
  availableSports: z.array(z.string())
    .min(1, 'At least one sport must be selected'),
  media: z.array(mediaItemSchema)
    .min(1, 'At least one photo or video must be added'),
  location: geoPointSchema.nullable()
    .refine((val) => val !== null, {
      message: 'Location must be selected on the map',
    }),
  contactPhone: z.string().optional(),
  contactEmail: z.string()
    .regex(EMAIL_REGEX, 'Invalid email format')
    .optional()
    .or(z.literal('')),
  contactWebsite: z.string()
    .regex(URL_REGEX, 'Invalid URL format')
    .optional()
    .or(z.literal('')),
});

/**
 * Validates spot name
 */
export const validateSpotName = (name: string): string | null => {
  const result = z.string()
    .min(3, 'El nombre del spot debe tener al menos 3 caracteres')
    .max(100, 'El nombre del spot no puede tener más de 100 caracteres')
    .safeParse(name?.trim());
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates spot description
 */
export const validateSpotDescription = (description: string): string | null => {
  const result = z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .safeParse(description?.trim());
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates available sports
 */
export const validateAvailableSports = (sports: string[]): string | null => {
  const result = z.array(z.string())
    .min(1, 'Debe seleccionar al menos un deporte')
    .safeParse(sports);
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates media files
 */
export const validateMedia = (media: MediaItem[]): string | null => {
  const result = z.array(mediaItemSchema)
    .min(1, 'Debe añadir al menos una foto o video del spot')
    .safeParse(media);
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates location
 */
export const validateLocation = (location: GeoPoint | null): string | null => {
  const result = geoPointSchema.nullable()
    .refine((val) => val !== null, {
      message: 'Debe seleccionar una ubicación en el mapa',
    })
    .safeParse(location);
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates contact email (optional)
 */
export const validateContactEmail = (email?: string): string | null => {
  if (!email || email.trim().length === 0) {
    return null; // Es opcional
  }
  
  const result = z.string()
    .regex(EMAIL_REGEX, 'El formato del email no es válido')
    .safeParse(email.trim());
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates contact website (optional)
 */
export const validateContactWebsite = (website?: string): string | null => {
  if (!website || website.trim().length === 0) {
    return null; // Es opcional
  }
  
  const result = z.string()
    .regex(URL_REGEX, 'El formato de la URL no es válido')
    .safeParse(website.trim());
  
  return result.success ? null : result.error.errors[0].message;
};

/**
 * Validates the entire spot creation form
 */
export const validateSpotCreateForm = (formData: SpotCreateFormData): {
  isValid: boolean;
  errors: SpotFormErrors;
} => {
  const result = spotCreateFormSchema.safeParse(formData);
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: SpotFormErrors = {};
  
  result.error.errors.forEach((error) => {
    const field = error.path[0] as keyof SpotFormErrors;
    if (!errors[field]) {
      errors[field] = error.message;
    }
  });
  
  return {
    isValid: false,
    errors
  };
};
