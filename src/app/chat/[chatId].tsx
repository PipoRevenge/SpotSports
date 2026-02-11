import React, { useMemo, useState } from "react";

import { ChatHeader } from "@/src/features/chat/components/chat-header";
// Pressable import not required in this view (header is now separate component)
import { uploadFileFromUri } from "@/src/api/lib/storage-service";
import { useImagePicker } from "@/src/components/commons/media-picker";
import { Menu, MenuItem, MenuItemLabel } from "@/src/components/ui/menu";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import { useAppAlert } from "@/src/context/app-alert-context";
import { useUser } from "@/src/context/user-context";
import { MessageComposer } from "@/src/features/chat/components/message-composer";
import { MessageList } from "@/src/features/chat/components/message-list";
import { useChatDetails } from "@/src/features/chat/hooks/use-chat-details";
import { useChatParticipants } from "@/src/features/chat/hooks/use-chat-participants";
import { useClearChatLocal } from "@/src/features/chat/hooks/use-clear-chat-local";
import { useMessages } from "@/src/features/chat/hooks/use-messages";
import { useSendMessage } from "@/src/features/chat/hooks/use-send-message";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
} from "react-native";

export default function ChatConversation() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { showError, showConfirm } = useAppAlert();
  const { chat, isLoading: isChatLoading, error } = useChatDetails(chatId);
  const { messages, isLoading: isMessagesLoading } = useMessages(chatId);
  const { send, isSending } = useSendMessage(chatId);
  const { pickMultiple } = useImagePicker();

  const { participants } = useChatParticipants(chat?.memberIds, {
    type: "chat",
    id: chatId,
  });
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const { clearLocal, isClearing } = useClearChatLocal(chatId, user?.id);

  const otherUser = useMemo(() => {
    if (chat?.type !== "direct" || !user) return null;
    return participants.find((u) => u.id !== user.id) || null;
  }, [chat?.type, participants, user]);

  const headerTitle = useMemo(() => {
    if (chat?.type === "direct") {
      return otherUser?.userDetails.userName || "Chat";
    }
    return chat?.name || "Chat";
  }, [chat?.name, chat?.type, otherUser?.userDetails.userName]);

  // subtitle intentionally unused (header hides subtitle)

  const headerAvatar = useMemo(() => {
    if (chat?.type === "direct") return otherUser?.userDetails.photoURL;
    return chat?.photoURL;
  }, [chat?.photoURL, chat?.type, otherUser?.userDetails.photoURL]);

  const handleSend = async (text: string) => {
    if (!user) return;
    await send({ text, senderId: user.id });
  };

  const handleAttachMedia = async () => {
    if (!user || !chatId) return;
    const selection = await pickMultiple({ quality: 0.8 });
    if (!selection.length) return;
    setIsSendingMedia(true);
    try {
      for (const asset of selection) {
        if (!asset.uri) continue;
        const mediaType = asset.type === "video" ? "video" : "image";
        const ext =
          asset.uri.split(".").pop()?.split("?")[0] ||
          (mediaType === "video" ? "mp4" : "jpg");
        const path = `chats/${chatId}/${Date.now()}-${user.id}.${ext}`;
        const mediaUrl = await uploadFileFromUri(path, asset.uri);
        await send({ text: "", senderId: user.id, mediaUrl, mediaType });
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not attach file");
    } finally {
      setIsSendingMedia(false);
    }
  };

  const confirmClearChat = async () => {
    const ok = await showConfirm(
      "Delete for me",
      "Delete this chat only on your device. It does not affect the other person and you will only see new messages from now on.",
      "Delete",
      "Cancel",
    );
    if (!ok || !chatId || !user) return;
    try {
      await clearLocal();
      router.back();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Could not delete locally",
      );
    }
  };

  const viewLabel = chat?.type === "group" ? "View group info" : "View profile";
  const deleteLabel = "Delete for me";

  // Special label for meetup chats
  const actualViewLabel =
    (chat?.type === "group" ||
      chat?.type === "meetup-group" ||
      chat?.type === "meetup") &&
    chat?.meetupId
      ? "View meetup details"
      : viewLabel;

  const goToGroupInfoOrProfile = () => {
    if (!chat || !chatId) return;

    // If it's a meetup-group chat, navigate to the meetup details
    if (
      (chat.type === "group" ||
        chat.type === "meetup-group" ||
        chat.type === "meetup") &&
      chat.meetupId &&
      chat.meetupSpotId
    ) {
      router.push(`/spot/${chat.meetupSpotId}/meetup/${chat.meetupId}`);
      return;
    }

    // Regular group chat -> open group info
    if (chat.type === "group") {
      router.push(`/chat/${chatId}/info`);
      return;
    }

    // direct chat -> open user profile
    if (chat.type === "direct" && otherUser) {
      router.push(`/profile/${otherUser.id}`);
    }
  };

  const handleAvatarPress = () => {
    // Avatar press should behave same as header press
    goToGroupInfoOrProfile();
  };

  if (isChatLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">Loading chat...</Text>
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
      <Menu
        placement="bottom right"
        trigger={({ ...triggerProps }) => (
          <ChatHeader
            title={headerTitle}
            avatarUrl={headerAvatar}
            type={chat.type}
            onHeaderPress={goToGroupInfoOrProfile}
            onAvatarPress={handleAvatarPress}
            onMenuPress={triggerProps?.onPress}
            menuTriggerProps={triggerProps}
          />
        )}
      >
        <MenuItem
          key="view"
          textValue={actualViewLabel}
          onPress={goToGroupInfoOrProfile}
        >
          <MenuItemLabel size="sm">{actualViewLabel}</MenuItemLabel>
        </MenuItem>
        <MenuItem
          key="delete"
          textValue={deleteLabel}
          onPress={confirmClearChat}
          disabled={isClearing}
        >
          <MenuItemLabel size="sm" className="text-red-600">
            {isClearing ? "Deleting..." : deleteLabel}
          </MenuItemLabel>
        </MenuItem>
      </Menu>
      {isMessagesLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">Loading messages...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <MessageList
                  messages={messages}
                  currentUserId={user?.id}
                  chatType={chat.type}
                  participants={participants}
                />
              </View>
              <MessageComposer
                onSend={handleSend}
                isSending={isSending || isSendingMedia}
                onAttachPress={handleAttachMedia}
              />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
