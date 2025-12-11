import { z } from 'zod';

export type ValidationErrors = Record<string, string>;
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
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

// ============ Field-level helpers ============

export const validateFullNameField = (fullName?: string): string | null => {
  const parsed = fullNameSchema.safeParse(fullName);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid full name';
};

export const validateBioField = (bio?: string): string | null => {
  const parsed = bioSchema.safeParse(bio);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid bio';
};

export const validatePhoneNumberField = (phoneNumber?: string): string | null => {
  const parsed = phoneNumberSchema.safeParse(phoneNumber);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid phone number';
};

export const validateBirthDateField = (birthDate?: string): string | null => {
  if (!birthDate) return null; // optional
  const parsed = birthDateSchema.safeParse(birthDate);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid birth date';
};

// ============ Form validator ============

export const validateProfileForm = (profileData: ProfileData): ValidationResult => {
  const result = profileDataSchema.safeParse(profileData);
  if (result.success) return { isValid: true, errors: {} };

  const errors: ValidationErrors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message;
    }
  });

  return { isValid: false, errors };
};

/**
 * Validates full name
 */
export const validateFullName = (fullName?: string): ValidationResult => {
  const error = validateFullNameField(fullName);
  return { isValid: !error, errors: error ? { fullName: error } : {} };
};

/**
 * Validates bio
 */
export const validateBio = (bio?: string): ValidationResult => {
  const error = validateBioField(bio);
  return { isValid: !error, errors: error ? { bio: error } : {} };
};

/**
 * Validates phone number
 */
export const validatePhoneNumber = (phoneNumber?: string): ValidationResult => {
  const error = validatePhoneNumberField(phoneNumber);
  return { isValid: !error, errors: error ? { phoneNumber: error } : {} };
};

/**
 * Validates birth date
 */
export const validateBirthDate = (birthDate?: string): ValidationResult => {
  const error = validateBirthDateField(birthDate);
  return { isValid: !error, errors: error ? { birthDate: error } : {} };
};

/**
 * Main validation for all profile data
 */
export const validateProfileData = (profileData: ProfileData): ValidationResult => {
  return validateProfileForm(profileData);
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