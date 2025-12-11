import { FlatList } from '@/src/components/ui/flat-list';
import { Input, InputField } from '@/src/components/ui/input';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import React from 'react';
import { Modal } from 'react-native';
import { UserSearchResult } from '../hooks/use-chat-user-search';
import type { ChatListItemView } from '../types';
import { ChatListItem } from './chat-list-item';

interface UserSearchModalProps {
  visible: boolean;
  term: string;
  onChangeTerm: (value: string) => void;
  results: UserSearchResult[];
  directChats?: ChatListItemView[];
  onSelectChat?: (chatId: string) => void;
  onAvatarPress?: (id: string, type?: any, participantId?: string) => void;
  isLoading?: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ visible, term, onChangeTerm, results, isLoading, onClose, onSelectUser, directChats, onSelectChat, onAvatarPress }) => {
  const filteredResults = React.useMemo(() => {
    if (!directChats || directChats.length === 0) return results;
    const participantIds = new Set(directChats.map(dc => dc.participantId));
    return results.filter(r => !participantIds.has(r.id));
  }, [results, directChats]);
  const displayedDirectChats = React.useMemo(() => {
    if (!directChats) return [] as ChatListItemView[];
    if (!term || term.trim().length === 0) return directChats;
    const normalized = term.toLowerCase().trim();
    return directChats.filter(dc => {
      const title = dc.title?.toLowerCase() || '';
      const subtitle = (dc.subtitle || '').toLowerCase();
      return title.includes(normalized) || subtitle.includes(normalized);
    });
  }, [directChats, term]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-slate-200 flex-row items-center">
          <View className="flex-1 pr-3">
            <Input variant="rounded" size="lg" className="bg-slate-100">
              <InputField
                className="text-slate-900"
                placeholder="Busca por usuario o nombre"
                value={term}
                onChangeText={onChangeTerm}
                autoFocus
              />
            </Input>
          </View>
          <Pressable onPress={onClose} className="px-3 py-2">
            <Text className="text-cyan-600 font-semibold">Cerrar</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-slate-500">Buscando...</Text>
          </View>
        ) : (
          <FlatList
            data={[...displayedDirectChats, ...filteredResults.map(r => ({ ...r, isSearchUser: true })) as any]}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const isSearchUser = !!item.isSearchUser;
              const title = isSearchUser ? item.userDetails.userName : item.title;
              const subtitle = isSearchUser ? item.userDetails.fullName : item.subtitle;
              const avatarUrl = isSearchUser ? item.userDetails.photoURL : item.avatarUrl;
              const onPress = isSearchUser ? () => onSelectUser(item.id) : () => onSelectChat?.(item.id);
              const participantId = isSearchUser ? item.id : item.participantId;
              const unread = !isSearchUser ? item.unreadCount : 0;
              return (
                <ChatListItem
                  id={item.id}
                  title={title}
                  subtitle={subtitle}
                  avatarUrl={avatarUrl}
                  type={'direct'}
                  unreadCount={unread}
                  participantId={participantId}
                  onPress={onPress}
                  onAvatarPress={(id, type, p) => onAvatarPress ? onAvatarPress(id, type, p) : undefined}
                />
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
};
