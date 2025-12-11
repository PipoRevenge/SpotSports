import { z } from 'zod';

// Validation result shape used across features
export type ValidationErrors = Record<string, string>;
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

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

// ============ Field-level validators (return string | null) ============

export const validateEmailField = (email: string): string | null => {
  const result = emailSchema.safeParse(email);
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid email';
};

export const validatePasswordField = (password: string): string | null => {
  const result = passwordSchema.safeParse(password);
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid password';
};

export const validateUsernameField = (username: string): string | null => {
  const result = usernameSchema.safeParse(username);
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid username';
};

export const validateBirthDateField = (date: Date | null): string | null => {
  if (!date) return 'Birth date is required';
  const result = birthDateSchema.safeParse(date);
  return result.success ? null : result.error.issues[0]?.message ?? 'Invalid birth date';
};

// ============ Form validators (return unified shape) ============

export const validateSignIn = (payload: { email: string; password: string }): ValidationResult => {
  const result = signInFormSchema.safeParse(payload);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  const errors: ValidationErrors = {};
  result.error.issues.forEach((err) => {
    const field = err.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = err.message;
    }
  });
  return { isValid: false, errors };
};

export const validateSignUp = (payload: { email: string; password: string; confirmPassword: string; username: string; birthDate: Date | null }): ValidationResult => {
  const result = signUpFormSchema.safeParse(payload);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  const errors: ValidationErrors = {};
  result.error.issues.forEach((err) => {
    const field = err.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = err.message;
    }
  });
  return { isValid: false, errors };
};

/**
/**
 * @deprecated Use validateEmailField which returns string | null
 */
export const validateEmail = (email: string): boolean => emailSchema.safeParse(email).success;

/**
 * @deprecated Use validatePasswordField which returns string | null
 */
export const validatePassword = (password: string): boolean => passwordSchema.safeParse(password).success;

/**
 * @deprecated Prefer validateSignUp to surface field errors
 */
export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * @deprecated Use validateUsernameField which returns string | null
 */
export const validateUsername = (username: string): boolean => usernameSchema.safeParse(username).success;

/**
 * @deprecated Use validateUsernameField; kept for backward compatibility
 */
export const validateUserNameFormat = (username: string): boolean => validateUsername(username);

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
/**
 * @deprecated Use validateBirthDateField which returns string | null
 */
export const validateBirthDate = (date: Date | null): boolean => {
  if (!date) return false;
  return birthDateSchema.safeParse(date).success;
};

/**
 * @deprecated Use validateSignIn which returns field messages
 */
export const validateSignInForm = (email: string, password: string): ValidationResult => {
  const { isValid, errors } = validateSignIn({ email, password });
  return { isValid, errors };
};

/**
 * @deprecated Use validateSignUp which returns field messages
 */
export const validateSignUpForm = (
  email: string,
  password: string,
  confirmPassword: string,
  username: string,
  birthDate: Date | null
): ValidationResult => {
  const { isValid, errors } = validateSignUp({ email, password, confirmPassword, username, birthDate });
  return { isValid, errors };
};