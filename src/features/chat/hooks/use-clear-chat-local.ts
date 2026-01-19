import { chatRepository } from '@/src/api/repositories';
import { useState } from 'react';
import { clearCachedChatMeta } from '../storage/chats-storage';
import { setClearThreshold } from '../storage/clear-threshold-storage';
import { clearLastSeen } from '../storage/last-seen-storage';
import { clearCachedMessages } from '../storage/messages-storage';

export const useClearChatLocal = (chatId?: string, userId?: string) => {
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearLocal = async () => {
    if (!chatId || !userId) return;
    setIsClearing(true);
    setError(null);
    const clearAt = new Date();
    try {
      await Promise.all([
        setClearThreshold(chatId, userId, clearAt),
        clearCachedMessages(chatId),
        clearCachedChatMeta(chatId),
        clearLastSeen(chatId, userId),
        chatRepository.markAsRead(chatId, userId),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not clear the chat locally';
      setError(message);
      throw err;
    } finally {
      setIsClearing(false);
    }
  };

  return { clearLocal, isClearing, error };
};
