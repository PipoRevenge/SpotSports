import { discussionRepository } from '@/src/api/repositories';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { useCallback, useEffect, useState } from 'react';

interface UseDiscussionLoadOptions {
  pageSize?: number;
  sort?: 'newest' | 'mostVoted';
  tag?: string;
  search?: string;
  spotId?: string;
}

export function useDiscussionLoad({ pageSize = 12, sort = 'newest', tag, search, spotId }: UseDiscussionLoadOptions) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      // Updated to use options object with optional spotId
      const { discussions: f, total: t } = await discussionRepository.getDiscussions({ 
        page: p, 
        pageSize, 
        sort, 
        tag, 
        search, 
        spotId 
      });
      if (p === 1) setDiscussions(f);
      else setDiscussions(prev => [...prev, ...f]);
      setTotal(t);
      setHasMore(f.length === pageSize);
      setPage(p);
    } catch (error) {
      console.error('[useDiscussionLoad] load discussions', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, sort, tag, search, spotId]);

  useEffect(() => {
    load(1);
  }, [load]);

  return { discussions, total, loading, page, hasMore, loadMore: () => load(page + 1), refresh: () => load(1) };
}
