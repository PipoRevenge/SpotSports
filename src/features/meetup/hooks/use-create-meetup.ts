import { meetupRepository } from '@/src/api/repositories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMeetupFormData } from '../utils/validation';

export const useCreateMeetup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateMeetupFormData) => {
      return meetupRepository.createMeetup(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
    },
    onError: (error) => {
      console.error('Failed to create meetup:', error);
    }
  });

  return {
    createMeetup: mutation.mutate,
    createMeetupAsync: mutation.mutateAsync,
    isCreating: (mutation as any).isPending || false,
    error: (mutation.error as Error | null)?.message ?? null,
  };
};
