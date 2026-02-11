import { FlatList } from "@/src/components/ui/flat-list";
import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import { ChatType, Message } from "@/src/entities/chat";
import { User } from "@/src/entities/user/model/user";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Image, Keyboard, Platform } from "react-native";

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  chatType?: ChatType;
  participants?: User[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  chatType,
  participants,
}) => {
  const listRef = useRef<FlatList<Message>>(null);

  const isGroupChat =
    chatType === "group" ||
    chatType === "meetup-group" ||
    chatType === "meetup";

  // Build a map of senderId -> display name for quick lookup
  const senderNames = useMemo(() => {
    if (!isGroupChat || !participants?.length) return {};
    const map: Record<string, string> = {};
    for (const p of participants) {
      map[p.id] = p.userDetails?.userName || p.userDetails?.fullName || "User";
    }
    return map;
  }, [isGroupChat, participants]);

  const scrollToBottom = useCallback(
    (animated = true) => {
      if (!messages.length || !listRef.current) return;
      // Small delay lets the list finish layout before scrolling
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
    },
    [messages.length],
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = currentUserId === item.senderId;
      const bubbleText = item.text || "";
      const createdAt =
        item.createdAt instanceof Date
          ? item.createdAt
          : new Date(item.createdAt);
      const timeLabel = createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <View className={`px-4 py-2 ${isMine ? "items-end" : "items-start"}`}>
          {isGroupChat && !isMine && (
            <Text className="text-xs text-slate-500 ml-1 mb-1">
              {senderNames[item.senderId] || "User"}
            </Text>
          )}
          <View
            className={`max-w-[80%] px-3 py-2 rounded-lg ${isMine ? "bg-cyan-500" : "bg-slate-200"}`}
          >
            {item.mediaUrl ? (
              item.mediaType === "video" ? (
                <View className="mb-2">
                  <Text
                    className={`${isMine ? "text-white" : "text-slate-900"}`}
                  >
                    Video adjunto
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: 8,
                    marginBottom: bubbleText ? 8 : 0,
                  }}
                  resizeMode="cover"
                />
              )
            ) : null}

            {bubbleText ? (
              <Text className={`${isMine ? "text-white" : "text-slate-900"}`}>
                {bubbleText}
              </Text>
            ) : null}
            <Text
              className={`text-[11px] pt-1 ${isMine ? "text-white/80" : "text-slate-500"}`}
            >
              {timeLabel}
            </Text>
          </View>
        </View>
      );
    },
    [currentUserId, isGroupChat, senderNames],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const EmptyComponent = useMemo(() => {
    const Component = () => (
      <View className="py-6 items-center">
        <Text className="text-slate-500">No messages yet.</Text>
      </View>
    );
    Component.displayName = "MessageListEmptyComponent";
    return Component;
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const keyboardEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(keyboardEvent, () => scrollToBottom());
    return () => sub.remove();
  }, [scrollToBottom]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={EmptyComponent}
      onContentSizeChange={() => scrollToBottom(true)}
    />
  );
};
