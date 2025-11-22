import { userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { useEffect, useState } from 'react';

export const useFollow = (targetUserId?: string) => {
  const { user: currentUser, emitFollowEvent } = useUser();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIsFollowing = async () => {
      if (!currentUser || !targetUserId) return;
      try {
        const res = await userRepository.isFollowing(currentUser.id, targetUserId);
        setIsFollowing(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      }
    };
    fetchIsFollowing();
  }, [currentUser, targetUserId]);

  const toggleFollow = async (): Promise<boolean | undefined> => {
    if (!currentUser || !targetUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isFollowing) {
      await userRepository.unfollowUser(currentUser.id, targetUserId);
        setIsFollowing(false);
        if (typeof emitFollowEvent === 'function') {
          emitFollowEvent({ targetUserId, followerId: currentUser.id, isFollowing: false });
        }
        return false;
      } else {
        await userRepository.followUser(currentUser.id, targetUserId);
        setIsFollowing(true);
        if (typeof emitFollowEvent === 'function') {
          emitFollowEvent({ targetUserId, followerId: currentUser.id, isFollowing: true });
        }
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling follow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, isLoading, error, toggleFollow };
};
