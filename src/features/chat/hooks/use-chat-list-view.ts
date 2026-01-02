import { chatRepository, userRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Chat, ChatType } from '@/src/entities/chat';
import { User } from '@/src/entities/user/model/user';
import { useEffect, useState } from 'react';
import { saveCachedChatMeta } from '../storage/chats-storage';
import { getClearThreshold } from '../storage/clear-threshold-storage';
import { getLastSeen } from '../storage/last-seen-storage';
import { getCachedMessages } from '../storage/messages-storage';
import type { ChatListItemView } from '../types/chat-types';

export type ChatFilter = 'all' | ChatType;

export const useChatListView = (filter: ChatFilter = 'all') => {
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [items, setItems] = useState<ChatListItemView[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = chatRepository.subscribeToUserChats(user.id, nextChats => {
      setChats(nextChats);
      nextChats.forEach(chat => saveCachedChatMeta(chat.id, chat).catch(() => {}));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const build = async () => {
      if (!user) return;
      const cache = new Map<string, User>();
      const senderCache = new Map<string, User>();
      const views: ChatListItemView[] = [];
      
      // Debug: Log all chats to see their structure
      console.log('🔍 [useChatListView] All chats:', chats.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        meetupId: c.meetupId,
        meetupSpotId: c.meetupSpotId,
        description: c.description
      })));
      console.log('🔍 [useChatListView] Current filter:', filter);
      
      // Filter chats based on selected filter
      const filteredChats = filter === 'all' 
        ? chats 
        : chats.filter(chat => {
            // For meetup-group filter, check if chat has meetupId (regardless of type field)
            if (filter === 'meetup-group') {
              const isMeetupChat = !!chat.meetupId;
              console.log(`  Chat "${chat.name}": meetupId=${chat.meetupId}, included=${isMeetupChat}`);
              return isMeetupChat;
            }
            // For other filters, match by type (but exclude chats with meetupId from 'group' filter)
            if (filter === 'group') {
              return chat.type === 'group' && !chat.meetupId;
            }
            return chat.type === filter;
          });
      
      console.log('🔍 [useChatListView] Filtered chats count:', filteredChats.length);
      
      for (const chat of filteredChats) {
        const clearAt = user ? await getClearThreshold(chat.id, user.id) : null;
        const hasNewSinceClear = clearAt ? (chat.lastMessage ? chat.lastMessage.createdAt > clearAt : chat.updatedAt > clearAt) : true;
        if (clearAt && !hasNewSinceClear) {
          continue;
        }
        const lastSeenInfo = user ? await getLastSeen(chat.id, user.id) : {};
        const baseDate = (() => {
          if (clearAt && lastSeenInfo.createdAt) return clearAt > lastSeenInfo.createdAt ? clearAt : lastSeenInfo.createdAt;
          if (clearAt) return clearAt;
          if (lastSeenInfo.createdAt) return lastSeenInfo.createdAt;
          return null;
        })();
        const cachedMessages = await getCachedMessages(chat.id);
        const localUnread = (() => {
          const threshold = baseDate ?? new Date(0);
          const count = cachedMessages.filter(m => m.createdAt > threshold && m.senderId !== user?.id).length;
          if (count > 0) return count;
          if (chat.lastMessage && chat.lastMessage.createdAt > threshold && chat.lastMessage.senderId !== user?.id) {
            return 1;
          }
          return 0;
        })();
        const lastMsg = chat.lastMessage;
        let lastMessageType: 'text' | 'image' | 'video' | undefined = undefined;
        if (lastMsg?.text) {
          if (lastMsg.text.includes('[Imagen]')) lastMessageType = 'image';
          else if (lastMsg.text.includes('[Video]')) lastMessageType = 'video';
          else lastMessageType = 'text';
        }

        let lastSenderName: string | undefined;
        if (lastMsg?.senderId) {
          const existing = cache.get(lastMsg.senderId) || senderCache.get(lastMsg.senderId);
          if (existing) {
            lastSenderName = existing.userDetails.userName;
          } else {
            try {
              const sender = await userRepository.getUserById(lastMsg.senderId);
              senderCache.set(lastMsg.senderId, sender);
              lastSenderName = sender.userDetails.userName;
            } catch {
              lastSenderName = undefined;
            }
          }
        }

        if (chat.type === 'direct') {
          // Try to find other user from memberIds (populated from subcollection)
          const otherId = chat.memberIds.find(id => id !== user.id);
          
          // If no otherId found (e.g. empty members), skip or show placeholder
          if (!otherId) {
             console.warn(`[useChatListView] Direct chat ${chat.id} has no other member`);
             continue;
          }

          let other = cache.get(otherId);
          if (!other) {
            try {
              other = await userRepository.getUserById(otherId);
              cache.set(otherId, other);
            } catch {
              continue;
            }
          }
          const serverUnread = chat.unreadCounts?.[user.id];
          const unreadCount = Math.max(typeof serverUnread === 'number' ? serverUnread : 0, localUnread);
          const unreadAfterClear = clearAt && chat.lastMessage?.createdAt && chat.lastMessage.createdAt <= clearAt ? 0 : unreadCount;

          views.push({
            id: chat.id,
            title: other.userDetails.userName,
            subtitle: chat.lastMessage?.text,
            avatarUrl: other.userDetails.photoURL,
            type: chat.type,
            unreadCount: unreadAfterClear,
            memberCount: chat.memberIds.length,
            participantId: other.id,
            lastMessageType,
            lastMessageSenderName: lastSenderName,
          });
        } else {
          const serverUnread = chat.unreadCounts?.[user.id];
          const unreadCount = Math.max(typeof serverUnread === 'number' ? serverUnread : 0, localUnread);
          const unreadAfterClear = clearAt && chat.lastMessage?.createdAt && chat.lastMessage.createdAt <= clearAt ? 0 : unreadCount;
          views.push({
            id: chat.id,
            title: chat.name || 'Grupo',
            // Show last message as the subtitle for groups list
            subtitle: chat.lastMessage?.text || chat.description,
            avatarUrl: chat.photoURL,
            type: chat.type,
            unreadCount: unreadAfterClear,
            memberCount: chat.memberIds.length,
            lastMessageType,
            lastMessageSenderName: lastSenderName,
          });
        }
      }
      setItems(views);
    };
    build();
  }, [chats, user, filter]);

  const refetch = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await chatRepository.listChatsForUser(user.id);
      setChats(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar chats');
    } finally {
      setIsLoading(false);
    }
  };

  return { items, isLoading, error, refetch };
};
