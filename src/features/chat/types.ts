import type { ChatType } from '@/src/entities/chat';

export interface ChatListItemView {
  id: string;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  type: ChatType;
  unreadCount: number;
  memberCount: number;
  participantId?: string;
  lastMessageType?: 'text' | 'image' | 'video';
  lastMessageSenderName?: string;
}

export interface ChatListItemProps {
  id: string;
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  avatarUrl?: string;
  type?: ChatType;
  unreadCount?: number;
  participantId?: string;
  lastMessageType?: 'text' | 'image' | 'video';
  lastMessageSenderName?: string;
  onPress?: (id: string) => void;
  onAvatarPress?: (id: string, type: ChatType, participantId?: string) => void;
  actionSlot?: React.ReactNode;
}

export type { ChatType };

