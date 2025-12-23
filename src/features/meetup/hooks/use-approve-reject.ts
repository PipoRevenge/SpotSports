import { meetupRepository } from '@/src/api/repositories';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useApproveRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, requesterId, approverId }: { spotId: string; meetupId: string; requesterId: string; approverId: string }) => {
      return meetupRepository.approveJoinRequest(spotId, meetupId, requesterId, approverId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      queryClient.invalidateQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });
    }
  });

  return {
    approve: mutation.mutate,
    approveAsync: mutation.mutateAsync,
    isApproving: mutation.isLoading || (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  };
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ spotId, meetupId, requesterId, approverId }: { spotId: string; meetupId: string; requesterId: string; approverId: string }) => {
      return meetupRepository.rejectJoinRequest(spotId, meetupId, requesterId, approverId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      queryClient.invalidateQueries({ queryKey: ['meetup', variables.spotId, variables.meetupId] });
    }
  });

  return {
    reject: mutation.mutate,
    rejectAsync: mutation.mutateAsync,
    isRejecting: mutation.isLoading || (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  };
};
