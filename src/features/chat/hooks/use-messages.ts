import { chatRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Message } from '@/src/entities/chat';
import { useQuery, useQueryClient } from '@/src/lib/react-query';
import { useEffect, useRef } from 'react';
import { getClearThreshold } from '../storage/clear-threshold-storage';
import { setLastSeen } from '../storage/last-seen-storage';
import { appendCachedMessages, getCachedMessages } from '../storage/messages-storage';

export const useMessages = (chatId?: string) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const hasMarkedAsReadRef = useRef(false);
  const lastMessagesRef = useRef<Message[]>([]);

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

  // Mark as read when messages change
  useEffect(() => {
    const messages = messagesQuery.data;
    if (!chatId || !user || !messages || !messages.length) return;
    
    const lastMessage = messages[messages.length - 1];
    lastMessagesRef.current = messages;
    
    // Update last seen and mark as read
    setLastSeen(chatId, user.id, lastMessage).catch(() => {});
    
    chatRepository.markAsRead(chatId, user.id)
      .then(() => {
        hasMarkedAsReadRef.current = true;
        // Invalidate notifications to update the UI
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        // Invalidate chats list to update unread counts
        queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
      })
      .catch(() => {});
  }, [chatId, user, messagesQuery.data, queryClient]);

  // Mark as read when unmounting (user leaves the chat)
  useEffect(() => {
    return () => {
      if (!chatId || !user || !hasMarkedAsReadRef.current) return;
      
      // Get the last message from the ref
      const messages = lastMessagesRef.current;
      if (!messages || !messages.length) return;
      
      const lastMessage = messages[messages.length - 1];
      
      // Final mark as read when leaving
      setLastSeen(chatId, user.id, lastMessage).catch(() => {});
      chatRepository.markAsRead(chatId, user.id)
        .then(() => {
          // Force immediate invalidation
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
        })
        .catch(() => {});
    };
  }, [chatId, user, queryClient]);

  return { messages: messagesQuery.data ?? [], isLoading: messagesQuery.isLoading || messagesQuery.isFetching };
};
