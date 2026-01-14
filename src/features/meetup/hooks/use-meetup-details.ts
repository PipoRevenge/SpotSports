import { meetupRepository } from '@/src/api/repositories';
import { Meetup } from '@/src/entities/meetup/model';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useMeetupDetails = (spotId?: string, meetupId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<Meetup | null, Error>({
    queryKey: ['meetup', spotId, meetupId],
    queryFn: () => (spotId && meetupId ? meetupRepository.getMeetupById(spotId, meetupId) : Promise.resolve(null)),
    enabled: !!spotId && !!meetupId,
  });

  const fetchMeetupById = async (sId: string, mId: string) => {
    // This helper is intended to be used by components when they need the latest data after mutations
    const data = await queryClient.fetchQuery({ queryKey: ['meetup', sId, mId], queryFn: () => meetupRepository.getMeetupById(sId, mId) });
    return data as Meetup | null;
  };

  return {
    ...query,
    fetchMeetupById,
  };
};
