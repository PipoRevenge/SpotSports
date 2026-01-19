import { meetupRepository } from '@/src/api/repositories';
import { scheduleMeetupLocalNotification } from '@/src/features/notification/hooks/use-local-meetup-notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveUserMeetup, StoredUserMeetup } from '../storage/user-meetups-storage';

export const useJoinMeetup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, userId }: { spotId: string; meetupId: string; userId: string }) => {
      return meetupRepository.joinMeetup(spotId, meetupId, userId);
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      queryClient.invalidateQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });

      // If joined (not requested), fetch meetup details and persist locally for notifications
      try {
        if (data && (data as any).status === 'joined') {
          const m = await meetupRepository.getMeetupById(variables.spotId, variables.meetupId);
          if (m) {
            const stored: StoredUserMeetup = {
              id: m.id,
              spotId: m.spotId,
              title: m.title,
              date: m.date ? new Date(m.date).getTime() : undefined,
              nextDate: (m as any).nextDate ? new Date((m as any).nextDate).getTime() : undefined,
              sport: (m as any).sport ?? null,
              organizerId: m.organizerId ?? null,
              updatedAt: Date.now(),
            };
            // Save to local storage
            await saveUserMeetup(variables.userId, stored);
            console.debug('[useJoinMeetup] saved meetup to local storage', stored);

            // Schedule local notification for 1h before meetup
            await scheduleMeetupLocalNotification(stored, variables.userId);
          }
        }
      } catch (e) {
        console.debug('[useJoinMeetup] error saving meetup locally', e);
      }

      return data;
    },
  });

  return {
    join: mutation.mutate,
    joinAsync: mutation.mutateAsync,
    isJoining: (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  } as const;
};