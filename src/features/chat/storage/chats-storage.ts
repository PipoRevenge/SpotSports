import { Chat, MessageSummary } from '@/src/entities/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = 1;
const CHAT_META_KEY_PREFIX = 'sp:chat:meta:';

interface SerializedMessageSummary extends Omit<MessageSummary, 'createdAt'> {
  createdAt: number;
}

interface SerializedChat extends Omit<Chat, 'createdAt' | 'updatedAt' | 'lastMessage'> {
  createdAt: number;
  updatedAt: number;
  lastMessage?: SerializedMessageSummary;
}

interface StoredChatPayload {
  version: number;
  chat: SerializedChat;
}

const buildChatMetaKey = (chatId: string) => `${CHAT_META_KEY_PREFIX}${chatId}`;

const serializeChat = (chat: Chat): SerializedChat => ({
  ...chat,
  createdAt: chat.createdAt instanceof Date ? chat.createdAt.getTime() : new Date(chat.createdAt).getTime(),
  updatedAt: chat.updatedAt instanceof Date ? chat.updatedAt.getTime() : new Date(chat.updatedAt).getTime(),
  lastMessage: chat.lastMessage
    ? {
        ...chat.lastMessage,
        createdAt:
          chat.lastMessage.createdAt instanceof Date
            ? chat.lastMessage.createdAt.getTime()
            : new Date(chat.lastMessage.createdAt).getTime(),
      }
    : undefined,
});

const deserializeChat = (chat: SerializedChat): Chat => ({
  ...chat,
  createdAt: new Date(chat.createdAt),
  updatedAt: new Date(chat.updatedAt),
  lastMessage: chat.lastMessage
    ? {
        ...chat.lastMessage,
        createdAt: new Date(chat.lastMessage.createdAt),
      }
    : undefined,
});

export const getCachedChatMeta = async (chatId: string): Promise<Chat | null> => {
  try {
    const raw = await AsyncStorage.getItem(buildChatMetaKey(chatId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChatPayload;
    if (parsed.version !== STORAGE_VERSION || !parsed.chat) return null;
    return deserializeChat(parsed.chat);
  } catch {
    return null;
  }
};

export const saveCachedChatMeta = async (chatId: string, chat: Chat): Promise<void> => {
  const payload: StoredChatPayload = {
    version: STORAGE_VERSION,
    chat: serializeChat(chat),
  };
  try {
    await AsyncStorage.setItem(buildChatMetaKey(chatId), JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

export const clearCachedChatMeta = async (chatId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(buildChatMetaKey(chatId));
  } catch {
    // ignore
  }
};
