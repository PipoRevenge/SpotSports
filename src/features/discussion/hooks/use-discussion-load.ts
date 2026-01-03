import { discussionRepository } from '@/src/api/repositories';
import { useUser } from '@/src/context/user-context';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { DiscussionFilters, DiscussionSortOptions } from '@/src/features/discussion/types/discussion-filter-types';
import { useInfiniteQuery } from '@/src/lib/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface UseDiscussionLoadOptions {
  pageSize?: number;
  filters?: DiscussionFilters;
  sort?: DiscussionSortOptions;
  spotId?: string; // Optional spotId to scope discussions to a specific spot
}

export function useDiscussionLoad({ 
  pageSize = 12, 
  filters, 
  sort = { field: 'newest' },
  spotId,
}: UseDiscussionLoadOptions) {
  const { user } = useUser();
  const userId = user?.id;

  const queryKey = ['discussions', { pageSize, filters, sort, userId, spotId }];

  const infiniteQuery = useInfiniteQuery<{ items: Discussion[]; total: number }, Error, InfiniteData<{ items: Discussion[]; total: number }, number>, typeof queryKey, number>({
    queryKey,
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
      const pageNumber = typeof pageParam === 'number' ? pageParam : 1;
      const effectiveFilters = { ...(filters || {}), ...(spotId ? { spotId } : {}) } as any;
      const { discussions: f, total: t } = await discussionRepository.getDiscussions({ 
        page: pageNumber, 
        pageSize, 
        filters: effectiveFilters,
        sort,
        userId
      });
      return { items: f, total: t };
    },
    getNextPageParam: (lastPage, pages) => {
      const gotFullPage = lastPage.items.length === pageSize;
      if (!gotFullPage) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
  });

  const typedData = infiniteQuery.data as InfiniteData<{ items: Discussion[]; total: number }, number> | undefined;
  const discussions = typedData?.pages.flatMap((p) => p.items) ?? [];
  const total = typedData?.pages?.[0]?.total ?? 0;
  const loading = infiniteQuery.isLoading;
  const page = typedData ? typedData.pages.length : 0;
  const hasMore = infiniteQuery.hasNextPage ?? false;
  const { fetchNextPage, refetch } = infiniteQuery;

  // Use refs to ensure stable function identities for controls
  const fetchNextPageRef = useRef(fetchNextPage);
  const refetchRef = useRef(refetch);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
    refetchRef.current = refetch;
  }, [fetchNextPage, refetch]);

  const loadMore = useCallback(() => fetchNextPageRef.current(), []);
  const refresh = useCallback(() => refetchRef.current(), []);

  return { discussions, total, loading, page, hasMore, loadMore, refresh };
}
