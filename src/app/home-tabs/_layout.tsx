import { useChatListView } from "@/src/features/chat";
import { useNotifications } from "@/src/features/notification";
import { Tabs } from "expo-router";
import { Bell, Heart, Map, MessageCircle, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { View } from "react-native";

export default function TabsLayout() {
  const { items: chatItems } = useChatListView("all");
  const { notifications } = useNotifications();

  const hasUnreadChats = useMemo(
    () => chatItems.some((chat) => (chat.unreadCount ?? 0) > 0),
    [chatItems],
  );

  const hasUnreadNotifications = useMemo(
    () => notifications.some((notification) => !notification.isRead),
    [notifications],
  );

  const renderIconWithBadge = (
    IconComponent: ComponentType<{ size: number; color: string }>,
    color: string,
    size: number,
    showBadge?: boolean,
  ) => (
    <View style={{ width: size + 8, height: size + 8 }}>
      <IconComponent size={size} color={color} />
      {showBadge ? (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: 9999,
            backgroundColor: "#ef4444", // red-500
            borderWidth: 1,
            borderColor: "#ffffff",
          }}
        />
      ) : null}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0891b2", // Cyan-600
        tabBarInactiveTintColor: "#94a3b8", // Slate-400
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0", // Slate-200
        },
        // Usar replace para no acumular historial entre tabs
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="search-map"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved-spots"
        options={{
          title: "Saved Spots",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) =>
            renderIconWithBadge(Bell, color, size, hasUnreadNotifications),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) =>
            renderIconWithBadge(MessageCircle, color, size, hasUnreadChats),
        }}
      />
      <Tabs.Screen
        name="my-profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
