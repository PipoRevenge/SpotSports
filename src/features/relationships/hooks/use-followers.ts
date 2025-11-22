import { userRepository } from '@/src/api/repositories';
import { User } from '@/src/entities/user/model/user';
import { useEffect, useState } from 'react';

interface PaginatedUsers {
  users: User[];
  lastVisible?: any;
}

export const useFollowers = (userId?: string, options?: { limit?: number }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastVisible, setLastVisible] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = async (reset: boolean = true) => {
    if (!userId) return;
    if (reset) {
      setIsLoading(true);
      setIsLoadingMore(false);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      const res = await userRepository.getFollowers(userId, { limit: options?.limit, startAfter: reset ? undefined : lastVisible });
      const data = res.items;
      const last = res.lastVisible;
      if (reset) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }
      setLastVisible(last);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando seguidores');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFollowers(true);
  }, [userId]);

  const loadMore = async () => {
    if (!lastVisible || isLoadingMore) return;
    await fetchFollowers(false);
  };

  return { users, isLoading, isLoadingMore, error, refetch: () => fetchFollowers(true), loadMore };
};
