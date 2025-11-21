import { useUser } from '@/src/context/user-context';
import { User } from '@/src/entities/user/model/user';
import { useEffect, useState } from 'react';

interface UseProfileReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isOwn: boolean;
  refetch: () => void;
}

/**
 * Hook para obtener información de perfil
 * Si no se proporciona userId, devuelve el usuario actual
 */
export const useProfile = (userId?: string): UseProfileReturn => {
  const { user: currentUser, isLoading: currentUserLoading } = useUser();
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar si es el perfil propio
  const isOwn = !userId || userId === currentUser?.id;

  const fetchOtherUserProfile = async (targetUserId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implementar llamada real a la API
      // Por ahora simularemos con un delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Aquí iría la llamada real a la API para obtener el perfil de otro usuario
      // const response = await profileApi.getUserById(targetUserId);
      // setViewingUser(response.user);
      
      // Por ahora, devolvemos error para usuarios no encontrados
      throw new Error('Usuario no encontrado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el perfil';
      setError(errorMessage);
      setViewingUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    if (userId && userId !== currentUser?.id) {
      fetchOtherUserProfile(userId);
    }
  };

  // Solo usar useEffect para perfiles de otros usuarios
  useEffect(() => {
    if (currentUserLoading) return;
    
    // Solo hacer fetch para perfiles ajenos
    if (!isOwn && userId) {
      fetchOtherUserProfile(userId);
    }
    
    // Limpiar estado cuando cambiamos entre propio y ajeno
    if (isOwn) {
      setViewingUser(null);
      setIsLoading(false);
      setError(null);
    }
  }, [userId, currentUserLoading, isOwn]);

  return {
    user: isOwn ? currentUser : viewingUser,
    isLoading: currentUserLoading || isLoading,
    error,
    isOwn,
    refetch
  };
};