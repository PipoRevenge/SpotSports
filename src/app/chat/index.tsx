import { Button, ButtonText } from "@/src/components/ui/button";
import { FlatList } from "@/src/components/ui/flat-list";
import { Input, InputField } from "@/src/components/ui/input";
import { Pressable } from "@/src/components/ui/pressable";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import type { ChatFilter, ChatListItemView } from "@/src/features/chat";
import { ChatFilters, ChatList, ChatListItem } from "@/src/features/chat";
import { UserSearchModal } from "@/src/features/chat/components/user-search-modal";
import { useChatListView } from "@/src/features/chat/hooks/use-chat-list-view";
import { useChatUserSearch } from "@/src/features/chat/hooks/use-chat-user-search";
import { useCreateChat } from "@/src/features/chat/hooks/use-create-chat";
import { useNotifications } from "@/src/features/notification";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "react-native";

export default function ChatHome() {
  const router = useRouter();
  const [filter, setFilter] = useState<ChatFilter>("all");
  const { items, isLoading } = useChatListView(filter);
  const {
    createDirectChat,
    createGroupChat,
    isLoading: isCreating,
  } = useCreateChat();
  const { results, isLoading: isSearching, search } = useChatUserSearch();
  const {
    results: groupResults,
    isLoading: isSearchingGroup,
    search: searchGroup,
  } = useChatUserSearch();
  const { notifications, markAsRead } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [term, setTerm] = useState("");

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupTerm, setGroupTerm] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    search(term);
  }, [search, term]);

  useEffect(() => {
    searchGroup(groupTerm);
  }, [groupTerm, searchGroup]);

  useFocusEffect(
    useCallback(() => {
      const unreadChatNotifications = notifications.filter(
        (n) => n.type === "CHAT_MESSAGE" && !n.isRead
      );
      unreadChatNotifications.forEach((n) => markAsRead(n.id));
    }, [notifications, markAsRead])
  );

  const handleOpenChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleAvatarPress = (
    chatId: string,
    type: any,
    participantId?: string
  ) => {
    if (type === "group") {
      router.push(`/chat/${chatId}/info`);
      return;
    }
    if (type === "direct" && participantId) {
      router.push(`/profile/${participantId}`);
    }
  };

  const handleSelectUser = async (userId: string) => {
    // If we already have a direct chat with this user, open it
    const existing = items.find(
      (i) => i.type === "direct" && i.participantId === userId
    );
    if (existing) {
      setIsModalOpen(false);
      setTerm("");
      handleOpenChat(existing.id);
      return;
    }
    // Otherwise create a new direct chat (repo already returns existing if it finds one)
    const chat = await createDirectChat(userId);
    setIsModalOpen(false);
    setTerm("");
    handleOpenChat(chat.id);
  };

  const handleSelectExistingChat = (chatId: string) => {
    setIsModalOpen(false);
    setTerm("");
    handleOpenChat(chatId);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    const memberIds = Array.from(selectedMemberIds);
    const chat = await createGroupChat({
      name: groupName.trim(),
      memberIds,
      description: groupDescription.trim() || undefined,
    });
    setIsGroupModalOpen(false);
    setGroupName("");
    setGroupDescription("");
    setGroupTerm("");
    setSelectedMemberIds(new Set());
    handleOpenChat(chat.id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-slate-900">Chats</Text>
            <View className="flex-row space-x-2">
              <Button
                action="primary"
                variant="outline"
                size="md"
                onPress={() => setIsGroupModalOpen(true)}
              >
                <ButtonText>New group</ButtonText>
              </Button>
              <Button
                action="primary"
                variant="solid"
                size="md"
                onPress={() => setIsModalOpen(true)}
              >
                <ButtonText>New chat</ButtonText>
              </Button>
            </View>
          </View>
          <View className="mt-3">
            <ChatFilters value={filter} onChange={setFilter} />
          </View>
        </View>
        {isLoading ? (
          <View className="py-10 items-center">
            <Text className="text-slate-500">Loading chats...</Text>
          </View>
        ) : (
          <ChatList
            items={items}
            onSelect={handleOpenChat}
            onAvatarPress={handleAvatarPress}
            renderEmpty={
              <Text className="p-4 text-slate-500">
                No chats yet. Create a new one.
              </Text>
            }
          />
        )}
      </View>
      <UserSearchModal
        visible={isModalOpen}
        term={term}
        onChangeTerm={setTerm}
        results={results}
        isLoading={isSearching || isCreating}
        onClose={() => setIsModalOpen(false)}
        onSelectUser={handleSelectUser}
        directChats={
          items.filter((i) => i.type === "direct") as ChatListItemView[]
        }
        onSelectChat={handleSelectExistingChat}
        onAvatarPress={handleAvatarPress}
      />

      <Modal
        visible={isGroupModalOpen}
        animationType="slide"
        onRequestClose={() => setIsGroupModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-4 py-3 border-b border-slate-200 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900">
              New group
            </Text>
            <Pressable
              onPress={() => setIsGroupModalOpen(false)}
              className="px-3 py-1"
            >
              <Text className="text-cyan-600 font-semibold">Close</Text>
            </Pressable>
          </View>
          <View className="px-4 pt-4 space-y-3">
            <View>
              <Text className="text-sm text-slate-700 mb-1">Group name</Text>
              <Input>
                <InputField
                  placeholder="e.g. Tuesday team"
                  value={groupName}
                  onChangeText={setGroupName}
                  className="text-slate-900"
                />
              </Input>
            </View>
            <View>
              <Text className="text-sm text-slate-700 mb-1">
                Description (optional)
              </Text>
              <Input>
                <InputField
                  placeholder="Plan, schedule or rules"
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  className="text-slate-900"
                />
              </Input>
            </View>
            <View>
              <Text className="text-sm text-slate-700 mb-1">Add people</Text>
              <Input variant="rounded" size="lg" className="bg-slate-100">
                <InputField
                  className="text-slate-900"
                  placeholder="Search by username or name"
                  value={groupTerm}
                  onChangeText={setGroupTerm}
                />
              </Input>
            </View>
          </View>
          {isSearchingGroup ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-500">Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={groupResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const selected = selectedMemberIds.has(item.id);
                return (
                  <ChatListItem
                    id={item.id}
                    title={item.userDetails.userName}
                    subtitle={item.userDetails.fullName}
                    avatarUrl={item.userDetails.photoURL}
                    type={"direct"}
                    onPress={() => toggleMember(item.id)}
                    actionSlot={
                      <Text
                        className={`text-sm font-semibold ${
                          selected ? "text-cyan-600" : "text-slate-500"
                        }`}
                      >
                        {selected ? "Selected" : "Add"}
                      </Text>
                    }
                  />
                );
              }}
            />
          )}
          <View className="px-4 py-3 border-t border-slate-200">
            <Button
              action="primary"
              variant="solid"
              size="lg"
              isDisabled={!groupName.trim() || isCreating}
              onPress={handleCreateGroup}
            >
              <ButtonText>Create group</ButtonText>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
