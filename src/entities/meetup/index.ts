// 1. Discriminator Enum
export enum MeetupType {
  CASUAL = 'CASUAL',
  TOURNAMENT = 'TOURNAMENT',
  MATCH = 'MATCH',
  ROUTINE = 'ROUTINE'
}

// 2. Base Interface (Shared fields)
export enum MeetupStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

// Default maximum participants for meetups when not specified
export const DEFAULT_MEETUP_PARTICIPANT_LIMIT = 30;

export enum MeetupVisibility {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface BaseMeetup {
  id: string;
  spotId: string;
  organizerId: string;
  chatId: string; // Reference to Chat feature
  date: Date;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  participants: string[]; // Array of User IDs
  status: MeetupStatus;
  visibility?: MeetupVisibility;
  joinRequests?: string[]; // IDs of users who requested to join (for CLOSED meetups)
  tags?: string[]; // Optional tags for the meetup (e.g. #beginner, #mixed)
}

// 3. Specific Interfaces

/**
 * Casual Meetup: Just people gathering to play.
 * Requires a minimum number of people to happen.
 */
export interface CasualMeetup extends BaseMeetup {
  type: MeetupType.CASUAL;
  sport: string;
  minParticipants: number;
  participantLimit?: number;
}

/**
 * Routine Meetup: recurring weekly gatherings at specific days and time.
 * daysOfWeek: array of numbers 0(Sunday) - 6(Saturday)
 * time: string 'HH:mm'
 * nextDate: computed next occurrence
 */
export interface RoutineMeetup extends BaseMeetup {
  type: MeetupType.ROUTINE;
  daysOfWeek: number[]; // 0..6
  time: string; // 'HH:mm'
  nextDate?: Date; // next computed occurrence
}

/**
 * Tournament Meetup: Structured competition.
 * (Placeholder for future scalability)
 */
export interface TournamentMeetup extends BaseMeetup {
  type: MeetupType.TOURNAMENT;
  sport: string;
  bracketStyle: 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';
  entryFee: number;
  maxTeams: number;
}

/**
 * Match Meetup: A single competitive match (e.g. 1v1 or Team vs Team).
 * (Placeholder for future scalability)
 */
export interface MatchMeetup extends BaseMeetup {
  type: MeetupType.MATCH;
  sport: string;
  isRanked: boolean;
}

// 4. Exported Union Type
export type Meetup = CasualMeetup | TournamentMeetup | MatchMeetup | RoutineMeetup;
