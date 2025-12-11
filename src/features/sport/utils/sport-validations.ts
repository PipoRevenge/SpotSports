import { z } from 'zod';
import { CreateSportData } from '../types/sport-types';

export type ValidationErrors = Record<string, string>;
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

/**
 * Esquema de validación para crear un deporte
 */
export const createSportSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot be longer than 50 characters')
    .trim(),
  description: z.string()
    .min(5, 'Description must be at least 5 characters long')
    .max(200, 'Description cannot be longer than 200 characters')
    .trim(),
  category: z.string()
    .optional(), // Optional - can be without category
  icon: z.string().optional(),
});

// ============ Field-level helpers ============

export const validateSportNameField = (name: string): string | null => {
  const parsed = createSportSchema.shape.name.safeParse(name);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid sport name';
};

export const validateSportDescriptionField = (description: string): string | null => {
  const parsed = createSportSchema.shape.description.safeParse(description);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid sport description';
};

export const validateSportCategoryField = (category?: string): string | null => {
  const parsed = createSportSchema.shape.category.safeParse(category);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? null;
};

// ============ Form validator ============

export const validateSportForm = (data: CreateSportData): ValidationResult => {
  const result = createSportSchema.safeParse(data);
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
 * Valida los datos para crear un deporte
 */
export const validateCreateSport = (data: CreateSportData): { success: boolean; errors?: Record<string, string> } => {
  const result = validateSportForm(data);
  return result.isValid ? { success: true } : { success: false, errors: result.errors };
};

/**
 * Valida el nombre del deporte
 */
export const validateSportName = (name: string): string | null => validateSportNameField(name);

/**
 * Valida la descripción del deporte
 */
export const validateSportDescription = (description: string): string | null => validateSportDescriptionField(description);

/**
 * Valida la categoría del deporte (opcional)
 */
export const validateSportCategory = (category?: string): string | null => validateSportCategoryField(category);

/**
 * Valida que al menos un deporte esté seleccionado
 */
export const validateSportSelection = (selectedSports: string[]): boolean => {
  return selectedSports.length > 0;
};