import { meetupRepository } from '@/src/api/repositories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/src/context/user-context';
import { CreateMeetupFormData } from '../utils/validation';

export const useCreateMeetup = () => {
  const queryClient = useQueryClient();
  const { setUser } = useUser();

  const mutation = useMutation({
    mutationFn: async (data: CreateMeetupFormData) => {
      return meetupRepository.createMeetup(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetups'] });
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          activity: {
            ...prev.activity,
            meetupsCount: (prev.activity?.meetupsCount || 0) + 1,
          }
        };
      });
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
