import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = 1;
const USER_MEETUPS_KEY_PREFIX = 'sp:user:meetups:';

const buildKey = (userId: string) => `${USER_MEETUPS_KEY_PREFIX}${userId}`;

export interface StoredUserMeetup {
  id: string;
  spotId: string;
  title: string;
  date?: number | null; // timestamp
  nextDate?: number | null; // for routine
  location?: { latitude: number; longitude: number } | null;
  sport?: string | null; // id or name
  organizerId?: string | null;
  updatedAt?: number | null;
}

interface Payload {
  version: number;
  items: StoredUserMeetup[];
}

export const getUserMeetups = async (userId: string): Promise<StoredUserMeetup[]> => {
  try {
    const raw = await AsyncStorage.getItem(buildKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Payload;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
    return parsed.items;
  } catch (e) {
    console.debug('[user-meetups-storage] get error', e);
    return [];
  }
};

export const saveUserMeetup = async (userId: string, meetup: StoredUserMeetup): Promise<void> => {
  try {
    const existing = await getUserMeetups(userId);
    const filtered = existing.filter(m => m.id !== meetup.id);
    const merged = [...filtered, { ...meetup, updatedAt: Date.now() }];
    const payload: Payload = { version: STORAGE_VERSION, items: merged };
    await AsyncStorage.setItem(buildKey(userId), JSON.stringify(payload));
  } catch (e) {
    console.debug('[user-meetups-storage] save error', e);
  }
};

export const removeUserMeetup = async (userId: string, meetupId: string): Promise<void> => {
  try {
    const existing = await getUserMeetups(userId);
    const remaining = existing.filter(m => m.id !== meetupId);
    const payload: Payload = { version: STORAGE_VERSION, items: remaining };
    await AsyncStorage.setItem(buildKey(userId), JSON.stringify(payload));
  } catch (e) {
    console.debug('[user-meetups-storage] remove error', e);
  }
};

export const clearUserMeetups = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(buildKey(userId));
  } catch (e) {
    console.debug('[user-meetups-storage] clear error', e);
  }
};
