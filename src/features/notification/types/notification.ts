import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'CHAT_MESSAGE' 
  | 'MEETUP_REMINDER' 
  | 'SOCIAL_REACTION' 
  | 'SOCIAL_COMMENT'
  | 'REVIEW_CREATE'
  | 'SPOT_CREATE'
  | 'DISCUSSION_CREATE'
  | 'FOLLOW_CREATE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    url?: string;
    entityId?: string;
    targetType?: string; // 'review', 'spot', 'discussion', 'user', 'comment'
    targetId?: string;
    targetPreview?: string; // 'Title of post', 'Spot Name', etc.
    senderName?: string;
    senderId?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: Timestamp;
}
