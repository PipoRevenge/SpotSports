import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { User } from "@/src/entities/user/model/user";
import {
  CheckCircle,
  MapPin,
  MessageSquare,
  MessagesSquare,
} from "lucide-react-native";
import React, { useState } from "react";
import { View } from "react-native";

interface ActivityTabsProps {
  user?: User | null;
  userId: string | undefined;
  reviewsSlot?: React.ReactNode; // slot injected by app layer to render reviews list
  discussionsSlot?: React.ReactNode; // slot for user's discussions
  commentsSlot?: React.ReactNode; // slot for user's comments
  meetupsSlot?: React.ReactNode; // slot for user's meetups (local stored)
}

export const ProfileActivityTabs: React.FC<ActivityTabsProps> = ({
  user,
  userId,
  reviewsSlot,
  discussionsSlot,
  commentsSlot,
  meetupsSlot,
}) => {
  const [selectedTab, setSelectedTab] = useState<
    "reviews" | "discussions" | "comments" | "meetups"
  >("reviews");

  const TABS = [
    {
      key: "reviews",
      label: "Reviews",
      icon: MessageSquare,
      color: "#9B59B6",
      count: user?.activity?.reviewsCount || 0,
    },
    {
      key: "discussions",
      label: "Discussions",
      icon: MessagesSquare,
      color: "#3b82f6",
      count: user?.activity?.discussionsCount || 0,
    },
    {
      key: "comments",
      label: "Comments",
      icon: CheckCircle,
      color: "#4ECDC4",
      count: user?.activity?.commentsCount || 0,
    },
    {
      key: "meetups",
      label: "Meetups",
      icon: MapPin,
      color: "#f97316",
      count: undefined,
    },
  ];

  // For now we only render Reviews tab. Add more tabs later (Favorites, Following, etc.)
  return (
    <VStack className="w-full">
      {/* Tabs header */}
      {/* Tabs header */}
      <View className="flex-row flex-wrap gap-2 w-full">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setSelectedTab(tab.key as any)}
            className={`flex-row justify-center items-center gap-2 px-4 py-2 rounded-full border ${
              selectedTab === tab.key
                ? "bg-white border-gray-300 shadow-sm"
                : "bg-gray-100 border-transparent"
            } grow`}
          >
            <Icon as={tab.icon} size={16} color={tab.color} />
            <Text
              className={`text-sm ${
                selectedTab === tab.key
                  ? "text-gray-900 font-semibold"
                  : "text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Text className="text-xs text-gray-500 pl-2">{tab.count}</Text>
              )}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      <VStack className="pt-4">
        {selectedTab === "reviews" && reviewsSlot}
        {selectedTab === "discussions" && discussionsSlot}
        {selectedTab === "comments" && commentsSlot}
        {selectedTab === "meetups" && meetupsSlot}

        {selectedTab === "reviews" && !reviewsSlot && (
          <VStack className="items-center justify-center p-8">
            <Text className="text-gray-600">
              Content not available for this tab yet
            </Text>
          </VStack>
        )}
        {selectedTab === "discussions" && !discussionsSlot && (
          <VStack className="items-center justify-center p-8">
            <Text className="text-gray-600">
              Content not available for this tab yet
            </Text>
          </VStack>
        )}
        {selectedTab === "comments" && !commentsSlot && (
          <VStack className="items-center justify-center p-8">
            <Text className="text-gray-600">
              Content not available for this tab yet
            </Text>
          </VStack>
        )}
        {selectedTab === "meetups" && !meetupsSlot && (
          <VStack className="items-center justify-center p-8">
            <Text className="text-gray-600">You have no saved meetups yet</Text>
          </VStack>
        )}
      </VStack>
    </VStack>
  );
};

export default ProfileActivityTabs;
