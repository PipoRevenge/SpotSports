import { chatRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Chat } from '@/src/entities/chat';
import { useState } from 'react';

export const useCreateChat = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createDirectChat = async (targetUserId: string): Promise<Chat> => {
    if (!user) throw new Error('Usuario no autenticado');
    setIsLoading(true);
    setError(null);
    try {
      return await chatRepository.createDirectChat(user.id, targetUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el chat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createGroupChat = async (params: { name: string; memberIds: string[]; photoURL?: string; description?: string }): Promise<Chat> => {
    if (!user) throw new Error('Usuario no autenticado');
    setIsLoading(true);
    setError(null);
    try {
      return await chatRepository.createGroupChat({
        ownerId: user.id,
        name: params.name,
        memberIds: params.memberIds,
        photoURL: params.photoURL,
        description: params.description,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createDirectChat, createGroupChat, isLoading, error };
};
