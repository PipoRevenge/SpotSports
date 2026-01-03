import { chatRepository, meetupRepository, userRepository } from '@/src/api/repositories';
import { User } from '@/src/entities/user/model/user';
import { useEffect, useState } from 'react';

export type ParticipantsContext = { type: 'chat', id: string } | { type: 'meetup', id: string, spotId: string };

export const useChatParticipants = (memberIds?: string[], context?: ParticipantsContext) => {
  const [participants, setParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        let ids: string[] = memberIds || [];

        if (ids.length === 0 && context) {
            if (context.type === 'chat' && typeof (chatRepository as any).getChatMembers === 'function') {
                const members = await (chatRepository as any).getChatMembers(context.id) as Array<{ userId: string }>;
                ids = members.map((m) => m.userId);
            } else if (context.type === 'meetup' && typeof (meetupRepository as any).getMeetupParticipants === 'function') {
                const members = await (meetupRepository as any).getMeetupParticipants(context.spotId, context.id) as Array<{ userId: string }>;
                ids = members.map((m) => m.userId);
            }
        }

        if (ids.length > 0) {
            const fetched = await Promise.all(ids.map(id => userRepository.getUserById(id)));
            setParticipants(fetched);
        } else {
            setParticipants([]);
        }
      } catch (e) {
        console.error(e);
        setParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [memberIds, context?.type, context?.id, (context as any)?.spotId]);

  return { participants, isLoading };
};
