import { userRepository } from '@/src/api/repositories';
import { User } from '@/src/entities/user/model/user';
import { useInfiniteQuery } from '@/src/lib/react-query';

export const useAllUsers = (options?: { limit?: number }) => {
  const limit = options?.limit ?? 20;
  const qk = ['users', { limit }];

  const inf = useInfiniteQuery<any, any>({
    queryKey: qk,
    initialPageParam: undefined,
    queryFn: async (ctx: any) => {
      const pageParam = ctx.pageParam as any;
      const res = await userRepository.getAllUsers({ limit, startAfter: pageParam });
      return { items: res.items, lastVisible: res.lastVisible };
    },
    getNextPageParam: (lastPage: any) => lastPage.lastVisible,
  });

  const users = (inf.data?.pages ?? []).flatMap((p: any) => p.items) as User[];
  const isLoading = inf.isLoading;
  const isLoadingMore = inf.isFetchingNextPage;
  const error = inf.isError ? (inf.error as Error)?.message : null;
  const loadMore = async () => { if (inf.hasNextPage) await inf.fetchNextPage(); };
  const refetch = async () => await inf.refetch();

  return { users, isLoading, isLoadingMore, error, refetch, loadMore };
};
