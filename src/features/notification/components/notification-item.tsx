import { Box } from '@/src/components/ui/box';
import { HStack } from '@/src/components/ui/hstack';
import { Icon } from '@/src/components/ui/icon';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { AppNotification } from '@/src/entities/notification/model/notification';
import { formatDate } from '@/src/utils/date-utils';
import { useRouter } from 'expo-router';
import { Bell, Calendar, Heart, MessageCircle, MessageSquare } from 'lucide-react-native';
import React from 'react';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'CHAT_MESSAGE': return MessageCircle;
      case 'MEETUP_REMINDER': return Calendar;
      case 'SOCIAL_REACTION': return Heart;
      case 'SOCIAL_COMMENT': return MessageSquare;
      default: return Bell;
    }
  };

  const handlePress = () => {
    onPress(notification);
    if (notification.data?.url) {
        // Safe navigation
        try {
            router.push(notification.data.url as any);
        } catch (e) {
            console.error('Navigation error', e);
        }
    }
  };
  
  // Helper to handle date. 
  // Firestore timestamps need .toDate() but over the wire it might be serialized.
  const getDate = () => {
      if (!notification.createdAt) return '';
      // @ts-ignore
      if (notification.createdAt.toDate) return formatDate(notification.createdAt.toDate());
      // @ts-ignore
      if (notification.createdAt.seconds) return formatDate(new Date(notification.createdAt.seconds * 1000));
      return '';
  }

  return (
    <Pressable onPress={handlePress}>
      <Box className={`p-4 border-b border-gray-100 ${notification.isRead ? 'bg-white' : 'bg-blue-50/50'}`}>
        <HStack space="md" className="items-center">
            <Box className="bg-primary-100 p-2 rounded-full">
                <Icon as={getIcon()} size="md" className="text-primary-600" />
            </Box>
            <Box className="flex-1">
                <HStack className="justify-between items-center">
                    <Text className="font-bold text-gray-900 text-sm flex-1 mr-2" numberOfLines={1}>{notification.title}</Text>
                    <Text className="text-xs text-gray-400">{getDate()}</Text>
                </HStack>
                <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>{notification.body}</Text>
            </Box>
            {!notification.isRead && (
                <Box className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            )}
        </HStack>
      </Box>
    </Pressable>
  );
};
