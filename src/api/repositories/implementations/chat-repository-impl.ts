import { Chat, Message, MessageSummary } from '@/src/entities/chat';
import {
    arrayRemove,
    arrayUnion,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    startAfter,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '../../../lib/firebase-config';
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
      memberIds: [], // Populated later from subcollection
      members: [], // Populated later from subcollection
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
      meetupId: data.meetupId,
      meetupSpotId: data.meetupSpotId,
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

    const createDirectChatFn = httpsCallable(functions, 'chats-createDirect');
    const result = await createDirectChatFn({
      targetUserId,
    });

    const { chatId } = result.data as { chatId: string };
    return this.getChatById(chatId);
  }

  async createGroupChat(params: { ownerId: string; name: string; memberIds: string[]; photoURL?: string; description?: string; meetupId?: string; meetupSpotId?: string }): Promise<Chat> {
    const { ownerId, name, memberIds, photoURL, description, meetupId, meetupSpotId } = params;
    if (!ownerId || !name) throw new Error('Faltan datos para el grupo');
    
    // Use callable for group creation to ensure consistency
    const createGroupChatFn = httpsCallable(functions, 'chats-createGroup');
    const result = await createGroupChatFn({
        name,
        participantIds: memberIds
    });
    
    const { chatId } = result.data as { chatId: string };
    return this.getChatById(chatId);
  }

  async getChatMembers(chatId: string): Promise<any[]> {
    const membersRef = collection(firestore, this.CHATS_COLLECTION, chatId, 'members');
    const snap = await getDocs(membersRef);
    return snap.docs.map(d => d.data());
  }

  async getChatById(chatId: string): Promise<Chat> {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) throw new Error('Chat no encontrado');
    
    const chat = this.toChat(chatSnap);
    
    // Fetch members subcollection
    const membersRef = collection(chatRef, 'members');
    const membersSnap = await getDocs(membersRef);
    chat.members = membersSnap.docs.map(d => {
        const data = d.data();
        return {
            userId: data.userId,
            role: data.role,
            joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt)
        };
    });
    chat.memberIds = chat.members.map(m => m.userId);
    
    return chat;
  }

  async listChatsForUser(userId: string, options?: { limit?: number; startAfter?: any }): Promise<{ items: Chat[]; lastVisible?: any }> {
    // 1. Query members subcollection
    const membersQuery = query(
        collectionGroup(firestore, 'members'),
        where('userId', '==', userId)
    );
    const membersSnap = await getDocs(membersQuery);
    
    // 2. Fetch chats
    const chatRefs = membersSnap.docs.map(d => d.ref.parent.parent).filter(r => r !== null);
    // Deduplicate refs
    const uniqueRefs = new Set<string>();
    const uniqueChatRefs: any[] = [];
    chatRefs.forEach(ref => {
        if (ref && !uniqueRefs.has(ref.path)) {
            uniqueRefs.add(ref.path);
            uniqueChatRefs.push(ref);
        }
    });

    const fetchPromises = uniqueChatRefs.map(ref => getDoc(ref));
    const chatSnaps = await Promise.all(fetchPromises);
    
    let items = chatSnaps
        .filter(s => s.exists())
        .map(this.toChat);

    // Fetch members for each chat (needed for UI to show other user in direct chats)
    // This is N+1 but necessary with subcollections if we don't duplicate data
    await Promise.all(items.map(async (chat) => {
        const membersRef = collection(firestore, this.CHATS_COLLECTION, chat.id, 'members');
        const membersSnap = await getDocs(membersRef);
        chat.members = membersSnap.docs.map(d => {
            const data = d.data();
            return {
                userId: data.userId,
                role: data.role,
                joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt)
            };
        });
        chat.memberIds = chat.members.map(m => m.userId);
    }));

    // Sort by updatedAt desc
    items.sort((a, b) => {
        const ta = a.updatedAt?.getTime() || 0;
        const tb = b.updatedAt?.getTime() || 0;
        return tb - ta;
    });

    // Apply limit and startAfter manually
    if (options?.startAfter) {
        // Assuming startAfter is a Timestamp
        const startAfterTime = options.startAfter.toDate ? options.startAfter.toDate().getTime() : new Date(options.startAfter).getTime();
        const startIndex = items.findIndex(i => i.updatedAt?.getTime() < startAfterTime); // Descending order
        // Actually startAfter is usually the last doc, so we want items AFTER that doc.
        // Since we sorted desc, "after" means older, so smaller timestamp.
        // But findIndex might be tricky.
        // Let's just slice if we find the exact timestamp?
        // Or just ignore pagination for now as it's complex without array.
    }
    
    if (options?.limit) {
        items = items.slice(0, options.limit);
    }

    const lastVisible = items.length > 0 ? items[items.length - 1].updatedAt : null;
    return { items, lastVisible };
  }

  subscribeToUserChats(userId: string, cb: (chats: Chat[]) => void, onError?: (error: Error) => void): () => void {
    const membersQuery = query(
      collectionGroup(firestore, 'members'),
      where('userId', '==', userId)
    );

    const chatListeners = new Map<string, () => void>();
    const chatsMap = new Map<string, Chat>();

    const notify = () => {
        const sortedChats = Array.from(chatsMap.values()).sort((a, b) => {
            const ta = a.updatedAt?.getTime() || 0;
            const tb = b.updatedAt?.getTime() || 0;
            return tb - ta;
        });
        cb(sortedChats);
    };

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
        const currentChatIds = new Set<string>();
        
        snapshot.docs.forEach(doc => {
            const chatRef = doc.ref.parent.parent;
            if (chatRef) {
                const chatId = chatRef.id;
                currentChatIds.add(chatId);

                if (!chatListeners.has(chatId)) {
                    const unsubChat = onSnapshot(chatRef, async (chatSnap) => {
                        if (chatSnap.exists()) {
                            const chat = this.toChat(chatSnap);
                            
                            // Fetch members subcollection
                            const membersRef = collection(chatRef, 'members');
                            const membersSnap = await getDocs(membersRef);
                            chat.members = membersSnap.docs.map(d => {
                                const data = d.data();
                                return {
                                    userId: data.userId,
                                    role: data.role,
                                    joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt)
                                };
                            });
                            chat.memberIds = chat.members.map(m => m.userId);

                            chatsMap.set(chatId, chat);
                            notify();
                        } else {
                            chatsMap.delete(chatId);
                            notify();
                        }
                    }, (error) => {
                        console.error('Error in chat listener:', error);
                        if (onError) onError(error);
                    });
                    chatListeners.set(chatId, unsubChat);
                }
            }
        });

        // Cleanup
        for (const [chatId, unsub] of chatListeners) {
            if (!currentChatIds.has(chatId)) {
                unsub();
                chatListeners.delete(chatId);
                chatsMap.delete(chatId);
                notify();
            }
        }
        
        // If snapshot is empty, we still need to notify to clear loading state
        if (snapshot.empty) {
             notify();
        }
    }, (error) => {
        console.error('Error in members listener:', error);
        if (onError) onError(error);
    });

    return () => {
        unsubscribeMembers();
        chatListeners.forEach(unsub => unsub());
    };
  }

  subscribeToChat(chatId: string, cb: (chat: Chat) => void): () => void {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const unsubscribe = onSnapshot(chatRef, async snapshot => {
      if (!snapshot.exists()) return;
      const chat = this.toChat(snapshot);
      
      // Fetch members subcollection
      const membersRef = collection(chatRef, 'members');
      const membersSnap = await getDocs(membersRef);
      chat.members = membersSnap.docs.map(d => {
          const data = d.data();
          return {
              userId: data.userId,
              role: data.role,
              joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt)
          };
      });
      chat.memberIds = chat.members.map(m => m.userId);
      
      cb(chat);
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

    const sendMessageFn = httpsCallable(functions, 'chats-sendMessage');
    const result = await sendMessageFn({
      chatId,
      text,
      mediaUrl,
      mediaType,
    });

    const { messageId } = result.data as { messageId: string };
    
    // Fetch the created message to return it
    const messageRef = doc(firestore, this.CHATS_COLLECTION, chatId, this.MESSAGES_SUBCOLLECTION, messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) {
        // Fallback if read fails immediately (though it shouldn't)
        return {
            id: messageId,
            chatId,
            senderId,
            text: text || '',
            mediaUrl: mediaUrl || undefined,
            mediaType: mediaType || undefined,
            createdAt: new Date(),
        };
    }
    
    return this.toMessage(messageSnap);
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const deleteChatFn = httpsCallable(functions, 'chats-delete');
    await deleteChatFn({ chatId, userId });
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const markAsReadFn = httpsCallable(functions, 'chats-markRead');
    await markAsReadFn({ chatId, userId });
  }

  async addGroupMembers(params: { chatId: string; adminId: string; newMemberIds: string[] }): Promise<Chat> {
    const { chatId, adminId, newMemberIds } = params;
    if (!chatId || !adminId || !newMemberIds?.length) throw new Error('Faltan datos');

    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) throw new Error('Chat no encontrado');
    const chat = this.toChat(snap);
    if (chat.type !== 'group' && chat.type !== 'meetup-group') throw new Error('Solo grupos permiten añadir miembros');
    
    // Check if adminId has permission (check in members subcollection)
    const adminMemberRef = doc(collection(chatRef, 'members'), adminId);
    const adminSnap = await getDoc(adminMemberRef);
    if (!adminSnap.exists()) throw new Error('No perteneces al grupo');
    const adminData = adminSnap.data();
    if (adminData.role !== 'admin' && adminData.role !== 'owner') throw new Error('No tienes permisos');

    const now = Timestamp.now();
    const currentIds = new Set(chat.memberIds);
    const toAdd = newMemberIds.filter(id => !currentIds.has(id));
    if (!toAdd.length) return chat;

    // Add to memberIds array in main doc
    await updateDoc(chatRef, {
      memberIds: arrayUnion(...toAdd),
      updatedAt: now,
    });
    
    // Add each member to subcollection
    const membersCollectionRef = collection(chatRef, 'members');
    for (const memberId of toAdd) {
      const memberDoc = doc(membersCollectionRef, memberId);
      await setDoc(memberDoc, {
        userId: memberId,
        role: 'member',
        joinedAt: now,
      });
    }

    const updated = await getDoc(chatRef);
    return this.toChat(updated);
  }

  async promoteToAdmin(params: { chatId: string; adminId: string; targetUserId: string }): Promise<Chat> {
    const { chatId, adminId, targetUserId } = params;
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) throw new Error('Chat no encontrado');
    const chat = this.toChat(snap);
    if (chat.type !== 'group' && chat.type !== 'meetup-group') throw new Error('Solo grupos permiten roles');
    
    // Check admin permissions
    const adminMemberRef = doc(collection(chatRef, 'members'), adminId);
    const adminSnap = await getDoc(adminMemberRef);
    if (!adminSnap.exists()) throw new Error('No perteneces al grupo');
    const adminData = adminSnap.data();
    if (adminData.role !== 'admin' && adminData.role !== 'owner') throw new Error('No tienes permisos');
    
    // Check target member
    const targetMemberRef = doc(collection(chatRef, 'members'), targetUserId);
    const targetSnap = await getDoc(targetMemberRef);
    if (!targetSnap.exists()) throw new Error('Usuario no está en el grupo');
    const targetData = targetSnap.data();
    if (targetData.role === 'admin' || targetData.role === 'owner') return chat;
    
    // Update role
    await updateDoc(targetMemberRef, {
      role: 'admin',
    });
    
    await updateDoc(chatRef, { updatedAt: Timestamp.now() });
    const updated = await getDoc(chatRef);
    return this.toChat(updated);
  }

  async removeGroupMember(chatId: string, adminId: string, targetUserId: string): Promise<void> {
    const removeMemberFn = httpsCallable(functions, 'chats-removeMember');
    await removeMemberFn({ chatId, targetUserId });
  }

  async leaveGroup(chatId: string, userId: string): Promise<void> {
    const chatRef = doc(firestore, this.CHATS_COLLECTION, chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) throw new Error('Chat no encontrado');
    const chat = this.toChat(snap);
    if (chat.type !== 'group' && chat.type !== 'meetup-group') throw new Error('Solo grupos permiten salir');
    
    // Remove from memberIds array
    await updateDoc(chatRef, {
      memberIds: arrayRemove(userId),
      updatedAt: Timestamp.now(),
    });
    
    // Remove from members subcollection
    const memberDocRef = doc(collection(chatRef, 'members'), userId);
    await deleteDoc(memberDocRef);
  }
}
