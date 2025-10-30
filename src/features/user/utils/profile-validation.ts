import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface ProfileData {
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  photoURL?: string;
}

/**
 * Zod schema for full name validation
 */
const fullNameSchema = z.string()
  .min(2, 'Full name must be at least 2 characters long')
  .max(50, 'Full name cannot exceed 50 characters')
  .regex(
    /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/,
    'Full name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .trim();

/**
 * Zod schema for bio validation
 */
const bioSchema = z.string()
  .max(500, 'Bio cannot exceed 500 characters')
  .optional();

/**
 * Zod schema for phone number validation
 */
const phoneNumberSchema = z.string()
  .transform((val) => val.replace(/[\s\-\(\)]/g, ''))
  .refine(
    (val) => /^[\+]?[1-9][\d]{6,14}$/.test(val),
    'Invalid phone number format'
  )
  .optional()
  .or(z.literal(''));

/**
 * Zod schema for birth date validation
 */
const birthDateSchema = z.string()
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    'Invalid birth date'
  )
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      return date <= now;
    },
    'Birth date cannot be in the future'
  )
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      const minAge = 13;
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - minAge);
      return date <= minDate;
    },
    'You must be at least 13 years old'
  )
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      const maxAge = 120;
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() - maxAge);
      return date >= maxDate;
    },
    'Birth date does not seem valid'
  )
  .optional();

/**
 * Complete profile data schema
 */
export const profileDataSchema = z.object({
  fullName: fullNameSchema,
  bio: bioSchema,
  phoneNumber: phoneNumberSchema,
  photoURL: z.string().url('Invalid photo URL').optional(),
});

/**
 * Validates full name
 */
export const validateFullName = (fullName?: string): ValidationResult => {
  if (!fullName || fullName.trim().length === 0) {
    return { isValid: false, error: 'Full name is required' };
  }

  const result = fullNameSchema.safeParse(fullName);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error.errors[0].message
  };
};

/**
 * Validates bio
 */
export const validateBio = (bio?: string): ValidationResult => {
  const result = bioSchema.safeParse(bio);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error.errors[0].message
  };
};

/**
 * Validates phone number
 */
export const validatePhoneNumber = (phoneNumber?: string): ValidationResult => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return { isValid: true }; // Phone is optional
  }

  const result = phoneNumberSchema.safeParse(phoneNumber);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error.errors[0].message
  };
};

/**
 * Validates birth date
 */
export const validateBirthDate = (birthDate?: string): ValidationResult => {
  if (!birthDate) {
    return { isValid: true }; // Birth date is optional
  }

  const result = birthDateSchema.safeParse(birthDate);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error.errors[0].message
  };
};

/**
 * Main validation for all profile data
 */
export const validateProfileData = (profileData: ProfileData): ValidationResult => {
  const result = profileDataSchema.safeParse(profileData);
  
  if (result.success) {
    return { isValid: true };
  }
  
  const fieldErrors: Record<string, string> = {};
  
  result.error.errors.forEach((error) => {
    const field = error.path[0] as string;
    if (!fieldErrors[field]) {
      fieldErrors[field] = error.message;
    }
  });
  
  const firstError = Object.values(fieldErrors)[0];
  
  return {
    isValid: false,
    error: firstError,
    fieldErrors
  };
};

/**
 * Utility to clean phone number
 */
export const cleanPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/[\s\-\(\)]/g, '');
};

/**
 * Utility to format full name (capitalize first letter of each word)
 */
export const formatFullName = (fullName: string): string => {
  return fullName
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};