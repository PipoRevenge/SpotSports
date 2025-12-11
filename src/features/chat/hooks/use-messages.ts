import { chatRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Message } from '@/src/entities/chat';
import { useEffect, useState } from 'react';
import { getClearThreshold } from '../storage/clear-threshold-storage';
import { setLastSeen } from '../storage/last-seen-storage';
import { appendCachedMessages, getCachedMessages } from '../storage/messages-storage';

export const useMessages = (chatId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useUser();

  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;
    setIsLoading(true);

    const loadAndSync = async () => {
      const clearAt = user ? await getClearThreshold(chatId, user.id) : null;
      const cached = await getCachedMessages(chatId);
      const filteredCached = clearAt ? cached.filter(m => m.createdAt > clearAt) : cached;
      if (isMounted) setMessages(filteredCached);

      const since = cached[cached.length - 1]?.createdAt;
      try {
        const { items } = await chatRepository.getMessages(chatId, { since });
        if (!isMounted) return;
        const merged = await appendCachedMessages(chatId, items);
        const filtered = clearAt ? merged.filter(m => m.createdAt > clearAt) : merged;
        setMessages(filtered);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAndSync();

    const unsubscribe = chatRepository.subscribeToMessages(chatId, async msgs => {
      if (!msgs.length) return;
      const updated = await appendCachedMessages(chatId, msgs);
      const clearAt = user ? await getClearThreshold(chatId, user.id) : null;
      const filtered = clearAt ? updated.filter(m => m.createdAt > clearAt) : updated;
      if (isMounted) setMessages(filtered);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user || !messages.length) return;
    const lastMessage = messages[messages.length - 1];
    setLastSeen(chatId, user.id, lastMessage).catch(() => {});
    chatRepository.markAsRead(chatId, user.id).catch(() => {});
  }, [chatId, user, messages]);

  return { messages, isLoading };
};
