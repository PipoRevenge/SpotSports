import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import type { ChatType } from '@/src/entities/chat';
import { MoreVertical, Users as UsersIcon } from 'lucide-react-native';
import React from 'react';
import type { GestureResponderEvent } from 'react-native';

interface ChatHeaderProps {
  title: string;
  avatarUrl?: string;
  type: ChatType;
  participantId?: string; // used to navigate to profile for direct chats
  onHeaderPress?: () => void;
  onAvatarPress?: (e?: GestureResponderEvent) => void;
  showSubtitle?: boolean; // Not used currently, but kept for future
  onMenuPress?: () => void;
  menuTriggerProps?: React.ComponentProps<typeof Pressable>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, avatarUrl, type, onHeaderPress, onAvatarPress, showSubtitle = false, onMenuPress, menuTriggerProps }) => {
  const avatarLabel = type === 'group' ? 'Información del grupo' : 'Ver perfil';
  const handleMenuPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    menuTriggerProps?.onPress?.(e);
    onMenuPress?.();
  };
  return (
    <Pressable className="px-4 py-3 border-b border-slate-200 flex-row items-center" onPress={onHeaderPress} accessibilityRole="button" accessibilityLabel={type === 'group' ? 'Ver información del grupo' : 'Ver perfil'}>
      <View className="flex-row items-center flex-1">
        <Pressable onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onAvatarPress?.(e); }} className="mr-3" accessibilityRole="button" accessibilityLabel={avatarLabel}>
          <Avatar size="md" className={`${type === 'group' ? 'bg-cyan-600' : 'bg-slate-200'}`}>
            {avatarUrl ? (
              <AvatarImage source={{ uri: avatarUrl }} />
            ) : type === 'group' ? (
              <View className="w-full h-full items-center justify-center">
                <UsersIcon size={16} color="#ffffff" />
              </View>
            ) : (
              <AvatarFallbackText>{title?.slice(0, 2)?.toUpperCase()}</AvatarFallbackText>
            )}
          </Avatar>
        </Pressable>
        <View className="flex-1 pl-3">
          <Text className="text-lg font-semibold text-slate-900">{title}</Text>
          {/* Subtitle intentionally hidden per requirements */}
        </View>
      </View>
      {onMenuPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú de chat"
          className="pl-3"
          {...menuTriggerProps}
          onPress={handleMenuPress}
        >
          <MoreVertical size={22} color="#0f172a" />
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default ChatHeader;
