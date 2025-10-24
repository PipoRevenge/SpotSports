import { z } from 'zod';
import { CreateSportData } from '../types/sport-types';

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

/**
 * Valida los datos para crear un deporte
 */
export const validateCreateSport = (data: CreateSportData): { success: boolean; errors?: Record<string, string> } => {
  const result = createSportSchema.safeParse(data);
  
  if (result.success) {
    return { success: true };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const field = error.path[0] as string;
    errors[field] = error.message;
  });
  
  return { success: false, errors };
};

/**
 * Valida el nombre del deporte
 */
export const validateSportName = (name: string): string | null => {
  if (!name?.trim()) {
    return 'Sport name is required';
  }
  
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }
  
  if (name.trim().length > 50) {
    return 'Name cannot be longer than 50 characters';
  }
  
  return null;
};

/**
 * Valida la descripción del deporte
 */
export const validateSportDescription = (description: string): string | null => {
  if (!description?.trim()) {
    return 'Sport description is required';
  }
  
  if (description.trim().length < 5) {
    return 'Description must be at least 5 characters long';
  }
  
  if (description.trim().length > 200) {
    return 'Description cannot be longer than 200 characters';
  }
  
  return null;
};

/**
 * Valida la categoría del deporte (opcional)
 */
export const validateSportCategory = (category?: string): string | null => {
  // La categoría es opcional
  if (!category?.trim()) {
    return null; // No hay error si está vacía
  }
  
  if (category.trim().length > 30) {
    return 'Category cannot be longer than 30 characters';
  }
  
  return null;
};

/**
 * Valida que al menos un deporte esté seleccionado
 */
export const validateSportSelection = (selectedSports: string[]): boolean => {
  return selectedSports.length > 0;
};