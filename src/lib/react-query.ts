import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Query, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';

const persistedKeyPrefixes = new Set<string>([
  'user',
  'settings',
  'favorites',
  'drafts',
  'ui'
]);

const shouldPersistQuery = (query: Query) => {
  if (query.state.status !== 'success') return false;
  const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
  if (query.meta?.persist === true) return true;
  return typeof key === 'string' && persistedKeyPrefixes.has(key);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce stale time for more frequent refetches of critical data
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60_000, // 5 minutes
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      // Enable network mode to handle offline scenarios
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
      // Enable network mode for mutations
      networkMode: 'online',
    }
  }
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage
});

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: shouldPersistQuery
  }
};

// Re-export React Query primitives so hooks import from a single place
export {
    useInfiniteQuery, useIsFetching,
    useIsMutating, useMutation, useQuery, useQueryClient
} from '@tanstack/react-query';

