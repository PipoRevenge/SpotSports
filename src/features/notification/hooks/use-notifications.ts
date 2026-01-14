import { notificationRepository } from '@/src/api/repositories';
import { NotificationPage } from '@/src/api/repositories/interfaces/i-notification-repository';
import { useUser } from '@/src/context/user-context';
import { AppNotification } from '@/src/entities/notification/model/notification';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryDocumentSnapshot } from 'firebase/firestore';

const EMPTY_NOTIFICATIONS: AppNotification[] = [];

export const useNotifications = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const queryKey = ['notifications', userId] as const;

  const {
    data: notifications = EMPTY_NOTIFICATIONS,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isRefetching,
    refetch
  } = useInfiniteQuery<
    NotificationPage,
    Error,
    AppNotification[],
    typeof queryKey,
    QueryDocumentSnapshot | null
  >({
    queryKey,
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User not available for notifications');
      }

      return notificationRepository.getNotifications(userId, 20, pageParam ?? null);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc ?? null : null,
    enabled: Boolean(userId),
    select: (data) => data.pages.flatMap(page => page.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => {
      if (!userId) {
        throw new Error('User not available for notifications');
      }

      return notificationRepository.markAsRead(userId, notificationId);
    },
    onSuccess: () => {
        // We could do optimistic update here for better performance
        queryClient.invalidateQueries({ queryKey });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      if (!userId) {
        throw new Error('User not available for notifications');
      }

      return notificationRepository.markAllAsRead(userId);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    notifications,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending
  };
};
