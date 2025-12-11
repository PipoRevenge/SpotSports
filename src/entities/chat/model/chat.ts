export type ChatType = 'direct' | 'group';

export type ChatMemberRole = 'owner' | 'admin' | 'member';

export interface ChatMember {
  userId: string;
  role: ChatMemberRole;
  joinedAt: Date;
}

export interface MessageSummary {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  photoURL?: string;
  memberIds: string[]; // Flat member list for fast queries
  members?: ChatMember[];
  lastMessage?: MessageSummary;
  unreadCounts?: Record<string, number>;
  lastReadAt?: Record<string, Date>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
}
