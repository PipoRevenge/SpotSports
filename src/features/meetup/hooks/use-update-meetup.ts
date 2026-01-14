import { meetupRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Meetup } from '@/src/entities/meetup/model';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateMeetup = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, data, requesterId }: { spotId: string; meetupId: string; data: Partial<Meetup>; requesterId?: string }) => {
      return meetupRepository.updateMeetup(spotId, meetupId, data, requesterId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      queryClient.invalidateQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });
    },
  });

  return {
    update: (payload: { spotId: string; meetupId: string; data: Partial<Meetup>; requesterId?: string }) => mutation.mutate(payload),
    updateAsync: (payload: { spotId: string; meetupId: string; data: Partial<Meetup>; requesterId?: string }) => mutation.mutateAsync(payload),
    isUpdating: (mutation as any).isLoading || (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
    currentUserId: user?.id ?? null,
  } as const;
};
