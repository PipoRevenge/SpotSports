import { Box } from "@/src/components/ui/box";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Icon } from "@/src/components/ui/icon";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import {
  NotificationItem,
  useNotifications,
} from "@/src/features/notification";
import { Stack } from "expo-router";
import { Check } from "lucide-react-native";
import React, { useMemo } from "react";
import { ActivityIndicator, FlatList } from "react-native";

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
    markAsRead,
    markAllAsRead,
    refetch,
    isRefetching,
  } = useNotifications();

  const filteredNotifications = useMemo(
    () => notifications.filter((n) => n.type !== "CHAT_MESSAGE"),
    [notifications]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: "Notifications",
          headerRight: () => (
            <Button
              variant="link"
              onPress={() => markAllAsRead()}
              size="sm"
              isDisabled={filteredNotifications.length === 0}
            >
              <Icon as={Check} className="text-primary-500 mr-1" />
              <ButtonText>Read all</ButtonText>
            </Button>
          ),
        }}
      />

      {isLoading ? (
        <Box className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#231F7C" />
        </Box>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={(n) => {
                if (!n.isRead) markAsRead(n.id);
              }}
            />
          )}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <Box className="mt-10 items-center px-4">
              <Text className="text-gray-400 text-center">
                You have no new notifications
              </Text>
            </Box>
          }
        />
      )}
    </SafeAreaView>
  );
}
