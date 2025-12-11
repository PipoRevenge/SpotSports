import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import type { User } from '@/src/entities/user/model/user';
import React from 'react';

interface ChatParticipantRowProps {
  user: User;
  role?: string;
  isAdmin?: boolean;
  currentUserId?: string | null;
  onPromote?: (id: string) => void;
  onPress?: (id: string) => void;
}

export const ChatParticipantRow: React.FC<ChatParticipantRowProps> = ({ user, role, isAdmin, currentUserId, onPromote, onPress }) => {
  const handleRowPress = () => {
    if (!onPress) return;
    onPress(user.id);
  };

  const handlePromote = (e: any) => {
    e.stopPropagation?.();
    onPromote?.(user.id);
  };

  return (
    <Pressable onPress={handleRowPress} className="flex-row items-center py-2">
      <Avatar size="sm" className="bg-slate-200">
        {user.userDetails.photoURL ? <AvatarImage source={{ uri: user.userDetails.photoURL }} /> : <AvatarFallbackText>{user.userDetails.userName.slice(0, 2).toUpperCase()}</AvatarFallbackText>}
      </Avatar>
      <View className="flex-1 pl-3">
        <Text className="text-sm font-semibold text-slate-900">{user.userDetails.userName}</Text>
        <Text className="text-xs text-slate-500">{role || 'member'}</Text>
      </View>
      {isAdmin && role !== 'admin' && role !== 'owner' && user.id !== currentUserId ? (
        <Pressable onPress={handlePromote} className="px-3 py-2">
          <Text className="text-cyan-600 text-sm font-semibold">Hacer admin</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default ChatParticipantRow;
