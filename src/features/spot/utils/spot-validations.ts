import { GeoPoint } from '@/src/types/geopoint';
import { z } from 'zod';
import { MediaItem, SpotCreateFormData } from "../types/spot-types";

export type ValidationErrors = Record<string, string>;
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

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
    .min(3, 'Spot name must be at least 3 characters long')
    .max(100, 'Spot name cannot exceed 100 characters')
    .safeParse(name?.trim());
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid name';
};

/**
 * Validates spot description
 */
export const validateSpotDescription = (description: string): string | null => {
  const result = z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description cannot exceed 500 characters')
    .safeParse(description?.trim());
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid description';
};

/**
 * Validates available sports
 */
export const validateAvailableSports = (sports: string[]): string | null => {
  const result = z.array(z.string())
    .min(1, 'At least one sport must be selected')
    .safeParse(sports);
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid sport';
};

/**
 * Validates media files
 */
export const validateMedia = (media: MediaItem[]): string | null => {
  const result = z.array(mediaItemSchema)
    .min(1, 'At least one photo or video must be added')
    .safeParse(media);
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid media';
};

/**
 * Validates location
 */
export const validateLocation = (location: GeoPoint | null): string | null => {
  const result = geoPointSchema.nullable()
    .refine((val) => val !== null, {
      message: 'Location must be selected on the map',
    })
    .safeParse(location);
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid location';
};

/**
 * Validates contact email (optional)
 */
export const validateContactEmail = (email?: string): string | null => {
  if (!email || email.trim().length === 0) {
    return null; // Es opcional
  }
  
  const result = z.string()
    .regex(EMAIL_REGEX, 'Invalid email format')
    .safeParse(email.trim());
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid email';
};

/**
 * Validates contact website (optional)
 */
export const validateContactWebsite = (website?: string): string | null => {
  if (!website || website.trim().length === 0) {
    return null; // Es opcional
  }
  
  const result = z.string()
    .regex(URL_REGEX, 'Invalid URL format')
    .safeParse(website.trim());
  
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid URL';
};

/**
 * Validates the entire spot creation form
 */
export const validateSpotCreateForm = (formData: SpotCreateFormData): {
  isValid: boolean;
  errors: ValidationErrors;
} => {
  const result = spotCreateFormSchema.safeParse(formData);
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: ValidationErrors = {};
  
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });
  
  return {
    isValid: false,
    errors
  };
};
