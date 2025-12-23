import { Chat, Message } from '@/src/entities/chat';

export interface IChatRepository {
  createDirectChat(currentUserId: string, targetUserId: string): Promise<Chat>;
  createGroupChat(params: {
    ownerId: string;
    name: string;
    memberIds: string[];
    photoURL?: string;
    description?: string;
    meetupId?: string;
    meetupSpotId?: string;
  }): Promise<Chat>;
  getChatById(chatId: string): Promise<Chat>;
  listChatsForUser(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: Chat[]; lastVisible?: any }>;
  subscribeToUserChats(userId: string, cb: (chats: Chat[]) => void): () => void;
  subscribeToChat(chatId: string, cb: (chat: Chat) => void): () => void;
  subscribeToMessages(chatId: string, cb: (messages: Message[]) => void, options?: { limit?: number }): () => void;
  getMessages(chatId: string, options?: { limit?: number; since?: Date | number; startAfter?: any }): Promise<{ items: Message[]; lastVisible?: any }>;
  sendMessage(params: { chatId: string; senderId: string; text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }): Promise<Message>;
  markAsRead(chatId: string, userId: string): Promise<void>;
  addGroupMembers(params: { chatId: string; adminId: string; newMemberIds: string[] }): Promise<Chat>;
  promoteToAdmin(params: { chatId: string; adminId: string; targetUserId: string }): Promise<Chat>;
  leaveGroup(chatId: string, userId: string): Promise<void>;
  deleteChat(chatId: string, userId: string): Promise<void>;
}
