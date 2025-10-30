import { z } from 'zod';

/**
 * Zod schema for email validation
 */
const emailSchema = z.string()
  .trim()
  .email('Invalid email format')
  .min(1, 'Email is required');

/**
 * Zod schema for password validation
 */
const passwordSchema = z.string()
  .trim()
  .min(6, 'Password must be at least 6 characters long');

/**
 * Zod schema for username validation
 */
const usernameSchema = z.string()
  .trim()
  .min(3, 'Username must be at least 3 characters long')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(
    /^[a-zA-Z0-9-]+$/,
    'Username can only contain letters, numbers, and hyphens'
  )
  .refine(
    (val) => !val.startsWith('-') && !val.endsWith('-'),
    'Username cannot start or end with a hyphen'
  )
  .refine(
    (val) => !val.includes('--'),
    'Username cannot have consecutive hyphens'
  );

/**
 * Zod schema for birth date validation
 */
const birthDateSchema = z.date()
  .refine(
    (date) => {
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();
      return age > 14 || (age === 14 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
    },
    'You must be at least 14 years old'
  );

/**
 * Zod schema for sign in form
 */
export const signInFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Zod schema for sign up form
 */
export const signUpFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().trim(),
  username: usernameSchema,
  birthDate: birthDateSchema,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Validates email
 */
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

/**
 * Validates password
 */
export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

/**
 * Validates passwords match
 */
export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Validates username
 */
export const validateUsername = (username: string): boolean => {
  return usernameSchema.safeParse(username).success;
};

/**
 * Validates username format (alias for backward compatibility)
 */
export const validateUserNameFormat = (username: string): boolean => {
  return validateUsername(username);
};

/**
 * Generates username suggestions based on full name
 */
export const generateUserNameSuggestions = (fullName: string): string[] => {
  if (!fullName || typeof fullName !== 'string') return [];
  
  const cleanName = fullName.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanName) return [];
  
  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  const suggestions: string[] = [];
  
  if (nameParts.length >= 2) {
    const [firstName, ...restNames] = nameParts;
    const lastName = restNames[restNames.length - 1];
    
    suggestions.push(`${firstName}-${lastName}`);
    suggestions.push(`${firstName}${lastName}`);
    suggestions.push(`${firstName.charAt(0)}${lastName}`);
    
    const randomNum = Math.floor(Math.random() * 999) + 1;
    suggestions.push(`${firstName}-${lastName}${randomNum}`);
    suggestions.push(`${firstName}${lastName}${randomNum}`);
  } else if (nameParts.length === 1) {
    const name = nameParts[0];
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    
    suggestions.push(`${name}${randomNum}`);
    suggestions.push(`${name}-${randomNum}`);
  }
  
  return [...new Set(suggestions)]
    .filter(suggestion => validateUserNameFormat(suggestion))
    .slice(0, 5);
};

/**
 * Validates birth date
 */
export const validateBirthDate = (date: Date | null): boolean => {
  if (!date) return false;
  return birthDateSchema.safeParse(date).success;
};

export interface ValidationResult {
  isValid: boolean;
  errors: {
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
    username?: boolean;
    birthDate?: boolean;
  };
}

/**
 * Validates sign in form
 */
export const validateSignInForm = (email: string, password: string): ValidationResult => {
  const result = signInFormSchema.safeParse({ email, password });
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: ValidationResult['errors'] = {};
  result.error.errors.forEach((error) => {
    const field = error.path[0] as keyof ValidationResult['errors'];
    errors[field] = true;
  });

  return { isValid: false, errors };
};

/**
 * Validates sign up form
 */
export const validateSignUpForm = (
  email: string,
  password: string,
  confirmPassword: string,
  username: string,
  birthDate: Date | null
): ValidationResult => {
  const result = signUpFormSchema.safeParse({
    email,
    password,
    confirmPassword,
    username,
    birthDate,
  });
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: ValidationResult['errors'] = {};
  result.error.errors.forEach((error) => {
    const field = error.path[0] as keyof ValidationResult['errors'];
    errors[field] = true;
  });

  return { isValid: false, errors };
};