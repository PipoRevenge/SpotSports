import { userRepository } from '@/src/api/repositories';
import { User } from '@/src/entities/user/model/user';
import { useEffect, useState } from 'react';

export const useChatParticipants = (memberIds: string[] | undefined) => {
  const [participants, setParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!memberIds?.length) {
        setParticipants([]);
        return;
      }
      setIsLoading(true);
      try {
        const fetched = await Promise.all(memberIds.map(id => userRepository.getUserById(id)));
        setParticipants(fetched);
      } catch {
        setParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [memberIds]);

  return { participants, isLoading };
};
