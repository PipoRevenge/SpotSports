import { sportRepository } from '@/src/api/repositories';
import { useMutation, useQueryClient } from '@/src/lib/react-query';
import { CreateSportData } from '../types/sport-types';
import { SPORT_ERROR_MESSAGES } from '../utils/sport-constants';
import { validateCreateSport } from '../utils/sport-validations';

/**
 * Hook para manejar la creación de deportes
 * Encapsula toda la lógica de negocio para crear nuevos deportes
 */
export const useCreateSport = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sportData: CreateSportData): Promise<string> => {
      const validation = validateCreateSport(sportData);
      if (!validation.success) {
        const firstError = Object.values(validation.errors!)[0];
        throw new Error(firstError);
      }

      const sportId = await sportRepository.createSport({
        name: sportData.name.trim(),
        description: sportData.description.trim(),
        category: sportData.category,
        icon: sportData.icon,
      }, 'user'); // TODO: inyectar userId real
      return sportId;
    },
    onSuccess: async (sportId, sportData) => {
      console.log(`✅ Deporte creado: ${sportData.name} (${sportId})`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sports'] }),
        queryClient.invalidateQueries({ queryKey: ['sports', 'all'] }),
      ]);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : SPORT_ERROR_MESSAGES.CREATE_ERROR;
      console.error('❌ Error al crear deporte:', error);
      throw new Error(errorMessage);
    },
    retry: 0,
  });

  return {
    isCreating: mutation.isPending,
    createError: (mutation.error as Error | null)?.message ?? null,
    createSport: mutation.mutateAsync,
    clearCreateError: () => mutation.reset(),
    reset: () => mutation.reset(),
  };
};