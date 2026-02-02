/**
 * Shared Filtering and Sorting Types
 * 
 * This module provides generic, type-safe filtering and sorting interfaces
 * used across discussions, reviews, and meetups features.
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Sort direction for ordering results
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Base filters that apply to all content types
 */
export interface BaseFilters {
  /**
   * Filter to show only content created by the current user
   * When true, other filters may be ignored or combined
   */
  createdByMe?: boolean;

  /**
   * Filter by specific spot
   */
  spotId?: string;

  /**
   * Text search query
   */
  search?: string;
}

/**
 * Base sort options
 */
export interface BaseSortOptions {
  /**
   * Field to sort by
   */
  field: string;

  /**
   * Sort direction (ascending or descending)
   */
  direction: SortDirection;
}

// ============================================================================
// Discussion Filters & Sort
// ============================================================================

/**
 * Sort options specific to discussions
 */
export type DiscussionSortField = 'newest' | 'oldest' | 'mostVoted';

export interface DiscussionSortOptions {
  field: DiscussionSortField;
}

/**
 * Filters for discussion queries
 */
export interface DiscussionFilters extends BaseFilters {
  /**
   * Filter by discussion tags (e.g., 'Q&A', 'General')
   */
  tags?: string[];

  /**
   * Filter by sport ID
   */
  sportId?: string;
}

// ============================================================================
// Review Filters & Sort
// ============================================================================

/**
 * Sort options specific to reviews
 */
export type ReviewSortField = 'newest' | 'oldest' | 'ratingHigh' | 'ratingLow' | 'mostVoted';

export interface ReviewSortOptions {
  field: ReviewSortField;
}

/**
 * Filters for review queries
 */
export interface ReviewFilters extends BaseFilters {
  /**
   * Filter by sport ID (reviews that include this sport)
   */
  sportId?: string;

  /**
   * Minimum rating threshold (1-5)
   */
  minRating?: number;

  /**
   * Maximum rating threshold (1-5)
   */
  maxRating?: number;
}

// ============================================================================
// Meetup Filters & Sort
// ============================================================================

/**
 * Sort options specific to meetups
 */
export type MeetupSortField = 'nearestDate' | 'newest' | 'oldest';

export interface MeetupSortOptions {
  field: MeetupSortField;
}

/**
 * Meetup types
 */
export type MeetupType = 'CASUAL' | 'ROUTINE' | 'MATCH' | 'TOURNAMENT';

/**
 * Meetup visibility levels
 */
export type MeetupVisibility = 'OPEN' | 'CLOSED';

/**
 * Time of day categories for meetups
 */
export type MeetupTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Filters for meetup queries
 */
export interface MeetupFilters extends BaseFilters {
  /**
   * Filter by meetup type
   */
  type?: MeetupType;

  /**
   * Filter by visibility level
   */
  visibility?: MeetupVisibility;

  /**
   * Filter by sport IDs (meetups for any of these sports)
   */
  sports?: string[];

  /**
   * Filter by start date (meetups on or after this date)
   */
  dateFrom?: Date;

  /**
   * Filter by end date (meetups on or before this date)
   */
  dateTo?: Date;

  /**
   * Filter by time of day
   */
  timeOfDay?: MeetupTimeOfDay;
}

// ============================================================================
// Generic Filter State
// ============================================================================

/**
 * Generic filter state that combines filters and sorting
 */
export interface FilterState<TFilters, TSortOptions> {
  filters: TFilters;
  sort: TSortOptions;
}

/**
 * Type-specific filter states for convenience
 */
export type DiscussionFilterState = FilterState<DiscussionFilters, DiscussionSortOptions>;
export type ReviewFilterState = FilterState<ReviewFilters, ReviewSortOptions>;
export type MeetupFilterState = FilterState<MeetupFilters, MeetupSortOptions>;

// ============================================================================
// Filter Utilities
// ============================================================================

/**
 * Check if any filters are active (excluding createdByMe)
 */
export const hasActiveFilters = (filters: BaseFilters): boolean => {
  const { createdByMe, ...otherFilters } = filters;
  return Object.values(otherFilters).some(value => 
    value !== undefined && 
    value !== null && 
    value !== '' &&
    (Array.isArray(value) ? value.length > 0 : true)
  );
};

/**
 * Check if createdByMe filter should be applied
 * Returns false if other filters are active (to avoid prioritization conflicts)
 */
export const shouldApplyCreatedByMe = (filters: BaseFilters): boolean => {
  return filters.createdByMe === true && !hasActiveFilters(filters);
};
