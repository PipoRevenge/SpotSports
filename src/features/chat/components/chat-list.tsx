import { FlatList } from '@/src/components/ui/flat-list';
import React, { useCallback, useMemo } from 'react';
import type { ChatListItemView } from '../types';
import { ChatListItem } from './chat-list-item';

interface ChatListProps {
  items: ChatListItemView[];
  onSelect: (chatId: string) => void;
  onAvatarPress?: (chatId: string, type: ChatListItemView['type'], participantId?: string) => void;
  renderEmpty?: React.ReactNode;
}

export const ChatList: React.FC<ChatListProps> = ({ items, onSelect, onAvatarPress, renderEmpty }) => {
  const renderItem = useCallback(
    ({ item }: { item: ChatListItemView }) => (
      <ChatListItem
        id={item.id}
        title={item.title}
        subtitle={item.subtitle}
        avatarUrl={item.avatarUrl}
        type={item.type}
        unreadCount={item.unreadCount}
        participantId={item.participantId}
        lastMessageType={item.lastMessageType}
        lastMessageSenderName={item.lastMessageSenderName}
        onPress={onSelect}
        onAvatarPress={onAvatarPress}
      />
    ),
    [onAvatarPress, onSelect]
  );

  const emptyComponent = useMemo(() => {
    if (!renderEmpty) return null;
    const EmptyComponent = () => <>{renderEmpty}</>;
    EmptyComponent.displayName = 'ChatListEmptyComponent';
    return EmptyComponent;
  }, [renderEmpty]);

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListEmptyComponent={emptyComponent}
    />
  );
};
