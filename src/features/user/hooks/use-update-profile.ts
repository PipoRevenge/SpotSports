import { userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { User } from '@/src/entities/user/model/user';
import { useCallback, useState } from 'react';
import { ProfileUpdateData } from '../types/profile-types';
import { validateProfileData } from '../utils/profile-validation';

interface UseUpdateProfileReturn {
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  isUpdating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook para actualizar información de perfil
 */
export const useUpdateProfile = (): UseUpdateProfileReturn => {
  const { user, setUser } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: ProfileUpdateData): Promise<boolean> => {
    if (!user) {
      setError('No hay usuario autenticado');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Validar los datos antes de enviar
      const validation = validateProfileData(data);
      if (!validation.isValid) {
        setError(validation.error || 'Datos inválidos');
        return false;
      }

      // Preparar los datos para la API
      // La API espera un objeto Partial<User>, necesitamos estructurarlo correctamente
      const updateData: Partial<User> = {
        userDetails: {
          ...user.userDetails,
          ...data
          // birthDate is not included - it remains unchanged for security
        }
      };

      // Llamar a la API para actualizar el perfil
      const updatedUser = await userRepository.updateUserProfile(user.id, updateData);

      // Actualizar el contexto del usuario con los datos devueltos por la API
      setUser(updatedUser);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el perfil';
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateProfile,
    isUpdating,
    error,
    clearError
  };
};