import { chatRepository } from '@/src/api/repositories';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { Chat } from '@/src/entities/chat';
import { useLeaveMeetup } from '@/src/features/meetup/hooks/use-leave-meetup';
import { useState } from 'react';

export const useLeaveChat = () => {
  const { user } = useUser();
  const { showConfirm } = useAppAlert();
  const [isLeaving, setIsLeaving] = useState(false);
  const { leaveAsync: leaveMeetupAsync } = useLeaveMeetup();

  const leaveChat = async (chat: Chat) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // If it's a meetup-group chat, confirm with special message
    if (chat.type === 'meetup-group' && chat.meetupId && chat.meetupSpotId) {
      const confirmed = await showConfirm(
        'Abandonar grupo de meetup',
        '⚠️ Este es un grupo asociado a un meetup. Al abandonar este chat, también abandonarás el meetup. ¿Estás seguro?',
        'Abandonar',
        'Cancelar'
      );

      if (!confirmed) {
        throw new Error('Cancelado por el usuario');
      }

      try {
        setIsLeaving(true);
        
        // First leave the meetup
        await leaveMeetupAsync({
          spotId: chat.meetupSpotId!,
          meetupId: chat.meetupId!,
          userId: user.id
        });

        // Then leave/delete the chat
        await chatRepository.deleteChat(chat.id, user.id);
        
        setIsLeaving(false);
      } catch (error) {
        setIsLeaving(false);
        throw error;
      }
      return;
    }

    // For regular chats, just leave the chat
    const confirmed = await showConfirm(
      chat.type === 'group' ? 'Abandonar grupo' : 'Eliminar chat',
      chat.type === 'group' 
        ? '¿Estás seguro de que quieres abandonar este grupo?' 
        : '¿Estás seguro de que quieres eliminar este chat?',
      chat.type === 'group' ? 'Abandonar' : 'Eliminar',
      'Cancelar'
    );

    if (!confirmed) {
      throw new Error('Cancelado por el usuario');
    }

    try {
      setIsLeaving(true);
      await chatRepository.deleteChat(chat.id, user.id);
      setIsLeaving(false);
    } catch (error) {
      setIsLeaving(false);
      throw error;
    }
  };

  return { leaveChat, isLeaving };
};
