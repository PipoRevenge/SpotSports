import { discussionRepository } from '@/src/api/repositories';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { useInfiniteQuery } from '@/src/lib/react-query';
import type { InfiniteData } from '@tanstack/react-query';

interface UseDiscussionLoadOptions {
  pageSize?: number;
  sort?: 'newest' | 'mostVoted';
  tag?: string;
  search?: string;
  spotId?: string;
}

export function useDiscussionLoad({ pageSize = 12, sort = 'newest', tag, search, spotId }: UseDiscussionLoadOptions) {
  const queryKey = ['discussions', { pageSize, sort, tag, search, spotId }];

  const infiniteQuery = useInfiniteQuery<{ items: Discussion[]; total: number }, Error, InfiniteData<{ items: Discussion[]; total: number }, number>, typeof queryKey, number>({
    queryKey,
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
      const pageNumber = typeof pageParam === 'number' ? pageParam : 1;
      const { discussions: f, total: t } = await discussionRepository.getDiscussions({ page: pageNumber, pageSize, sort, tag, search, spotId });
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

  const loadMore = () => infiniteQuery.fetchNextPage();
  const refresh = () => infiniteQuery.refetch();

  return { discussions, total, loading, page, hasMore, loadMore, refresh };
}
