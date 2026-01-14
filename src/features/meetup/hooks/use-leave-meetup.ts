import { meetupRepository } from '@/src/api/repositories';
import { Meetup } from '@/src/entities/meetup/model';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeUserMeetup } from '../storage/user-meetups-storage';

export const useLeaveMeetup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, userId, isOrganizer }: { spotId: string; meetupId: string; userId: string; isOrganizer: boolean }) => {
      if (isOrganizer) {
        return meetupRepository.deleteMeetup(spotId, meetupId, userId);
      }
      return meetupRepository.leaveMeetup(spotId, meetupId, userId);
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['meetups'] });
      await queryClient.cancelQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });

      // Snapshot the previous value
      const previousMeetups = queryClient.getQueryData<Meetup[]>(['meetups']);
      const previousMeetup = queryClient.getQueryData<Meetup>(['meetup', variables.spotId, variables.meetupId]);

      // Optimistically update to the new value
      if (variables.isOrganizer) {
        // Deleting
        if (previousMeetups) {
          queryClient.setQueryData<Meetup[]>(['meetups'], (old) => 
            old ? old.filter((m) => m.id !== variables.meetupId) : []
          );
        }
        // If we are viewing the details of the deleted meetup, we might want to redirect or clear it
        // But for the list view, removing it from the list is enough
      } else {
        // Leaving
        if (previousMeetups) {
           queryClient.setQueryData<Meetup[]>(['meetups'], (old) => 
            old ? old.map(m => m.id === variables.meetupId ? { ...m, participants: (m.participants || []).filter(id => id !== variables.userId) } : m) : []
          );
        }
        if (previousMeetup) {
          queryClient.setQueryData<Meetup>(['meetup', variables.spotId, variables.meetupId], (old) => 
            old ? { ...old, participants: (old.participants || []).filter(id => id !== variables.userId) } : old
          );
        }
      }

      // Return a context object with the snapshotted value
      return { previousMeetups, previousMeetup };
    },
    onError: (_err, variables, context) => {
      if (context?.previousMeetups) {
        queryClient.setQueryData(['meetups'], context.previousMeetups);
      }
      if (context?.previousMeetup) {
        queryClient.setQueryData(['meetup', variables.spotId, variables.meetupId], context.previousMeetup);
      }
    },
    onSuccess: async (_data, variables) => {
      // Invalidate to refetch
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
    isLeaving: (mutation as any).isLoading || (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  };
};
