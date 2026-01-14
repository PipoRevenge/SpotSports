import { meetupRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Meetup } from '@/src/entities/meetup/model';
import { MeetupFilters, MeetupSortOptions } from '@/src/features/meetup/types/meetup-filter-types';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

export const useMeetups = (
  spotId?: string, 
  filters?: MeetupFilters, 
  sort?: MeetupSortOptions
) => {
  const { user } = useUser();
  const userId = user?.id;

  const filtersKey = React.useMemo(() => {
    if (!filters) return null;
    return {
      ...filters,
      dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : null,
      dateTo: filters.dateTo ? filters.dateTo.toISOString() : null,
      sports: filters.sports ?? [],
    };
  }, [filters]);

  const sortKey = React.useMemo(() => sort?.field || 'nearestDate', [sort]);

  return useQuery<Meetup[], Error>({
    queryKey: ['meetups', 'list', spotId, filtersKey, sortKey, userId],
    queryFn: () => meetupRepository.getMeetups({ 
      spotId, 
      filters, 
      sort: sort || { field: 'nearestDate' },
      userId 
    }),
    enabled: !!spotId || !!filters?.spotId,
    staleTime: 1 * 60_000, // 1 minute
    gcTime: 5 * 60_000,
  });
};
