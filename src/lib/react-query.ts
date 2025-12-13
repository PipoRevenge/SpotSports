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
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
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

