import { discussionRepository, userRepository } from '@/src/api/repositories';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { User } from '@/src/entities/user/model/user';
import { useCallback, useEffect, useState } from 'react';

export function useDiscussionDetails(discussionId?: string) {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id?: string) => {
    if (!id) {
      setDiscussion(null);
      setAuthor(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await discussionRepository.getDiscussionById(id);
      setDiscussion(d);
      
      // Load author data
      if (d?.metadata?.createdBy) {
        try {
          const userData = await userRepository.getUserById(d.metadata.createdBy);
          setAuthor(userData);
        } catch {
          console.warn('[useDiscussionDetails] Could not load author');
          setAuthor(null);
        }
      }
    } catch (err) {
      console.error('[useDiscussionDetails] error loading discussion', err);
      setError(err instanceof Error ? err.message : 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(discussionId); }, [discussionId, load]);

  return { discussion, author, loading, error, refresh: () => load(discussionId) };
}
