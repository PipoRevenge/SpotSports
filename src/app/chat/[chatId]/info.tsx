import React, { useEffect, useMemo, useState } from "react";

import { chatRepository, userRepository } from "@/src/api/repositories";
import { Avatar, AvatarImage } from "@/src/components/ui/avatar";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Pressable } from "@/src/components/ui/pressable";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import { useUser } from "@/src/context/user-context";
import { User } from "@/src/entities/user/model/user";
import { ChatParticipantRow } from "@/src/features/chat/components/chat-participant-row";
import { UserSearchModal } from "@/src/features/chat/components/user-search-modal";
import { useChatDetails } from "@/src/features/chat/hooks/use-chat-details";
import { useChatUserSearch } from "@/src/features/chat/hooks/use-chat-user-search";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users as UsersIcon } from "lucide-react-native";

export default function ChatInfo() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { chat, isLoading, error } = useChatDetails(chatId);
  const { results, search, isLoading: isSearchLoading } = useChatUserSearch();

  const [participants, setParticipants] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");

  const roleMap = useMemo(() => {
    const map = new Map<string, string>();
    chat?.members?.forEach((m) => map.set(m.userId, m.role));
    return map;
  }, [chat?.members]);

  const isAdmin = useMemo(() => {
    if (!user || !chat?.members) return false;
    const me = chat.members.find((m) => m.userId === user.id);
    return me?.role === "admin" || me?.role === "owner";
  }, [chat?.members, user]);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!chat?.memberIds) return;
      try {
        const fetched = await Promise.all(
          chat.memberIds.map((id) => userRepository.getUserById(id))
        );
        setParticipants(fetched);
      } catch {
        setParticipants([]);
      }
    };
    loadParticipants();
  }, [chat?.memberIds]);

  useEffect(() => {
    if (chat && chat.type !== "group") {
      router.replace(`/chat/${chatId}`);
    }
  }, [chat, chatId, router]);

  const handleLeaveGroup = async () => {
    if (!chatId || !user) return;
    await chatRepository.leaveGroup(chatId, user.id);
    router.back();
  };

  const handlePromote = async (targetUserId: string) => {
    if (!chatId || !user) return;
    await chatRepository.promoteToAdmin({
      chatId,
      adminId: user.id,
      targetUserId,
    });
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!chatId || !user) return;
    try {
      await chatRepository.removeGroupMember(chatId, user.id, targetUserId);
      setParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
    } catch (e) {
      console.error("Failed to remove member", e);
      // Optionally show an alert
    }
  };

  const handleAddMember = async (userIdToAdd: string) => {
    if (!chatId || !user) return;
    await chatRepository.addGroupMembers({
      chatId,
      adminId: user.id,
      newMemberIds: [userIdToAdd],
    });
    try {
      const newUser = await userRepository.getUserById(userIdToAdd);
      setParticipants((prev) =>
        prev.find((u) => u.id === newUser.id) ? prev : [...prev, newUser]
      );
    } catch {
      // ignore fetch error, next reload will sync
    }
    setAddSearchTerm("");
    setIsAddModalOpen(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">Loading information...</Text>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">{error || "Chat not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-slate-200 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="px-2 py-1">
          <Text className="text-cyan-600 font-semibold">Back</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-slate-900">
          Group information
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <View className="px-4 py-4 border-b border-slate-200 flex-row items-center">
        <Avatar
          size="lg"
          className={`${chat.photoURL ? "bg-transparent" : "bg-cyan-600"}`}
        >
          {chat.photoURL ? (
            <AvatarImage source={{ uri: chat.photoURL }} />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <UsersIcon size={20} color="#ffffff" />
            </View>
          )}
        </Avatar>
        <View className="flex-1 pl-3">
          <Text className="text-xl font-semibold text-slate-900">
            {chat.name}
          </Text>
          {chat.description ? (
            <Text className="text-sm text-slate-600" numberOfLines={2}>
              {chat.description}
            </Text>
          ) : null}
          <Text className="text-xs text-slate-500 pt-1">
            {chat.memberIds.length} members
          </Text>
        </View>
      </View>

      <View className="px-4 py-3 border-b border-slate-100">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-sm font-semibold text-slate-900">
            Participants
          </Text>
          {isAdmin ? (
            <Button
              action="primary"
              size="sm"
              onPress={() => setIsAddModalOpen(true)}
            >
              <ButtonText>Add</ButtonText>
            </Button>
          ) : null}
        </View>
        {participants.map((u) => (
          <ChatParticipantRow
            key={u.id}
            user={u}
            role={roleMap.get(u.id)}
            isAdmin={isAdmin}
            currentUserId={user?.id || null}
            onPromote={(id) => handlePromote(id)}
            onRemove={(id) => handleRemoveMember(id)}
            onPress={(id) => router.push(`/profile/${id}`)}
          />
        ))}
        <View className="pt-2">
          <Button
            action="negative"
            variant="outline"
            size="md"
            onPress={handleLeaveGroup}
          >
            <ButtonText>Leave group</ButtonText>
          </Button>
        </View>
      </View>

      <UserSearchModal
        visible={isAddModalOpen}
        term={addSearchTerm}
        onChangeTerm={(value) => {
          setAddSearchTerm(value);
          search(value);
        }}
        results={results}
        isLoading={isSearchLoading}
        onClose={() => setIsAddModalOpen(false)}
        onSelectUser={handleAddMember}
      />
    </SafeAreaView>
  );
}
