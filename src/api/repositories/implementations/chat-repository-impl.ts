import { Chat, Message, MessageSummary } from '@/src/entities/chat';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit as firestoreLimit,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  startAfter,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { firestore } from '../../../lib/firebase-config';
import { IChatRepository } from '../interfaces/i-chat-repository';

export class ChatRepositoryImpl implements IChatRepository {
  private readonly CHATS_COLLECTION = 'chats';
  private readonly MESSAGES_SUBCOLLECTION = 'messages';

  private toChat = (docSnap: any): Chat => {
    const data = docSnap.data();
    const lastMessageRaw = data.lastMessage as (MessageSummary & { createdAt?: Timestamp }) | undefined;
    const lastReadAtRaw = data.lastReadAt as Record<string, Timestamp | Date | number> | undefined;
    return {
      id: docSnap.id,
      type: data.type,
      name: data.name,
      description: data.description,
      photoURL: data.photoURL,
      memberIds: data.memberIds || [],
      members: data.members?.map((m: any) => ({
        ...m,
        joinedAt: m.joinedAt?.toDate ? m.joinedAt.toDate() : m.joinedAt,
      })),
      unreadCounts: data.unreadCounts || {},
      lastReadAt: lastReadAtRaw
        ? Object.fromEntries(
            Object.entries(lastReadAtRaw).map(([userId, value]) => {
              const date = (value as any)?.toDate ? (value as any).toDate() : new Date(value as any);
              return [userId, date];
            })
          )
        : undefined,
      lastMessage: lastMessageRaw
        ? {
            ...lastMessageRaw,
            createdAt: lastMessageRaw.createdAt?.toDate ? lastMessageRaw.createdAt.toDate() : new Date(),
          }
        : undefined,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    };
  };

  private toMessage = (docSnap: any): Message => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      chatId: data.chatId,
      senderId: data.senderId,
      text: data.text,
      mediaUrl: data.mediaUrl || undefined,
      mediaType: data.mediaType,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  };

  async createDirectChat(currentUserId: string, targetUserId: string): Promise<Chat> {
    if (!currentUserId || !targetUserId) throw new Error('Se requieren los usuarios');
    if (currentUserId === targetUserId) throw new Error('No puedes chatear contigo mismo');

    const memberIds = Array.from(new Set([currentUserId, targetUserId]));
    const chatsRef = collection(firestore, this.CHATS_COLLECTION);
    const existingQuery = query(
      chatsRef,
      where('type', '==', 'direct'),
      where('memberIds', 'array-contains', currentUserId),
      firestoreLimit(30)
    );
    const existingSnapshot = await getDocs(existingQuery);
    const existing = existingSnapshot.docs.find(docSnap => {
      const members: string[] = docSnap.data().memberIds || [];
      return members.includes(targetUserId);
    });

    if (existing) {
      return this.toChat(existing);
    }

    const now = Timestamp.now();
    const chatRef = await addDoc(chatsRef, {
      type: 'direct',
      memberIds,
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
    });

    const created = await getDoc(chatRef);
    return this.toChat(created);
  }

  async createGroupChat(params: { ownerId: string; name: string; memberIds: string[]; photoURL?: string; description?: string }): Promise<Chat> {
    const { ownerId, name, memberIds, photoURL, description } = params;
    if (!ownerId || !name) throw new Error('Faltan datos para el grupo');
    const uniqueMembers = Array.from(new Set([ownerId, ...memberIds]));
    const now = Timestamp.now();
    const chatsRef = collection(firestore, this.CHATS_COLLECTION);
    const chatRef = await addDoc(chatsRef, {
      type: 'group',
      name,
      description: description || '',
      photoURL: photoURL ?? null,
      memberIds: uniqueMembers,
      members: uniqueMembers.map(id => ({ userId: id, role: id === ownerId ? 'owner' : 'member', joinedAt: now })),
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
      unreadCounts: {},
    });
    const created = await getDoc(chatRef);
    return this.toChat(created);
  }

  async getChatById(chatId: string): Promise<Chat> {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) throw new Error('Chat no encontrado');
    return this.toChat(chatSnap);
  }

  async listChatsForUser(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: Chat[]; lastVisible?: any }> {
    const limitVal = options?.limit || 30;
    let q = query(
      collection(firestore, this.CHATS_COLLECTION),
      where('memberIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
      firestoreLimit(limitVal)
    );
    if (options?.startAfter) {
      q = query(
        collection(firestore, this.CHATS_COLLECTION),
        where('memberIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        where('updatedAt', '<', options.startAfter),
        firestoreLimit(limitVal)
      );
    }
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(this.toChat);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.data().updatedAt;
    return { items, lastVisible };
  }

  subscribeToUserChats(userId: string, cb: (chats: Chat[]) => void): () => void {
    const q = query(
      collection(firestore, this.CHATS_COLLECTION),
      where('memberIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const chats = snapshot.docs.map(this.toChat);
      cb(chats);
    });

    return unsubscribe;
  }

  subscribeToChat(chatId: string, cb: (chat: Chat) => void): () => void {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const unsubscribe = onSnapshot(chatRef, snapshot => {
      if (!snapshot.exists()) return;
      cb(this.toChat(snapshot));
    });
    return unsubscribe;
  }

  subscribeToMessages(chatId: string, cb: (messages: Message[]) => void, options?: { limit?: number }): () => void {
    const limitVal = options?.limit || 50;
    const messagesRef = collection(firestore, this.CHATS_COLLECTION, chatId, this.MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy('createdAt', 'asc'), firestoreLimit(limitVal));
    const unsubscribe = onSnapshot(q, snapshot => {
      const messages = snapshot.docs.map(this.toMessage);
      cb(messages);
    });
    return unsubscribe;
  }

  async getMessages(chatId: string, options?: { limit?: number; since?: Date | number; startAfter?: any }): Promise<{ items: Message[]; lastVisible?: any }> {
    const limitVal = options?.limit || 50;
    const messagesRef = collection(firestore, this.CHATS_COLLECTION, chatId, this.MESSAGES_SUBCOLLECTION);

    const constraints: any[] = [orderBy('createdAt', 'asc'), firestoreLimit(limitVal)];

    if (options?.since) {
      const ts = options.since instanceof Date ? Timestamp.fromDate(options.since) : Timestamp.fromMillis(Number(options.since));
      constraints.unshift(where('createdAt', '>', ts));
    }

    if (options?.startAfter) {
      constraints.push(startAfter(options.startAfter));
    }

    const q = query(messagesRef, ...constraints);
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(this.toMessage);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.data().createdAt;
    return { items, lastVisible };
  }

  async sendMessage(params: { chatId: string; senderId: string; text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }): Promise<Message> {
    const { chatId, senderId, text, mediaUrl, mediaType } = params;
    if (!chatId || !senderId) throw new Error('Faltan datos del mensaje');
    if (!text && !mediaUrl) throw new Error('Mensaje vacío');

    const now = Timestamp.now();
    const messagesRef = collection(firestore, this.CHATS_COLLECTION, chatId, this.MESSAGES_SUBCOLLECTION);
    const messageRef = await addDoc(messagesRef, {
      chatId,
      senderId,
      text: text || '',
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      createdAt: now,
    });

    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const summaryText = text && text.trim().length
      ? text
      : mediaType === 'image'
        ? '[Imagen]'
        : mediaType === 'video'
          ? '[Video]'
          : '';

    const lastMessage: MessageSummary = { id: messageRef.id, senderId, text: summaryText, createdAt: now.toDate() };
    // increment unread counts for every member except sender
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data();
    const memberIds: string[] = chatData?.memberIds || [];
    const unreadUpdates: Record<string, any> = {
      lastMessage: { ...lastMessage, createdAt: now },
      updatedAt: now,
    };
    memberIds
      .filter(id => id !== senderId)
      .forEach(id => {
        unreadUpdates[`unreadCounts.${id}`] = increment(1);
      });

    await updateDoc(chatRef, unreadUpdates);

    const messageSnap = await getDoc(messageRef);
    return this.toMessage(messageSnap);
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    if (!chatId || !userId) throw new Error('Faltan datos');

    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) throw new Error('Chat no encontrado');
    const chat = this.toChat(chatSnap);

    if (!chat.memberIds.includes(userId)) throw new Error('No perteneces a este chat');

    if (chat.type === 'group') {
      const member = chat.members?.find(m => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new Error('No tienes permisos para borrar el grupo');
      }
    }

    // Delete all messages in the subcollection
    const messagesRef = collection(firestore, this.CHATS_COLLECTION, chatId, this.MESSAGES_SUBCOLLECTION);
    const messagesSnap = await getDocs(messagesRef);
    for (const msg of messagesSnap.docs) {
      await deleteDoc(msg.ref);
    }

    await deleteDoc(chatRef);
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const now = Timestamp.now();
    await updateDoc(chatRef, {
      [`unreadCounts.${userId}`]: 0,
      [`lastReadAt.${userId}`]: now,
      updatedAt: now,
    });

    try {
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return;
      const chat = this.toChat(chatSnap);
      this.cleanupMessagesReadByAll(chatId, chat.memberIds, chat.lastReadAt).catch(() => {});
    } catch {
      // ignore cleanup errors
    }
  }

  private async cleanupMessagesReadByAll(chatId: string, memberIds: string[], lastReadAt?: Record<string, Date>): Promise<void> {
    if (!memberIds?.length || !lastReadAt) return;
    const perUserDates = memberIds.map(id => lastReadAt[id]).filter(Boolean) as Date[];
    if (!perUserDates.length || perUserDates.length !== memberIds.length) return;

    const threshold = new Date(Math.min(...perUserDates.map(d => d.getTime())));
    const messagesRef = collection(firestore, this.CHATS_COLLECTION, chatId, this.MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, where('createdAt', '<=', Timestamp.fromDate(threshold)), firestoreLimit(50));
    const snapshot = await getDocs(q);
    if (!snapshot.size) return;
    const deletions = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletions);
  }

  async addGroupMembers(params: { chatId: string; adminId: string; newMemberIds: string[] }): Promise<Chat> {
    const { chatId, adminId, newMemberIds } = params;
    if (!chatId || !adminId || !newMemberIds?.length) throw new Error('Faltan datos');

    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    await runTransaction(firestore, async transaction => {
      const snap = await transaction.get(chatRef);
      if (!snap.exists()) throw new Error('Chat no encontrado');
      const chat = this.toChat(snap);
      if (chat.type !== 'group') throw new Error('Solo grupos permiten añadir miembros');
      const admin = chat.members?.find(m => m.userId === adminId);
      if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) throw new Error('No tienes permisos');

      const now = Timestamp.now();
      const currentIds = new Set(chat.memberIds);
      const toAdd = newMemberIds.filter(id => !currentIds.has(id));
      if (!toAdd.length) return;

      const updatedMembers = [...(chat.members || []), ...toAdd.map(id => ({ userId: id, role: 'member', joinedAt: now }))];
      const updatedMemberIds = [...chat.memberIds, ...toAdd];

      transaction.update(chatRef, {
        memberIds: updatedMemberIds,
        members: updatedMembers,
        updatedAt: now,
      });
    });

    const updated = await getDoc(chatRef);
    return this.toChat(updated);
  }

  async promoteToAdmin(params: { chatId: string; adminId: string; targetUserId: string }): Promise<Chat> {
    const { chatId, adminId, targetUserId } = params;
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    await runTransaction(firestore, async transaction => {
      const snap = await transaction.get(chatRef);
      if (!snap.exists()) throw new Error('Chat no encontrado');
      const chat = this.toChat(snap);
      if (chat.type !== 'group') throw new Error('Solo grupos permiten roles');
      const admin = chat.members?.find(m => m.userId === adminId);
      if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) throw new Error('No tienes permisos');
      const target = chat.members?.find(m => m.userId === targetUserId);
      if (!target) throw new Error('Usuario no está en el grupo');
      if (target.role === 'admin' || target.role === 'owner') return;
      const updatedMembers = (chat.members || []).map(m =>
        m.userId === targetUserId ? { ...m, role: 'admin' } : m
      );
      transaction.update(chatRef, { members: updatedMembers, updatedAt: Timestamp.now() });
    });
    const updated = await getDoc(chatRef);
    return this.toChat(updated);
  }

  async leaveGroup(chatId: string, userId: string): Promise<void> {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    await runTransaction(firestore, async transaction => {
      const snap = await transaction.get(chatRef);
      if (!snap.exists()) throw new Error('Chat no encontrado');
      const chat = this.toChat(snap);
      if (chat.type !== 'group') throw new Error('Solo grupos permiten salir');
      const remainingMemberIds = chat.memberIds.filter(id => id !== userId);
      const remainingMembers = (chat.members || []).filter(m => m.userId !== userId);
      transaction.update(chatRef, {
        memberIds: remainingMemberIds,
        members: remainingMembers,
        updatedAt: Timestamp.now(),
      });
    });
  }
}
