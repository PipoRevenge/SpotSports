import { Message } from '@/src/entities/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = 1;
const LAST_SEEN_KEY_PREFIX = 'sp:chat:lastSeen:';

interface StoredLastSeen {
  version: number;
  messageId?: string;
  createdAt?: number;
}

const buildLastSeenKey = (chatId: string, userId: string) => `${LAST_SEEN_KEY_PREFIX}${chatId}:${userId}`;

export const getLastSeen = async (
  chatId: string,
  userId: string
): Promise<{ messageId?: string; createdAt?: Date }> => {
  try {
    const raw = await AsyncStorage.getItem(buildLastSeenKey(chatId, userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredLastSeen;
    if (parsed.version !== STORAGE_VERSION) return {};
    return {
      messageId: parsed.messageId,
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : undefined,
    };
  } catch {
    return {};
  }
};

export const setLastSeen = async (chatId: string, userId: string, message: Message): Promise<void> => {
  const payload: StoredLastSeen = {
    version: STORAGE_VERSION,
    messageId: message.id,
    createdAt: message.createdAt instanceof Date ? message.createdAt.getTime() : new Date(message.createdAt).getTime(),
  };
  try {
    await AsyncStorage.setItem(buildLastSeenKey(chatId, userId), JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

export const clearLastSeen = async (chatId: string, userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(buildLastSeenKey(chatId, userId));
  } catch {
    // ignore
  }
};
