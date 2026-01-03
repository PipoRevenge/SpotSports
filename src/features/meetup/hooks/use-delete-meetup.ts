import { meetupRepository } from '@/src/api/repositories';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteMeetup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, userId }: { spotId: string; meetupId: string; userId: string }) => {
      return meetupRepository.deleteMeetup(spotId, meetupId, userId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      queryClient.invalidateQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });
    },
  });

  return {
    deleteMeetup: mutation.mutate,
    deleteMeetupAsync: mutation.mutateAsync,
    isDeleting: (mutation as any).isLoading || (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  };
};
