import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { AppNotification } from '@/src/entities/notification/model/notification';
import { firestore as db } from '@/src/lib/firebase-config';
import { INotificationRepository, NotificationPage } from '../interfaces/i-notification-repository';

export class NotificationRepositoryImpl implements INotificationRepository {
  async getNotifications(
    userId: string,
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot | null
  ): Promise<NotificationPage> {
    const notificationsRef = collection(db, 'users', userId, 'notifications');

    const baseQuery = [orderBy('createdAt', 'desc'), limit(pageSize)];
    const composedQuery = lastDoc
      ? query(notificationsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))
      : query(notificationsRef, ...baseQuery);

    const snapshot = await getDocs(composedQuery);
    const notifications = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as AppNotification[];

    return {
      data: notifications,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
      hasMore: snapshot.docs.length === pageSize,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(ref, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const unreadQuery = query(notificationsRef, where('isRead', '==', false));
    const snapshot = await getDocs(unreadQuery);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.slice(0, 500).forEach(docSnap => {
      batch.update(docSnap.ref, { isRead: true });
    });

    await batch.commit();
  }

  async registerPushToken(userId: string, token: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushTokens: arrayUnion(token),
    });
  }

  async removePushToken(userId: string, token: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushTokens: arrayRemove(token),
    });
  }
}
