import { userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { User } from '@/src/entities/user/model/user';
import { useQuery } from '@/src/lib/react-query';

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
  const isOwn = !userId || userId === currentUser?.id;
  const query = useQuery<User | null>({
    queryKey: ['user', userId],
    enabled: !!userId && !isOwn,
    meta: { persist: true },
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!userId) return null;
      try {
        return await userRepository.getUserById(userId);
      } catch (firstError) {
        const byUsername = await userRepository.getUserByUserName(userId);
        if (byUsername) return byUsername;
        throw firstError;
      }
    },
  });

  return {
    user: isOwn ? currentUser : query.data ?? null,
    isLoading: currentUserLoading || query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    isOwn,
    refetch: query.refetch,
  };
};