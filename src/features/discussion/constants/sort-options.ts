/**
 * Discussion Sort Options
 * 
 * Constants and utilities for sorting discussions
 */

import { DiscussionSortField } from '@/src/features/discussion/types/discussion-filter-types';

/**
 * Sort option configuration for UI display
 */
export interface SortOption {
  value: DiscussionSortField;
  label: string;
  icon?: string;
}

/**
 * Available sort options for discussions
 */
export const DISCUSSION_SORT_OPTIONS: SortOption[] = [
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
  {
    value: 'mostVoted',
    label: 'Most Voted',
    icon: 'trending-up',
  },
];

/**
 * Default sort option
 */
export const DEFAULT_DISCUSSION_SORT: DiscussionSortField = 'newest';

/**
 * Get sort option label by value
 */
export const getDiscussionSortLabel = (value: DiscussionSortField): string => {
  const option = DISCUSSION_SORT_OPTIONS.find(opt => opt.value === value);
  return option?.label || 'Newest First';
};
