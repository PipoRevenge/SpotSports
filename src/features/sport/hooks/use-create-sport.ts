import { sportRepository } from '@/src/api/repositories';
import { useCallback, useState } from 'react';
import { CreateSportData } from '../types/sport-types';
import { SPORT_ERROR_MESSAGES } from '../utils/sport-constants';
import { validateCreateSport } from '../utils/sport-validations';

/**
 * Hook para manejar la creación de deportes
 * Encapsula toda la lógica de negocio para crear nuevos deportes
 */
export const useCreateSport = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /**
   * Crea un nuevo deporte
   */
  const createSport = useCallback(async (sportData: CreateSportData): Promise<string> => {
    // Validar datos antes de enviar
    const validation = validateCreateSport(sportData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors!)[0];
      throw new Error(firstError);
    }

    setIsCreating(true);
    setCreateError(null);
    
    try {
      const sportId = await sportRepository.createSport({
        name: sportData.name.trim(),
        description: sportData.description.trim(),
        category: sportData.category, // Opcional
        icon: sportData.icon,
      }, 'user'); // TODO: Obtener el ID del usuario actual desde contexto de auth

      console.log(`✅ Deporte creado exitosamente: ${sportData.name} (${sportId})`);
      return sportId;
    } catch (error: any) {
      const errorMessage = error.message || SPORT_ERROR_MESSAGES.CREATE_ERROR;
      setCreateError(errorMessage);
      console.error('❌ Error al crear deporte:', error);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Limpia el error de creación
   */
  const clearCreateError = useCallback(() => {
    setCreateError(null);
  }, []);

  /**
   * Resetea el estado del hook
   */
  const reset = useCallback(() => {
    setIsCreating(false);
    setCreateError(null);
  }, []);

  return {
    // Estado
    isCreating,
    createError,
    
    // Acciones
    createSport,
    clearCreateError,
    reset,
  };
};