import { Button, ButtonText } from '@/src/components/ui/button';
import { FlatList } from '@/src/components/ui/flat-list';
import { Input, InputField } from '@/src/components/ui/input';
import { Pressable } from '@/src/components/ui/pressable';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Select, SelectBackdrop, SelectContent, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/src/components/ui/select';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import type { ChatListItemView } from '@/src/features/chat';
import { ChatList, ChatListItem } from '@/src/features/chat';
import { UserSearchModal } from '@/src/features/chat/components/user-search-modal';
import { useChatListView } from '@/src/features/chat/hooks/use-chat-list-view';
import { useChatUserSearch } from '@/src/features/chat/hooks/use-chat-user-search';
import { useCreateChat } from '@/src/features/chat/hooks/use-create-chat';
import { useRouter } from 'expo-router';
import { ChevronDownIcon } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-native';

export default function ChatHome() {
  const router = useRouter();
  const { items, isLoading } = useChatListView();
  const { createDirectChat, createGroupChat, isLoading: isCreating } = useCreateChat();
  const { results, isLoading: isSearching, search } = useChatUserSearch();
  const { results: groupResults, isLoading: isSearchingGroup, search: searchGroup } = useChatUserSearch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'group' | 'direct'>('all');

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupTerm, setGroupTerm] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    search(term);
  }, [search, term]);

  useEffect(() => {
    searchGroup(groupTerm);
  }, [groupTerm, searchGroup]);

  const handleOpenChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleAvatarPress = (chatId: string, type: any, participantId?: string) => {
    if (type === 'group') {
      router.push(`/chat/${chatId}/info`);
      return;
    }
    if (type === 'direct' && participantId) {
      router.push(`/profile/${participantId}`);
    }
  };

  const handleSelectUser = async (userId: string) => {
    // If we already have a direct chat with this user, open it
    const existing = items.find(i => i.type === 'direct' && i.participantId === userId);
    if (existing) {
      setIsModalOpen(false);
      setTerm('');
      handleOpenChat(existing.id);
      return;
    }
    // Otherwise create a new direct chat (repo already returns existing if it finds one)
    const chat = await createDirectChat(userId);
    setIsModalOpen(false);
    setTerm('');
    handleOpenChat(chat.id);
  };

  const handleSelectExistingChat = (chatId: string) => {
    setIsModalOpen(false);
    setTerm('');
    handleOpenChat(chatId);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds(prev => {
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
    const chat = await createGroupChat({ name: groupName.trim(), memberIds, description: groupDescription.trim() || undefined });
    setIsGroupModalOpen(false);
    setGroupName('');
    setGroupDescription('');
    setGroupTerm('');
    setSelectedMemberIds(new Set());
    handleOpenChat(chat.id);
  };

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'unread':
        return items.filter(i => i.unreadCount > 0);
      case 'group':
        return items.filter(i => i.type === 'group');
      case 'direct':
        return items.filter(i => i.type === 'direct');
      default:
        return items;
    }
  }, [filter, items]);

  const filterLabel = useMemo(() => {
    switch (filter) {
      case 'unread':
        return 'No leídos';
      case 'group':
        return 'Grupos';
      case 'direct':
        return 'Personas';
      default:
        return 'Todos';
    }
  }, [filter]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-slate-900">Chats</Text>
            <View className="flex-row space-x-2">
              <Button action="primary" variant="outline" size="md" onPress={() => setIsGroupModalOpen(true)}>
                <ButtonText>Nuevo grupo</ButtonText>
              </Button>
              <Button action="primary" variant="solid" size="md" onPress={() => setIsModalOpen(true)}>
                <ButtonText>Nuevo chat</ButtonText>
              </Button>
            </View>
          </View>
          <View className="mt-3">
            <Select selectedValue={filter} defaultValue="all" onValueChange={(val: any) => setFilter(val)}>
              <SelectTrigger variant="outline" size="md">
                <SelectInput value={filterLabel} />
                <SelectIcon as={ChevronDownIcon} className="pr-3" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectItem value="all" label="Todos" />
                  <SelectItem value="unread" label="No leídos" />
                  <SelectItem value="group" label="Grupos" />
                  <SelectItem value="direct" label="Personas" />
                </SelectContent>
              </SelectPortal>
            </Select>
          </View>
        </View>
        {isLoading ? (
          <View className="py-10 items-center">
            <Text className="text-slate-500">Cargando chats...</Text>
          </View>
        ) : (
          <ChatList
            items={filteredItems}
            onSelect={handleOpenChat}
            onAvatarPress={handleAvatarPress}
            renderEmpty={<Text className="p-4 text-slate-500">No hay chats aún. Crea uno nuevo.</Text>}
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
        directChats={items.filter(i => i.type === 'direct') as ChatListItemView[]}
        onSelectChat={handleSelectExistingChat}
        onAvatarPress={handleAvatarPress}
      />

      <Modal visible={isGroupModalOpen} animationType="slide" onRequestClose={() => setIsGroupModalOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-4 py-3 border-b border-slate-200 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900">Nuevo grupo</Text>
            <Pressable onPress={() => setIsGroupModalOpen(false)} className="px-3 py-1">
              <Text className="text-cyan-600 font-semibold">Cerrar</Text>
            </Pressable>
          </View>
          <View className="px-4 pt-4 space-y-3">
            <View>
              <Text className="text-sm text-slate-700 mb-1">Nombre del grupo</Text>
              <Input>
                <InputField
                  placeholder="Ej. Equipo de martes"
                  value={groupName}
                  onChangeText={setGroupName}
                  className="text-slate-900"
                />
              </Input>
            </View>
            <View>
              <Text className="text-sm text-slate-700 mb-1">Descripción (opcional)</Text>
              <Input>
                <InputField
                  placeholder="Plan, horario o reglas"
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  className="text-slate-900"
                />
              </Input>
            </View>
            <View>
              <Text className="text-sm text-slate-700 mb-1">Añade personas</Text>
              <Input variant="rounded" size="lg" className="bg-slate-100">
                <InputField
                  className="text-slate-900"
                  placeholder="Busca por usuario o nombre"
                  value={groupTerm}
                  onChangeText={setGroupTerm}
                />
              </Input>
            </View>
          </View>
          {isSearchingGroup ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-500">Buscando...</Text>
            </View>
          ) : (
            <FlatList
              data={groupResults}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const selected = selectedMemberIds.has(item.id);
                return (
                  <ChatListItem
                    id={item.id}
                    title={item.userDetails.userName}
                    subtitle={item.userDetails.fullName}
                    avatarUrl={item.userDetails.photoURL}
                    type={'direct'}
                    onPress={() => toggleMember(item.id)}
                    actionSlot={<Text className={`text-sm font-semibold ${selected ? 'text-cyan-600' : 'text-slate-500'}`}>{selected ? 'Seleccionado' : 'Añadir'}</Text>}
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
              <ButtonText>Crear grupo</ButtonText>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
