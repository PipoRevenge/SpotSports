import { Meetup } from '@/src/entities/meetup';
import { Timestamp } from 'firebase/firestore';

export const meetupToFirestore = (data: Partial<Meetup>) => {
  const propMap: Record<string, any> = {
    ...data,
    // regular date (single occurrence)
    date: data.date ? Timestamp.fromDate(data.date) : undefined,
    // routine-specific nextDate
    nextDate: data.nextDate ? Timestamp.fromDate(data.nextDate) : undefined,
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
  const toDate = (v: any) => (v && typeof v.toDate === 'function' ? v.toDate() : v);

  return {
    id,
    ...data,
    date: toDate(data.date),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Meetup;
};
