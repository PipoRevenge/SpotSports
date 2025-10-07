import { useUser } from '@/src/context/user-context';
import { UserDetails } from '@/src/types/user';
import { useState } from 'react';
import { validateProfileData } from '../utils/profile-validation';


interface UseUpdateProfileOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UpdateProfileData {
  fullName?: string;
  bio?: string;
  birthDate?: string;
  phoneNumber?: string;
  photoURL?: string;
}

export const useUpdateProfile = (options: UseUpdateProfileOptions = {}) => {
  const { user, updateUserProfile, refreshUserProfile } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (profileData: UpdateProfileData) => {
    if (!user) {
      const errorMessage = 'Usuario no encontrado';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Validar datos del perfil
      const validationResult = validateProfileData(profileData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // Actualizar perfil
      await updateUserProfile(profileData as Partial<UserDetails>);
      
      // Refrescar datos del usuario desde Firebase
      await refreshUserProfile();

      options.onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el perfil';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    updateProfile,
    isLoading,
    error,
    clearError,
    user,
  };
};