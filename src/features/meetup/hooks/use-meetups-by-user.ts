import { meetupRepository } from '@/src/api/repositories';
import { useQuery } from '@tanstack/react-query';

export const useMeetupsByUser = (userId?: string) => {
  return useQuery({
    queryKey: ['meetups', 'byUser', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await meetupRepository.getMeetupsByUser(userId);
      return res;
    },
    enabled: !!userId,
  });
};
