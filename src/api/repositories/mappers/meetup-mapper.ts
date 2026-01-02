import { Meetup } from '@/src/entities/meetup';
import { Timestamp } from 'firebase/firestore';
import { parseTimestamp } from '../utils/firebase-parsers';

export const meetupToFirestore = (data: Partial<Meetup>) => {
  const anyData = data as any;
  const propMap: Record<string, any> = {
    ...data,
    // regular date (single occurrence)
    date: data.date ? Timestamp.fromDate(data.date) : undefined,
    // routine-specific nextDate
    nextDate: anyData.nextDate ? Timestamp.fromDate(anyData.nextDate) : undefined,
    createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? Timestamp.fromDate(data.updatedAt) : undefined,
    // joinRequests is handled as an array of ids
    joinRequests: data.joinRequests ? data.joinRequests : undefined,
    visibility: data.visibility ? data.visibility : undefined,
  };

  // Remove undefined values because Firestore rejects them
  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(propMap)) {
    if (v !== undefined) sanitized[k] = v;
  }

  return sanitized;
};

export const meetupFromFirestore = (id: string, data: any): Meetup => {
  return {
    id,
    ...data,
    date: parseTimestamp(data.date),
    nextDate: parseTimestamp(data.nextDate),
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
    participantsCount: data.participantsCount || 0,
    participants: [], // Always empty array as we use subcollections now
  } as Meetup;
};


