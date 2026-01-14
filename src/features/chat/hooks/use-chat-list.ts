import { chatRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Chat } from '@/src/entities/chat';
import { useEffect, useState } from 'react';

export const useChatList = () => {
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = chatRepository.subscribeToUserChats(
      user.id, 
      items => {
        setChats(items);
        setIsLoading(false);
      },
      err => {
        console.error('Error loading chat list:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await chatRepository.listChatsForUser(user.id);
      setChats(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar chats');
    } finally {
      setIsLoading(false);
    }
  };

  return { chats, isLoading, error, refetch };
};
