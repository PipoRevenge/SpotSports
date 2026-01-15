import { Box } from "@/src/components/ui/box";
import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { AppNotification } from "@/src/features/notification/types/notification";
import { formatDate } from "@/src/utils/date-utils";
import { useRouter } from "expo-router";
import {
  Bell,
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  MessageSquare,
  Star,
  UserPlus,
} from "lucide-react-native";
import React from "react";

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case "CHAT_MESSAGE":
        return MessageCircle;
      case "MEETUP_REMINDER":
        return Calendar;
      case "SOCIAL_REACTION":
        return Heart;
      case "SOCIAL_COMMENT":
        return MessageSquare;
      case "FOLLOW_CREATE":
        return UserPlus;
      case "REVIEW_CREATE":
        return Star;
      case "SPOT_CREATE":
        return MapPin;
      case "DISCUSSION_CREATE":
        return MessageCircle;
      default:
        return Bell;
    }
  };

  const handlePress = () => {
    onPress(notification);
    if (notification.data?.url) {
      // Safe navigation
      try {
        router.push(notification.data.url as any);
      } catch (e) {
        console.error("Navigation error", e);
      }
    }
  };

  // Helper to handle date.
  // Firestore timestamps need .toDate() but over the wire it might be serialized.
  const getDate = () => {
    if (!notification.createdAt) return "";
    // @ts-ignore
    if (notification.createdAt.toDate)
      return formatDate(notification.createdAt.toDate());
    // @ts-ignore
    if (notification.createdAt.seconds)
      return formatDate(new Date(notification.createdAt.seconds * 1000));
    return "";
  };

  return (
    <Pressable onPress={handlePress}>
      <Box
        className={`p-4 border-b border-gray-100 ${
          notification.isRead ? "bg-white" : "bg-blue-50/50"
        }`}
      >
        <HStack space="md" className="items-start">
          <Box className="bg-primary-100 p-2 rounded-full mt-1">
            <Icon as={getIcon()} size="md" className="text-primary-600" />
          </Box>
          <Box className="flex-1">
            <HStack className="justify-between items-start mb-1">
              <Text
                className="font-bold text-gray-900 text-sm flex-1 mr-2"
                numberOfLines={2}
              >
                {notification.title}
              </Text>
              <Text className="text-xs text-gray-400 whitespace-nowrap">
                {getDate()}
              </Text>
            </HStack>
            <Text
              className="text-sm text-gray-700 leading-snug"
              numberOfLines={3}
            >
              {notification.body}
            </Text>

            {/* Context Preview */}
            {notification.data?.targetPreview && (
              <Box className="mt-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                <Text
                  className="text-xs text-gray-500 italic"
                  numberOfLines={1}
                >
                  {notification.data.senderName
                    ? `${notification.data.senderName}: `
                    : ""}
                  {notification.data.targetPreview}
                </Text>
              </Box>
            )}
          </Box>
          {!notification.isRead && (
            <Box className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-2" />
          )}
        </HStack>
      </Box>
    </Pressable>
  );
};
