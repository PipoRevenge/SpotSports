import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { Image as ImageIcon, Users as UsersIcon, Video as VideoIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import type { GestureResponderEvent } from 'react-native';
import type { ChatListItemProps } from '../types';

const MAX_PREVIEW_LENGTH = 60;

const formatPreview = (text?: string) => {
  if (!text) return '';
  return text.length > MAX_PREVIEW_LENGTH ? `${text.slice(0, MAX_PREVIEW_LENGTH - 3)}...` : text;
};

export const ChatListItem: React.FC<ChatListItemProps> = ({
  id,
  title,
  subtitle,
  avatarUrl,
  type = 'direct',
  unreadCount = 0,
  participantId,
  lastMessageType,
  lastMessageSenderName,
  onPress,
  onAvatarPress,
  actionSlot,
}) => {
  const handlePress = useCallback(() => {
    onPress?.(id);
  }, [id, onPress]);

  const handleAvatar = useCallback(
    (e?: GestureResponderEvent) => {
      e?.stopPropagation?.();
      onAvatarPress?.(id, type, participantId);
    },
    [id, onAvatarPress, participantId, type]
  );

  const initials = useMemo(() => {
    if (!title) return '';
    const value = typeof title === 'string' || typeof title === 'number' ? String(title) : '';
    return value.slice(0, 2).toUpperCase();
  }, [title]);

  const titleNode = useMemo(() => {
    if (React.isValidElement(title)) return title;
    const label = typeof title === 'string' || typeof title === 'number' ? String(title) : '';
    return <Text className="text-base font-semibold text-slate-900">{label}</Text>;
  }, [title]);

  const subtitleNode = useMemo(() => {
    if (!subtitle && !lastMessageType) return null;

    const baseSubtitle = React.isValidElement(subtitle)
      ? subtitle
      : (() => {
          const rawText = typeof subtitle === 'number' ? String(subtitle) : typeof subtitle === 'string' ? subtitle : '';
          return <Text className="text-xs text-slate-500">{formatPreview(rawText)}</Text>;
        })();

    const renderMediaLabel = (label: string, icon: React.ReactElement) => (
      <View className="flex-row items-center space-x-1">
        {icon}
        <Text className="text-xs text-slate-600">{label}</Text>
      </View>
    );

    return (
      <View className="flex-row items-center pt-1">
        {lastMessageSenderName ? (
          <Text className="text-xs text-slate-700 mr-1">{lastMessageSenderName} ·</Text>
        ) : null}
        {lastMessageType === 'image'
          ? renderMediaLabel('Foto', <ImageIcon size={14} color="#475569" />)
          : lastMessageType === 'video'
            ? renderMediaLabel('Video', <VideoIcon size={14} color="#475569" />)
            : baseSubtitle}
      </View>
    );
  }, [lastMessageSenderName, lastMessageType, subtitle]);

  const actionNode = useMemo(() => {
    if (!actionSlot) return null;
    if (typeof actionSlot === 'string' || typeof actionSlot === 'number') {
      return <Text>{String(actionSlot)}</Text>;
    }
    return actionSlot;
  }, [actionSlot]);

  return (
    <Pressable onPress={handlePress} className="px-4 py-3 border-b border-slate-200">
      <View className="flex-row items-center">
        <Pressable onPress={handleAvatar} className="mr-3">
          <Avatar size="sm" className={`${type === 'group' ? 'bg-cyan-600' : 'bg-slate-200'}`}>
            {avatarUrl ? (
              <AvatarImage source={{ uri: avatarUrl }} />
            ) : type === 'group' ? (
              <View className="w-full h-full items-center justify-center">
                <UsersIcon size={16} color="#ffffff" />
              </View>
            ) : (
              <AvatarFallbackText>{initials}</AvatarFallbackText>
            )}
          </Avatar>
        </Pressable>
        <View className="flex-1 pl-3">
          {titleNode}
          {subtitleNode}
        </View>
        {actionNode ? (
          <View>{actionNode}</View>
        ) : unreadCount > 0 ? (
          <Badge variant="solid" size="sm" className="px-2 py-1 bg-[#FF2D2D] shadow-lg">
            <Text className="text-white text-xs font-bold">{unreadCount}</Text>
          </Badge>
        ) : null}
      </View>
    </Pressable>
  );
};

export default ChatListItem;
