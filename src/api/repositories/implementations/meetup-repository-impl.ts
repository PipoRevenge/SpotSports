import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import { chatRepository } from '@/src/api/repositories';
import { DEFAULT_MEETUP_PARTICIPANT_LIMIT, Meetup, MeetupType, MeetupVisibility } from '@/src/entities/meetup';
import { firestore } from '@/src/lib/firebase-config';

import { meetupFromFirestore, meetupToFirestore } from '../mappers/meetup-mapper';
// helper: compute next occurrence for routine meetups
import { IMeetupRepository, MeetupFilters, MeetupTimeOfDay } from '../interfaces/i-meetup-repository';

export class MeetupRepositoryImpl implements IMeetupRepository {
  private collectionName = 'meetups';

  async createMeetup(meetupData: Omit<Meetup, 'id' | 'createdAt' | 'updatedAt' | 'participants'>): Promise<string> {
    if (!meetupData.spotId) throw new Error('spotId es requerido');
    console.debug('[MeetupRepo][createMeetup] creating meetup for spot=', meetupData.spotId, 'sport=', (meetupData as any).sport);
    const collectionRef = collection(firestore, `spots/${meetupData.spotId}/${this.collectionName}`);

    // Ensure organizer is added as initial participant, and default status
    const participants = meetupData.organizerId ? [meetupData.organizerId] : [];

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

    // Map dates to Firestore Timestamps and remove undefined fields
    const rawPayload: Partial<Meetup> = {
      ...meetupData,
      participants,
      status: (meetupData as any).status ?? ("SCHEDULED" as any),
      participantLimit,
      createdAt: undefined as any, // serverTimestamp will be used instead
      updatedAt: undefined as any,
    };

    // If ROUTINE, compute nextDate and persist
    if ((meetupData as any).type === MeetupType.ROUTINE) {
      const rm = meetupData as any;
      if (!rm.daysOfWeek?.length || !rm.time) {
        throw new Error('Routine meetups require daysOfWeek and time');
      }
      const next = this.computeNextOccurrence(rm.daysOfWeek, rm.time, new Date());
      (rawPayload as any).nextDate = next;
    }

    const payload = meetupToFirestore(rawPayload);
    // Ensure server timestamps are set
    payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();

    const docRef = doc(collectionRef);
    const meetupId = docRef.id;
    
    // Create chat for the meetup
    const chat = await chatRepository.createGroupChat({
      ownerId: meetupData.organizerId,
      name: `Meetup: ${(meetupData as any).title || 'Sin título'}`,
      memberIds: [meetupData.organizerId],
      description: `Chat for meetup ${(meetupData as any).title || ''}`,
      meetupId: meetupId,
      meetupSpotId: meetupData.spotId,
    });
    
    // Add chatId to payload
    payload.chatId = chat.id;
    
    await setDoc(docRef, payload);

    return meetupId;
  }

  async updateMeetup(spotId: string, meetupId: string, data: Partial<Meetup>, requestingUserId?: string): Promise<void> {
    // Enforce max participant limit
    const { DEFAULT_MEETUP_PARTICIPANT_LIMIT } = await import('@/src/entities/meetup');
    if ((data as any).participantLimit && (data as any).participantLimit > DEFAULT_MEETUP_PARTICIPANT_LIMIT) {
      throw new Error(`El límite máximo es ${DEFAULT_MEETUP_PARTICIPANT_LIMIT} participantes`);
    }

    const meetupRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, meetupId);

    // Any update must be done by organizer when requester provided
    if (requestingUserId) {
      const snap = await getDoc(meetupRef);
      if (!snap.exists()) throw new Error('Meetup not found');
      const existing = meetupFromFirestore(snap.id, snap.data());
      if (existing.organizerId !== requestingUserId) throw new Error('No tienes permisos para editar este meetup');
    }

    // If updating scheduling fields (date/time/daysOfWeek/nextDate), ensure the requester is organizer
    const schedulingKeys = ['date', 'time', 'daysOfWeek', 'nextDate'];
    const touchScheduling = schedulingKeys.some(k => Object.prototype.hasOwnProperty.call(data, k));

    if (touchScheduling) {
      if (!requestingUserId) throw new Error('Se requieren permisos de organizador para cambiar la fecha/hora');
      const snap = await getDoc(meetupRef);
      if (!snap.exists()) throw new Error('Meetup not found');
      const meetup = meetupFromFirestore(snap.id, snap.data());
      if (meetup.organizerId !== requestingUserId) throw new Error('No tienes permisos para cambiar la fecha/hora');

      // If this is a ROUTINE meetup and daysOfWeek/time change, compute new nextDate
      if ((meetup as any).type === MeetupType.ROUTINE && ((data as any).daysOfWeek || (data as any).time)) {
        const days = (data as any).daysOfWeek ?? (meetup as any).daysOfWeek;
        const time = (data as any).time ?? (meetup as any).time;
        if (!days || !time) throw new Error('Routine meetups require days and time');
        const computed = this.computeNextOccurrence(days, time, new Date());
        (data as any).nextDate = computed;
      }

      // For non-routine, if date changed we don't need extra checks beyond organizer permission
    }

    const payload = meetupToFirestore({ ...data });
    payload.updatedAt = serverTimestamp();
    await updateDoc(meetupRef, payload);
  }

  async approveJoinRequest(spotId: string, meetupId: string, requesterId: string, approverId: string): Promise<void> {
    const meetupRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, meetupId);

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(meetupRef);
      if (!snap.exists()) throw new Error('Meetup not found');

      const meetup = snap.data() as Meetup;
      if (meetup.organizerId !== approverId) throw new Error('No tienes permisos para aprobar solicitudes');

      meetup.joinRequests = meetup.joinRequests || [];
      if (!meetup.joinRequests.includes(requesterId)) return; // nothing to approve

      // Check capacity for casual
      if (meetup.type === MeetupType.CASUAL) {
        const limit = (meetup.participantLimit ?? DEFAULT_MEETUP_PARTICIPANT_LIMIT);
        if (limit && meetup.participants?.length >= limit) throw new Error('Meetup is full');
      }

      transaction.update(meetupRef, {
        joinRequests: arrayRemove(requesterId),
        participants: arrayUnion(requesterId),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async rejectJoinRequest(spotId: string, meetupId: string, requesterId: string, approverId: string): Promise<void> {
    const meetupRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, meetupId);

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(meetupRef);
      if (!snap.exists()) throw new Error('Meetup not found');

      const meetup = snap.data() as Meetup;
      if (meetup.organizerId !== approverId) throw new Error('No tienes permisos para rechazar solicitudes');

      meetup.joinRequests = meetup.joinRequests || [];
      if (!meetup.joinRequests.includes(requesterId)) return; // nothing to reject

      transaction.update(meetupRef, {
        joinRequests: arrayRemove(requesterId),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async deleteMeetup(spotId: string, meetupId: string, requestingUserId: string): Promise<void> {
    const meetupRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, meetupId);
    const snap = await getDoc(meetupRef);
    if (!snap.exists()) throw new Error('Meetup not found');

    const meetup = meetupFromFirestore(snap.id, snap.data());
    if (meetup.organizerId !== requestingUserId) throw new Error('No tienes permisos para eliminar este meetup');

    // Attempt to delete associated chat if exists
    if (meetup.chatId) {
      try {
        await chatRepository.deleteChat(meetup.chatId, requestingUserId);
      } catch (err) {
        // Non-fatal, continue
        console.warn('Could not delete associated chat', err);
      }
    }

    // Also try to cleanup any pending join requests (no-op for deleteDoc)
    await deleteDoc(meetupRef);
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
    const group = collectionGroup(firestore, this.collectionName);

    // Query meetups where user is participant
    const participantQuery = query(group, where('participants', 'array-contains', userId));
    const organizerQuery = query(group, where('organizerId', '==', userId));

    const [participantSnap, organizerSnap] = await Promise.all([getDocs(participantQuery), getDocs(organizerQuery)]);

    const docs: any[] = [];
    participantSnap.forEach(d => docs.push(d));
    organizerSnap.forEach(d => docs.push(d));

    // Deduplicate by id
    const seen = new Set<string>();
    const results: any[] = [];

    for (const d of docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);

      const m = d.data() as any;
      const meetup: any = {
        id: d.id,
        title: m.title,
        description: m.description,
        type: m.type,
        visibility: m.visibility,
        sport: m.sport,
        date: m.date,
        time: m.time,
        nextDate: m.nextDate ? new Date(m.nextDate.seconds * 1000) : undefined,
        organizerId: m.organizerId,
        participants: m.participants || [],
        spotId: (d.ref.parent.parent && (d.ref.parent.parent as any).id) || m.spotId,
        participantLimit: m.participantLimit,
        chatId: m.chatId,
        createdAt: m.createdAt ? new Date(m.createdAt.seconds * 1000) : undefined,
        updatedAt: m.updatedAt ? new Date(m.updatedAt.seconds * 1000) : undefined,
        metadata: m.metadata || {},
      };

      results.push(meetup);
    }

    // Optional: sort by nextDate or date
    results.sort((a: any, b: any) => {
      const da = (a as any).nextDate ? (a as any).nextDate.getTime() : ((a as any).date ? new Date((a as any).date).getTime() : 0);
      const db = (b as any).nextDate ? (b as any).nextDate.getTime() : ((b as any).date ? new Date((b as any).date).getTime() : 0);
      return da - db;
    });

    console.debug('[MeetupRepo][getMeetupsByUser] found=', results.length);
    return results as any as Meetup[];
  }

  async joinMeetup(spotId: string, meetupId: string, userId: string): Promise<{ status: 'joined' | 'requested' }> {
    const meetupRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, meetupId);

    // First transaction: validate existence, capacity and whether user already joined
    await runTransaction(firestore, async (transaction) => {
      const meetupDoc = await transaction.get(meetupRef);
      if (!meetupDoc.exists()) {
        throw new Error("Meetup does not exist!");
      }

      const data = meetupDoc.data() as Meetup;
      data.participants = data.participants || [];
      data.joinRequests = data.joinRequests || [];

      // If already a participant, nothing to do
      if (data.participants.includes(userId)) {
        return;
      }

      // If meetup is CLOSED, add to joinRequests instead of joining
      if ((data as any).visibility === 'CLOSED') {
        // If already requested, nothing to do
        if ((data.joinRequests || []).includes(userId)) return;
        transaction.update(meetupRef, {
          joinRequests: arrayUnion(userId),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // OPEN: proceed to check limits for Casual meetups
      if (data.type === MeetupType.CASUAL) {
        const limit = (data.participantLimit ?? DEFAULT_MEETUP_PARTICIPANT_LIMIT);
        if (limit && data.participants.length >= limit) {
          throw new Error("Meetup is full!");
        }
      }

      // If there's already a chatId, just add the participant inside the transaction
      if (data.chatId) {
        transaction.update(meetupRef, {
          participants: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        return;
      }

      // Otherwise, leave the creation of the chat outside the transaction to avoid complex cross-collection writes
    });

    // Re-fetch to see if action was a request or an actual join
    const meetupSnapshot = await getDoc(meetupRef);
    if (!meetupSnapshot.exists()) throw new Error('Meetup disappeared');

    const meetupData = meetupSnapshot.data() as Meetup;

    if ((meetupData.joinRequests || []).includes(userId)) {
      return { status: 'requested' };
    }

    if (meetupData.participants?.includes(userId)) return { status: 'joined' };

    if (!meetupData.chatId) {
      // Create chat via chatRepository
      const createdChat = await chatRepository.createGroupChat({
        ownerId: meetupData.organizerId,
        name: `Meetup: ${meetupData.title}`,
        memberIds: [meetupData.organizerId, userId],
        description: `Chat for meetup ${meetupData.title}`,
        meetupId: meetupId,
        meetupSpotId: spotId,
      });

      // Second transaction: set chatId if still empty, and add participant
      await runTransaction(firestore, async (transaction) => {
        const meetupDoc2 = await transaction.get(meetupRef);
        if (!meetupDoc2.exists()) throw new Error('Meetup disappeared');

        const current = meetupDoc2.data() as Meetup;

        if (!current.chatId) {
          transaction.update(meetupRef, {
            chatId: createdChat.id,
            participants: arrayUnion(userId),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Another process set chatId already; just add participant and delete the chat we created
          transaction.update(meetupRef, {
            participants: arrayUnion(userId),
            updatedAt: serverTimestamp(),
          });

          // Clean up the extra chat we created
          try {
            await chatRepository.deleteChat(createdChat.id, userId);
          } catch (err) {
            // Non-fatal: log cleanup error
            console.warn('Failed to cleanup redundant chat', err);
          }
        }
      });
    } else {
      // chat exists but participant not added yet - add in a simple update
      await updateDoc(meetupRef, {
        participants: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
    }

    return { status: 'joined' };
  }

  async leaveMeetup(spotId: string, meetupId: string, userId: string): Promise<void> {
    const meetupRef = doc(firestore, `spots/${spotId}/${this.collectionName}`, meetupId);

    // Also remove any outstanding join requests from this user (cleanup)
    await runTransaction(firestore, async (transaction) => {
      const meetupDoc = await transaction.get(meetupRef);
      if (!meetupDoc.exists()) throw new Error('Meetup does not exist');
      const data = meetupDoc.data() as Meetup;
      if ((data.joinRequests || []).includes(userId)) {
        transaction.update(meetupRef, { joinRequests: arrayRemove(userId), updatedAt: serverTimestamp() });
      }
    });

    // We capture whether we deleted the meetup and its chatId to cleanup after the transaction
    let deletedChatId: string | undefined;
    let deletedMeetup = false;

    await runTransaction(firestore, async (transaction) => {
      const meetupDoc = await transaction.get(meetupRef);
      if (!meetupDoc.exists()) throw new Error('Meetup does not exist');

      const data = meetupDoc.data() as Meetup;
      if (!data.participants || !data.participants.includes(userId)) return; // not a member

      // If organizer leaves, delete the meetup regardless of remaining participants
      if (data.organizerId === userId) {
        deletedChatId = data.chatId;
        transaction.delete(meetupRef);
        deletedMeetup = true;
        return;
      }

      const remaining = (data.participants || []).filter(id => id !== userId);

      if (remaining.length === 0) {
        // Delete meetup if no participants remain
        deletedChatId = data.chatId;
        transaction.delete(meetupRef);
        deletedMeetup = true;
        return;
      }

      transaction.update(meetupRef, {
        participants: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
    });

    if (deletedMeetup) {
      // Attempt to delete associated chat if it exists
      if (deletedChatId) {
        try {
          await chatRepository.deleteChat(deletedChatId, userId);
        } catch (err) {
          console.warn('Failed to delete chat for removed meetup', err);
        }
      }
    }
  }
}
