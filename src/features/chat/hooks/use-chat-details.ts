import { chatRepository } from '@/src/api/repositories';
import { Chat } from '@/src/entities/chat';
import { useEffect, useState } from 'react';
import { getCachedChatMeta, saveCachedChatMeta } from '../storage/chats-storage';

export const useChatDetails = (chatId?: string) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      const cached = await getCachedChatMeta(chatId);
      if (isMounted && cached) setChat(cached);

      try {
        const fresh = await chatRepository.getChatById(chatId);
        if (!isMounted) return;
        setChat(fresh);
        saveCachedChatMeta(chatId, fresh).catch(() => {});
      } catch (err) {
        if (isMounted && !cached) setError(err instanceof Error ? err.message : 'Error loading chat');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = chatRepository.subscribeToChat(chatId, nextChat => {
      setChat(nextChat);
      saveCachedChatMeta(chatId, nextChat).catch(() => {});
    });
    return () => unsubscribe();
  }, [chatId]);

  return { chat, isLoading, error };
};
