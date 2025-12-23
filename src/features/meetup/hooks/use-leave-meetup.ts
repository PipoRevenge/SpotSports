import { meetupRepository } from '@/src/api/repositories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeUserMeetup } from '../storage/user-meetups-storage';

export const useLeaveMeetup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, userId }: { spotId: string; meetupId: string; userId: string }) => {
      return meetupRepository.leaveMeetup(spotId, meetupId, userId);
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      queryClient.invalidateQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });
      try {
        await removeUserMeetup(variables.userId, variables.meetupId);
        console.debug('[useLeaveMeetup] removed meetup from local storage', variables.meetupId);
      } catch (e) {
        console.debug('[useLeaveMeetup] error removing meetup locally', e);
      }
    },
  });

  return {
    leave: mutation.mutate,
    leaveAsync: mutation.mutateAsync,
    isLeaving: mutation.isLoading || (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  };
};
