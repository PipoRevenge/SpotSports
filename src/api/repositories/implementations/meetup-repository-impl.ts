import {
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { Meetup, MeetupType, MeetupVisibility } from '@/src/entities/meetup';
import { firestore, functions } from '@/src/lib/firebase-config';
import { ChatRepositoryImpl } from './chat-repository-impl';

import { meetupFromFirestore } from '../mappers/meetup-mapper';
// helper: compute next occurrence for routine meetups
import { IMeetupRepository, MeetupFilters, MeetupTimeOfDay } from '../interfaces/i-meetup-repository';

// Create singleton instance to avoid circular dependency
const chatRepository = new ChatRepositoryImpl();

export class MeetupRepositoryImpl implements IMeetupRepository {
  private collectionName = 'meetups';

  async createMeetup(meetupData: Omit<Meetup, 'id' | 'createdAt' | 'updatedAt' | 'participants'>): Promise<string> {
    if (!meetupData.spotId) throw new Error('spotId es requerido');
    console.debug('[MeetupRepo][createMeetup] creating meetup for spot=', meetupData.spotId, 'sport=', (meetupData as any).sport);

    // Enforce maximum participant limit
    if ((meetupData as any).type === MeetupType.CASUAL) {
      const limit = (meetupData as any).participantLimit;
      if (limit && limit > 30) throw new Error('El límite máximo es 30 participantes');
    }

    // Default participantLimit to global default if not provided for meetups that can have it
    const { DEFAULT_MEETUP_PARTICIPANT_LIMIT } = await import('@/src/entities/meetup');
    let participantLimit = (meetupData as any).participantLimit;
    if ((participantLimit === undefined || participantLimit === null) && (meetupData as any).type === MeetupType.CASUAL) {
      participantLimit = DEFAULT_MEETUP_PARTICIPANT_LIMIT;
    }

    // Call cloud function
    const createMeetupFn = httpsCallable(functions, 'meetups_create');
    const result = await createMeetupFn({
      spotId: meetupData.spotId,
      meetupData: {
        ...meetupData,
        participantLimit,
        status: (meetupData as any).status ?? 'SCHEDULED',
      },
    });

    const { meetupId } = result.data as { meetupId: string; meetup: any };
    return meetupId;
  }

  async updateMeetup(spotId: string, meetupId: string, data: Partial<Meetup>, requestingUserId?: string): Promise<void> {
    // Enforce max participant limit
    const { DEFAULT_MEETUP_PARTICIPANT_LIMIT } = await import('@/src/entities/meetup');
    if ((data as any).participantLimit && (data as any).participantLimit > DEFAULT_MEETUP_PARTICIPANT_LIMIT) {
      throw new Error(`El límite máximo es ${DEFAULT_MEETUP_PARTICIPANT_LIMIT} participantes`);
    }

    // Call cloud function
    const updateMeetupFn = httpsCallable(functions, 'meetups_update');
    await updateMeetupFn({
      spotId,
      meetupId,
      data,
    });
  }

  async approveJoinRequest(spotId: string, meetupId: string, requesterId: string, approverId: string): Promise<void> {
    // Call cloud function
    const approveRequestFn = httpsCallable(functions, 'meetups_approveRequest');
    await approveRequestFn({
      spotId,
      meetupId,
      requesterId,
    });
  }

  async rejectJoinRequest(spotId: string, meetupId: string, requesterId: string, approverId: string): Promise<void> {
    // Call cloud function
    const rejectRequestFn = httpsCallable(functions, 'meetups_rejectRequest');
    await rejectRequestFn({
      spotId,
      meetupId,
      requesterId,
    });
  }

  async deleteMeetup(spotId: string, meetupId: string, requestingUserId: string): Promise<void> {
    // Call cloud function
    const deleteMeetupFn = httpsCallable(functions, 'meetups_delete');
    await deleteMeetupFn({
      spotId,
      meetupId,
    });
  }

  private computeNextOccurrence(daysOfWeek: number[], time: string, fromDate = new Date()): Date {
    // time 'HH:mm'
    const [hh, mm] = time.split(':').map(Number);
    const today = new Date(fromDate);
    // normalize to today at given time
    const candidates = daysOfWeek
      .map(d => {
        // day number: 0 (Sunday) - 6 (Saturday)
        const candidate = new Date(today);
        // set to start of today and then move to the target day
        candidate.setHours(hh, mm, 0, 0);
        const delta = (d - candidate.getDay() + 7) % 7;
        if (delta === 0 && candidate.getTime() <= fromDate.getTime()) {
          // same day but time already passed -> schedule for next week
          candidate.setDate(candidate.getDate() + 7);
        } else {
          candidate.setDate(candidate.getDate() + delta);
        }
        return candidate;
      })
      .sort((a, b) => a.getTime() - b.getTime());

    return candidates[0];
  }

  private getMeetupDateForFilter(meetup: Meetup, now: Date): Date | null {
    if ((meetup as any).type === MeetupType.ROUTINE) {
      const rm = meetup as any;
      if (rm.nextDate) return new Date(rm.nextDate);
      if (rm.daysOfWeek && rm.time) {
        try {
          return this.computeNextOccurrence(rm.daysOfWeek, rm.time, now);
        } catch {
          return null;
        }
      }
      return null;
    }

    return meetup.date ? new Date(meetup.date) : null;
  }

  private applyClientFilters(meetup: Meetup, filters: MeetupFilters | undefined, now: Date, possibleSportValues?: string[], idToName?: Map<string,string>): boolean {
    if (!filters) return true;

    if (filters.visibility) {
      const visibility = (meetup as any).visibility ?? MeetupVisibility.OPEN;
      if (visibility !== filters.visibility) return false;
    }

    if (filters.sports && filters.sports.length) {
      const sport = (meetup as any).sport;
      if (!sport) return false;

      // Build a list of accepted sport values from selected filters (ids + resolved names)
      const accepted: string[] = [];
      for (const fs of filters.sports) {
        accepted.push(fs);
        if (idToName) {
          const n = idToName.get(fs);
          if (n) accepted.push(n);
        }
      }

      const acceptedLower = new Set(accepted.map(a => String(a).toLowerCase()));
      if (!acceptedLower.has(String(sport).toLowerCase())) return false;
    }

    const needsDateFilter = filters.dateFrom || filters.dateTo || filters.timeOfDay;
    if (needsDateFilter) {
      const scheduled = this.getMeetupDateForFilter(meetup, now);
      if (!scheduled) return false;

      if (filters.dateFrom) {
        if (scheduled.getTime() < this.startOfDay(filters.dateFrom).getTime()) return false;
      }

      if (filters.dateTo) {
        if (scheduled.getTime() > this.endOfDay(filters.dateTo).getTime()) return false;
      }

      if (filters.timeOfDay && !this.matchesTimeOfDay(scheduled, filters.timeOfDay)) return false;
    }

    return true;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private matchesTimeOfDay(date: Date, slot: MeetupTimeOfDay): boolean {
    const hour = date.getHours();
    switch (slot) {
      case 'morning':
        return hour >= 5 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 22;
      case 'night':
      default:
        return hour >= 22 || hour < 5;
    }
  }

  async getMeetupById(spotId: string, id: string): Promise<Meetup | null> {
    const docRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    const meetup = meetupFromFirestore(snapshot.id, data);

    // For ROUTINE meetups ensure nextDate is up-to-date (compute and persist if in past)
    if ((meetup as any).type === MeetupType.ROUTINE) {
      const rm = meetup as any;
      const now = new Date();
      const next = rm.nextDate ? new Date(rm.nextDate) : this.computeNextOccurrence(rm.daysOfWeek, rm.time, now);
      if (!rm.nextDate || next.getTime() <= now.getTime()) {
        const computed = this.computeNextOccurrence(rm.daysOfWeek, rm.time, now);
        try {
          await updateDoc(docRef, { nextDate: Timestamp.fromDate(computed), updatedAt: serverTimestamp() });
          (meetup as any).nextDate = computed;
        } catch {
          // non-fatal
        }
      }
    }

    return meetup;
  }

  async getMeetupsBySpot(spotId: string, filters?: MeetupFilters): Promise<Meetup[]> {
    const readableFilters = filters
      ? {
          ...filters,
          dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
          dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
        }
      : undefined;

    console.debug('[MeetupRepo][getMeetupsBySpot] spotId=', spotId, 'filters=', readableFilters);

    const collectionRef = collection(firestore, `spots/${spotId}/${this.collectionName}`);
    const constraints: any[] = [orderBy('createdAt', 'desc')];

    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters?.visibility) {
      constraints.push(where('visibility', '==', filters.visibility));
    }

    // If sports filters are provided, try to resolve selected sport IDs to sport names
    // so we can match meetups stored with either id or name. We'll attempt to apply a
    // server-side 'in' filter when feasible to reduce the result set; otherwise fallback
    // to client-side filtering.
    let possibleSportValues: string[] | undefined = undefined;
    let idToName: Map<string, string> | undefined = undefined;
    if (filters?.sports && filters.sports.length) {
      try {
        // Read spot doc to get availableSports array (may be array of ids or objects)
        const spotRef = doc(firestore, `spots`, spotId);
        const spotSnap = await getDoc(spotRef);
        const rawAvailable: any[] = (spotSnap.exists() ? ((spotSnap.data() as any)?.details?.availableSports ?? []) : []);
        console.debug('[MeetupRepo] spot availableSports raw:', rawAvailable);

        idToName = new Map<string, string>();
        rawAvailable.forEach((r) => {
          if (!r) return;
          if (typeof r === 'string') {
            // if the spot stored a string, treat it as both id and name
            idToName!.set(r, r);
          } else {
            const id = r.id ?? r.name;
            const name = r.name ?? r.id;
            if (id) idToName!.set(id, name);
          }
        });
        console.debug('[MeetupRepo] idToName map:', Array.from(idToName.entries()));

        // For each selected value, include the value itself and the resolved name when possible
        const values = filters.sports.reduce<string[]>((acc, val) => {
          acc.push(val);
          const n = idToName!.get(val);
          if (n) acc.push(n);
          return acc;
        }, []);

        possibleSportValues = Array.from(new Set(values));
        console.debug('[MeetupRepo] possibleSportValues:', possibleSportValues);

        // If resulting values count is small, apply server-side 'in' or '==' filter
        if (possibleSportValues.length === 1) {
          constraints.push(where('sport', '==', possibleSportValues[0]));
          console.debug('[MeetupRepo] Applying server-side filter ==', possibleSportValues[0]);
        } else if (possibleSportValues.length <= 10) {
          constraints.push(where('sport', 'in', possibleSportValues));
          console.debug('[MeetupRepo] Applying server-side filter IN', possibleSportValues);
        } else {
          // too many values for 'in' query - skip server-side filtering
          possibleSportValues = undefined;
          console.debug('[MeetupRepo] Too many possibleSportValues, will fallback to client-side filtering');
        }
      } catch (e) {
        console.debug('[MeetupRepo] Error resolving sports for server-side filter, falling back to client-side', e);
        possibleSportValues = undefined;
      }
    }

    console.debug('[MeetupRepo] Querying collection', `spots/${spotId}/${this.collectionName}`, 'with constraints count=', constraints.length);
    const snapshot = await getDocs(query(collectionRef, ...constraints));
    console.debug('[MeetupRepo] Retrieved docs count:', snapshot.size);

    const now = new Date();
    const results: Meetup[] = [];

    for (const d of snapshot.docs) {
      const data = d.data();
      const meetup = meetupFromFirestore(d.id, data);

      // For ROUTINE meetups: ensure nextDate is up-to-date and persist if needed
      if ((meetup as any).type === MeetupType.ROUTINE) {
        const rm = meetup as any;
        const next = rm.nextDate ? new Date(rm.nextDate) : this.computeNextOccurrence(rm.daysOfWeek, rm.time, now);
        if (!rm.nextDate || next.getTime() <= now.getTime()) {
          const computed = this.computeNextOccurrence(rm.daysOfWeek, rm.time, now);
          try {
            await updateDoc(doc(firestore, `spots/${spotId}/${this.collectionName}`, d.id), { nextDate: Timestamp.fromDate(computed), updatedAt: serverTimestamp() });
            (meetup as any).nextDate = computed;
          } catch {
            // ignore
          }
        }
      }

      results.push(meetup);
    }

    const filtered = results.filter(meetup => {
      const keep = this.applyClientFilters(meetup, filters, now, possibleSportValues, idToName);
      console.debug('[MeetupRepo][filter decision]', meetup.id, 'sport=', (meetup as any).sport, 'keep=', keep);
      return keep;
    });

    console.debug('[MeetupRepo] Filtering done:', 'before=', results.length, 'after=', filtered.length);

    return filtered;
  }

  async getMeetupsByUser(userId: string): Promise<Meetup[]> {
    console.debug('[MeetupRepo][getMeetupsByUser] userId=', userId);
    
    // 1. Query meetups where user is organizer
    const group = collectionGroup(firestore, this.collectionName);
    const organizerQuery = query(group, where('organizerId', '==', userId));
    const organizerSnap = await getDocs(organizerQuery);

    // 2. Query participants subcollection
    const participantsGroup = collectionGroup(firestore, 'participants');
    const participantQuery = query(participantsGroup, where('userId', '==', userId));
    const participantSnap = await getDocs(participantQuery);

    // 3. Fetch parent meetups
    const meetupRefs = new Set<string>();
    const meetups: Meetup[] = [];

    // Add organizer meetups
    organizerSnap.forEach(d => {
        meetupRefs.add(d.ref.path);
        meetups.push(meetupFromFirestore(d.id, d.data()));
    });

    // Add participant meetups
    const fetchPromises: Promise<any>[] = [];
    for (const d of participantSnap.docs) {
        const parentRef = d.ref.parent.parent;
        if (parentRef && !meetupRefs.has(parentRef.path)) {
            meetupRefs.add(parentRef.path);
            fetchPromises.push(getDoc(parentRef));
        }
    }

    if (fetchPromises.length > 0) {
        const fetchedSnaps = await Promise.all(fetchPromises);
        fetchedSnaps.forEach(snap => {
            if (snap.exists()) {
                meetups.push(meetupFromFirestore(snap.id, snap.data()));
            }
        });
    }

    // Populate participantsCount if missing (for older meetups)
    // Note: We don't fetch full participants list here to avoid N+1, 
    // but we ensure the entity has the count if available in the doc.
    // If the UI needs the list, it should call getMeetupParticipants.

    // Sort
    meetups.sort((a: any, b: any) => {
      const da = (a as any).nextDate ? (a as any).nextDate.getTime() : ((a as any).date ? new Date((a as any).date).getTime() : 0);
      const db = (b as any).nextDate ? (b as any).nextDate.getTime() : ((b as any).date ? new Date((b as any).date).getTime() : 0);
      return da - db;
    });

    console.debug('[MeetupRepo][getMeetupsByUser] found=', meetups.length);
    return meetups;
  }

  async getMeetupParticipants(spotId: string, meetupId: string): Promise<any[]> {
    const participantsRef = collection(firestore, `spots/${spotId}/${this.collectionName}`, meetupId, 'participants');
    const snap = await getDocs(participantsRef);
    return snap.docs.map(d => d.data());
  }

  async joinMeetup(spotId: string, meetupId: string, userId: string): Promise<{ status: 'joined' | 'requested' }> {
    // Call cloud function
    const joinMeetupFn = httpsCallable(functions, 'meetups_join');
    const result = await joinMeetupFn({
      spotId,
      meetupId,
    });

    // The cloud function should return the status
    return result.data as { status: 'joined' | 'requested' };
  }

  async leaveMeetup(spotId: string, meetupId: string, userId: string): Promise<void> {
    // Call cloud function
    const leaveMeetupFn = httpsCallable(functions, 'meetups_leave');
    await leaveMeetupFn({
      spotId,
      meetupId,
    });
  }
}
