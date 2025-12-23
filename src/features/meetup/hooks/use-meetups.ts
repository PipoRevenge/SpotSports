import { meetupRepository } from '@/src/api/repositories';
import { MeetupFilters } from '@/src/api/repositories/interfaces/i-meetup-repository';
import { Meetup } from '@/src/entities/meetup';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

export const useMeetups = (spotId: string, filters?: MeetupFilters) => {
  const filtersKey = React.useMemo(() => {
    if (!filters) return null;
    return {
      ...filters,
      dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : null,
      dateTo: filters.dateTo ? filters.dateTo.toISOString() : null,
      sports: filters.sports ?? [],
    };
  }, [filters]);

  return useQuery<Meetup[], Error>({
    queryKey: ['meetups', 'list', spotId, filtersKey],
    queryFn: () => meetupRepository.getMeetupsBySpot(spotId, filters),
    enabled: !!spotId,
  });
};
