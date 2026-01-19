import { userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { User } from '@/src/entities/user/model/user';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UserSearchResult extends User {
  priority: number;
}

const normalize = (value?: string) => value?.toLowerCase().trim() || '';

export const useChatUserSearch = (options?: { limit?: number }) => {
  const { user: currentUser } = useUser();
  const [baseUsers, setBaseUsers] = useState<User[]>([]);
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadBaseData = useCallback(async () => {
    if (!currentUser) return;
    // Evita refetch innecesario
    if (hasLoaded) return;
    setIsLoading(true);
    setError(null);
    try {
      const limit = options?.limit || 200; // carga inicial amplia
      const [followersRes, followingRes, allUsersRes] = await Promise.all([
        userRepository.getFollowers(currentUser.id, { limit }),
        userRepository.getFollowing(currentUser.id, { limit }),
        userRepository.getAllUsers({ limit }),
      ]);
      setFollowerIds(new Set(followersRes.items.map(u => u.id)));
      setFollowingIds(new Set(followingRes.items.map(u => u.id)));
      setBaseUsers(allUsersRes.items);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, hasLoaded, options?.limit]);

  const filtered = useMemo(() => {
    const normalized = normalize(term);
    return baseUsers
      .filter(u => u.id !== currentUser?.id)
      .filter(u => {
        if (!normalized) return true;
        const userName = normalize(u.userDetails.userName);
        const fullName = normalize(u.userDetails.fullName);
        return userName.includes(normalized) || fullName.includes(normalized);
      })
      .map(u => {
        let priority = 0;
        if (followingIds.has(u.id)) priority += 2;
        if (followerIds.has(u.id)) priority += 1;
        return { ...u, priority } as UserSearchResult;
      })
      .sort((a, b) => {
        if (b.priority === a.priority) return a.userDetails.userName.localeCompare(b.userDetails.userName);
        return b.priority - a.priority;
      });
  }, [baseUsers, currentUser?.id, followerIds, followingIds, term]);

  useEffect(() => {
    setResults(filtered);
  }, [filtered]);

  // Carga inicial solo una vez
  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  const search = useCallback(
    async (nextTerm: string) => {
      setTerm(nextTerm);
      // si aún no está cargado, cargar una vez
      if (!hasLoaded) {
        await loadBaseData();
      }
    },
    [hasLoaded, loadBaseData]
  );

  return { results, isLoading, error, search };
};
