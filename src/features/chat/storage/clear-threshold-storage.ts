import AsyncStorage from '@react-native-async-storage/async-storage';

const CLEAR_KEY_PREFIX = 'sp:chat:clearAt:';

const buildKey = (chatId: string, userId: string) => `${CLEAR_KEY_PREFIX}${chatId}:${userId}`;

export const getClearThreshold = async (chatId: string, userId: string): Promise<Date | null> => {
  try {
    const raw = await AsyncStorage.getItem(buildKey(chatId, userId));
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? new Date(ts) : null;
  } catch {
    return null;
  }
};

export const setClearThreshold = async (chatId: string, userId: string, date: Date): Promise<void> => {
  try {
    await AsyncStorage.setItem(buildKey(chatId, userId), String(date.getTime()));
  } catch {
    // ignore storage errors
  }
};

export const clearClearThreshold = async (chatId: string, userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(buildKey(chatId, userId));
  } catch {
    // ignore
  }
};
