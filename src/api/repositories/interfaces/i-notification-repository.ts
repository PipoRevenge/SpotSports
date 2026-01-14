import { AppNotification } from '@/src/entities/notification/model/notification';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export interface NotificationPage {
  data: AppNotification[];
  lastDoc?: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export interface INotificationRepository {
  getNotifications(userId: string, pageSize?: number, lastDoc?: QueryDocumentSnapshot | null): Promise<NotificationPage>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  registerPushToken(userId: string, token: string): Promise<void>;
  removePushToken(userId: string, token: string): Promise<void>;
}
