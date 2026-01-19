import { chatRepository } from '@/src/api/repositories';
import { useState } from 'react';

export const useDeleteChat = (chatId?: string, userId?: string) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteChat = async () => {
    if (!chatId || !userId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await chatRepository.deleteChat(chatId, userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete the chat';
      setError(message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteChat, isDeleting, error };
};
