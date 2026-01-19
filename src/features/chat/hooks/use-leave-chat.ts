import { chatRepository, meetupRepository } from '@/src/api/repositories';
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
      throw new Error('User not authenticated');
    }

    // If it's a meetup-group chat, confirm with special message
    if (chat.type === 'meetup-group' && chat.meetupId && chat.meetupSpotId) {
      const confirmed = await showConfirm(
        'Leave meetup group',
        '⚠️ This group is associated with a meetup. Leaving this chat will also remove you from the meetup. Are you sure?',
        'Leave',
        'Cancel'
      );

      if (!confirmed) {
        throw new Error('Cancelled by user');
      }

      try {
        setIsLeaving(true);
        
        const meetup = await meetupRepository.getMeetupById(chat.meetupSpotId, chat.meetupId);
        if (!meetup) throw new Error('Meetup not found');

        const isOrganizer = meetup.organizerId === user.id;

        // First leave the meetup
        await leaveMeetupAsync({
          spotId: chat.meetupSpotId!,
          meetupId: chat.meetupId!,
          userId: user.id,
          isOrganizer
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
      chat.type === 'group' ? 'Leave group' : 'Delete chat',
      chat.type === 'group' 
        ? 'Are you sure you want to leave this group?' 
        : 'Are you sure you want to delete this chat?',
      chat.type === 'group' ? 'Leave' : 'Delete',
      'Cancel'
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
