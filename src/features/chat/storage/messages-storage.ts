import { Message } from '@/src/entities/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = 1;
const MESSAGES_KEY_PREFIX = 'sp:chat:messages:';
const MAX_CACHED_MESSAGES_PER_CHAT = 200;

interface SerializedMessage extends Omit<Message, 'createdAt'> {
  createdAt: number;
}

interface StoredMessagesPayload {
  version: number;
  items: SerializedMessage[];
}

const buildMessagesKey = (chatId: string) => `${MESSAGES_KEY_PREFIX}${chatId}`;

const serializeMessage = (message: Message): SerializedMessage => ({
  ...message,
  createdAt: message.createdAt instanceof Date ? message.createdAt.getTime() : new Date(message.createdAt).getTime(),
});

const deserializeMessage = (message: SerializedMessage): Message => ({
  ...message,
  createdAt: new Date(message.createdAt),
});

const sortMessagesAsc = (items: Message[]) =>
  [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

const dedupeById = (items: Message[]) => {
  const map = new Map<string, Message>();
  items.forEach(item => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
};

export const getCachedMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const raw = await AsyncStorage.getItem(buildMessagesKey(chatId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMessagesPayload;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
    return sortMessagesAsc(parsed.items.map(deserializeMessage));
  } catch {
    return [];
  }
};

export const saveCachedMessages = async (chatId: string, messages: Message[]): Promise<void> => {
  const normalized = sortMessagesAsc(dedupeById(messages)).slice(-MAX_CACHED_MESSAGES_PER_CHAT);
  const payload: StoredMessagesPayload = {
    version: STORAGE_VERSION,
    items: normalized.map(serializeMessage),
  };
  try {
    await AsyncStorage.setItem(buildMessagesKey(chatId), JSON.stringify(payload));
  } catch {
    // swallow storage errors to avoid blocking UI
  }
};

export const appendCachedMessages = async (chatId: string, newMessages: Message[]): Promise<Message[]> => {
  if (!newMessages.length) return getCachedMessages(chatId);
  const existing = await getCachedMessages(chatId);
  const merged = [...existing, ...newMessages];
  await saveCachedMessages(chatId, merged);
  return getCachedMessages(chatId);
};

export const clearCachedMessages = async (chatId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(buildMessagesKey(chatId));
  } catch {
    // ignore
  }
};
