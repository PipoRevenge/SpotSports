import { chatRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Message } from '@/src/entities/chat';
import { useQuery, useQueryClient } from '@/src/lib/react-query';
import { useEffect } from 'react';
import { getClearThreshold } from '../storage/clear-threshold-storage';
import { setLastSeen } from '../storage/last-seen-storage';
import { appendCachedMessages, getCachedMessages } from '../storage/messages-storage';

export const useMessages = (chatId?: string) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<Message[]>({
    queryKey: ['chat', chatId, 'messages'],
    enabled: !!chatId,
    staleTime: Infinity,
    queryFn: async () => {
      if (!chatId) return [];
      const clearAt = user ? await getClearThreshold(chatId, user.id) : null;
      const cached = await getCachedMessages(chatId);
      const filteredCached = clearAt ? cached.filter(m => m.createdAt > clearAt) : cached;

      const since = cached[cached.length - 1]?.createdAt;
      const { items } = await chatRepository.getMessages(chatId, { since });
      const merged = await appendCachedMessages(chatId, items);
      return clearAt ? merged.filter(m => m.createdAt > clearAt) : merged;
    },
  });

  useEffect(() => {
    if (!chatId) return;
    const key = ['chat', chatId, 'messages'];
    const unsubscribe = chatRepository.subscribeToMessages(chatId, async msgs => {
      if (!msgs.length) return;
      const updated = await appendCachedMessages(chatId, msgs);
      const clearAt = user ? await getClearThreshold(chatId, user.id) : null;
      const filtered = clearAt ? updated.filter(m => m.createdAt > clearAt) : updated;
      queryClient.setQueryData(key, filtered);
    });

    return () => unsubscribe();
  }, [chatId, queryClient, user]);

  useEffect(() => {
    const messages = messagesQuery.data;
    if (!chatId || !user || !messages || !messages.length) return;
    const lastMessage = messages[messages.length - 1];
    setLastSeen(chatId, user.id, lastMessage).catch(() => {});
    chatRepository.markAsRead(chatId, user.id).catch(() => {});
  }, [chatId, user, messagesQuery.data]);

  return { messages: messagesQuery.data ?? [], isLoading: messagesQuery.isLoading || messagesQuery.isFetching };
};
