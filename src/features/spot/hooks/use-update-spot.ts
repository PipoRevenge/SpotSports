import { spotRepository } from '@/src/api/repositories';
import { parseFirebaseError } from '@/src/api/repositories/utils/firebase-parsers';
import { useUser } from '@/src/context/user-context';
import { SpotDetails } from '@/src/entities/spot/model/spot';
import { useMutation, useQueryClient } from '@/src/lib/react-query';
import { useState } from 'react';

export const useUpdateSpot = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [state, setState] = useState({ isLoading: false, error: null as string | null, success: false });

  const mutation = useMutation({
    mutationFn: async ({ spotId, spotData }: { spotId: string; spotData: Partial<SpotDetails> }) => {
      if (!user || !user.id) throw new Error('Authentication required');
      return await spotRepository.updateSpot(spotId, spotData, user.id);
    },
    onMutate: () => setState({ isLoading: true, error: null, success: false }),
    onSuccess: async (_data, variables) => {
      setState({ isLoading: false, error: null, success: true });
      await queryClient.invalidateQueries({ queryKey: ['spot', variables.spotId] });
      await queryClient.invalidateQueries({ queryKey: ['spots'] });
    },
    onError: (err) => {
      const parsed = parseFirebaseError(err);
      setState({ isLoading: false, error: parsed.message, success: false });
    },
    retry: 0,
  });

  const updateSpot = async (spotId: string, spotData: Partial<SpotDetails>) => {
    try {
      await mutation.mutateAsync({ spotId, spotData });
    } catch {
      // swallow, state has error already
    }
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));

  return {
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    updateSpot,
    clearError,
  } as const;
};
