import { userRepository } from '@/src/api/repositories';
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
      // Intentar obtener el usuario por ID desde el repo
      try {
        const foundUser = await userRepository.getUserById(targetUserId);
        setViewingUser(foundUser);
        return;
      } catch (firstError) {
        // If not found by ID, attempt to fetch by username
        const byUsername = await userRepository.getUserByUserName(targetUserId);
        if (byUsername) {
          setViewingUser(byUsername);
          return;
        }
        // else rethrow to be caught by outer catch
        throw firstError;
      }
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