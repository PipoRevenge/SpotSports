import { userRepository } from '@/src/api/repositories';
import { User } from '@/src/entities/user/model/user';
import { useEffect, useState } from 'react';

export const useAllUsers = (options?: { limit?: number }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastVisible, setLastVisible] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = async (reset: boolean = true) => {
    if (reset) {
      setIsLoading(true);
      setIsLoadingMore(false);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      const res = await userRepository.getAllUsers({ limit: options?.limit, startAfter: reset ? undefined : lastVisible });
      const data = res.items;
      const last = res.lastVisible;
      if (reset) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }
      setLastVisible(last);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading all users');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAllUsers(true);
  }, []);

  const loadMore = async () => {
    if (!lastVisible || isLoadingMore) return;
    await fetchAllUsers(false);
  };

  return { users, isLoading, isLoadingMore, error, refetch: () => fetchAllUsers(true), loadMore };
};
