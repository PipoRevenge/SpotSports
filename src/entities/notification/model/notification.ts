import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'CHAT_MESSAGE' 
  | 'MEETUP_REMINDER' 
  | 'SOCIAL_REACTION' 
  | 'SOCIAL_COMMENT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    url?: string;
    entityId?: string;
    senderId?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: Timestamp;
}
