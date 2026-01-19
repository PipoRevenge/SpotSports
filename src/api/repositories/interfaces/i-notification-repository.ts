import { AppNotification } from '@/src/features/notification/types/notification';

export interface NotificationPage {
  data: AppNotification[];
  lastDoc?: unknown | null;
  hasMore: boolean;
}

export interface INotificationRepository {
  getNotifications(userId: string, pageSize?: number, lastDoc?: unknown | null): Promise<NotificationPage>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  registerPushToken(userId: string, token: string): Promise<void>;
  removePushToken(userId: string, token: string): Promise<void>;
  createNotification(userId: string, notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<string>;
}
