import { chatRepository } from '@/src/api/repositories';
import { Message } from '@/src/entities/chat';
import { useState } from 'react';

export const useSendMessage = (chatId?: string) => {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (params: { text?: string; senderId: string; mediaUrl?: string; mediaType?: 'image' | 'video' }): Promise<Message | null> => {
    if (!chatId) return null;
    setIsSending(true);
    setError(null);
    try {
      const message = await chatRepository.sendMessage({
        chatId,
        senderId: params.senderId,
        text: params.text,
        mediaUrl: params.mediaUrl,
        mediaType: params.mediaType,
      });
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  return { send, isSending, error };
};
