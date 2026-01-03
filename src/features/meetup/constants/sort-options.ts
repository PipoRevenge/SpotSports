/**
 * Meetup Sort Options and Constants
 * 
 * Constants and utilities for sorting meetups
 */

import { MeetupSortField } from '@/src/features/meetup/types/meetup-filter-types';

/**
 * Sort option configuration for UI display
 */
export interface MeetupSortOption {
  value: MeetupSortField;
  label: string;
  icon?: string;
}

/**
 * Available sort options for meetups
 */
export const MEETUP_SORT_OPTIONS: MeetupSortOption[] = [
  {
    value: 'nearestDate',
    label: 'Nearest Date',
    icon: 'calendar-clock',
  },
  {
    value: 'newest',
    label: 'Newest First',
    icon: 'calendar-arrow-down',
  },
  {
    value: 'oldest',
    label: 'Oldest First',
    icon: 'calendar-arrow-up',
  },
];

/**
 * Default sort option
 */
export const DEFAULT_MEETUP_SORT: MeetupSortField = 'nearestDate';

/**
 * Get sort option label by value
 */
export const getMeetupSortLabel = (value: MeetupSortField): string => {
  const option = MEETUP_SORT_OPTIONS.find(opt => opt.value === value);
  return option?.label || 'Nearest Date';
};

/**
 * Time of day labels for UI
 */
export const TIME_OF_DAY_LABELS = {
  morning: 'Morning (6am - 12pm)',
  afternoon: 'Afternoon (12pm - 6pm)',
  evening: 'Evening (6pm - 9pm)',
  night: 'Night (9pm - 6am)',
} as const;

/**
 * Meetup type labels
 */
export const MEETUP_TYPE_LABELS = {
  CASUAL: 'Casual',
  ROUTINE: 'Routine',
  MATCH: 'Match',
  TOURNAMENT: 'Tournament',
} as const;

/**
 * Meetup visibility labels
 */
export const MEETUP_VISIBILITY_LABELS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
} as const;
