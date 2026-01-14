import { Meetup } from '@/src/entities/meetup/model';
import { MeetupFilters, MeetupSortOptions } from '@/src/types/filtering.types';

// Re-export MeetupTimeOfDay for backward compatibility
export type { MeetupTimeOfDay } from '@/src/types/filtering.types';

// Re-export MeetupFilters for backward compatibility
export type { MeetupFilters } from '@/src/types/filtering.types';

export interface IMeetupRepository {
  /**
   * Creates a new meetup.
   * The repository implementation should handle the specific fields based on meetup.type.
   * @param meetupData The meetup data without ID and system timestamps (handled by repo/db)
   */
  createMeetup(meetupData: Omit<Meetup, 'id' | 'createdAt' | 'updatedAt' | 'participants'>): Promise<string>;

  /**
   * Retrieves a meetup by its ID.
   * Returns the correct specific type (CasualMeetup | TournamentMeetup) based on the data.
   */
  getMeetupById(spotId: string, id: string): Promise<Meetup | null>;

  /**
  * Retrieves meetups for a specific spot.
  * Can be filtered by multiple fields (type, visibility, sports, date range, time of day).
   */
  getMeetupsBySpot(spotId: string, filters?: MeetupFilters): Promise<Meetup[]>;

  /**
   * Get meetups with filters and sorting
   * @param options - Query options
   */
  getMeetups(options: {
    spotId?: string;
    filters?: MeetupFilters;
    sort?: MeetupSortOptions;
    userId?: string; // For createdByMe filter
  }): Promise<Meetup[]>;

  /**
   * Retrieve meetups where the given user participates or organizes.
   */
  getMeetupsByUser(userId: string): Promise<Meetup[]>;

  /**
   * Adds a user to the participants list of a meetup.
   * Should handle atomic transactions (increment count, add ID).
   */
  joinMeetup(spotId: string, meetupId: string, userId: string): Promise<{ status: 'joined' | 'requested' }>;

  /**
   * Approves a pending join request (only organizer can call)
   */
  approveJoinRequest(spotId: string, meetupId: string, requesterId: string, approverId: string): Promise<void>;

  /**
   * Rejects a pending join request (only organizer can call)
   */
  rejectJoinRequest(spotId: string, meetupId: string, requesterId: string, approverId: string): Promise<void>;
  /**
   * Removes a user from the participants list.
   */
  leaveMeetup(spotId: string, meetupId: string, userId: string): Promise<void>;

  /**
   * Updates partial fields of a meetup (e.g., status)
   */
  /**
   * Updates partial fields of a meetup. If updating sensitive scheduling fields (date/time/daysOfWeek)
   * the requestingUserId must be provided and must be the organizer.
   */
  updateMeetup(spotId: string, meetupId: string, data: Partial<Meetup>, requestingUserId?: string): Promise<void>;

  /**
   * Deletes a meetup. Implementations should verify permissions and cleanup resources (e.g., chat)
   */
  deleteMeetup(spotId: string, meetupId: string, requestingUserId: string): Promise<void>;
}
