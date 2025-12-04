import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { useDiscussionLoad } from '@/src/features/discussion';
import { DiscussionCard } from '@/src/features/discussion/components/discussion-list/discussion-card';
import { useRouter } from 'expo-router';
import { ArrowDownWideNarrow, Clock, Flame, MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortOption = 'newest' | 'mostVoted';
type FilterType = 'all' | 'general' | 'spot';

export default function DiscussionsPage() {
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [filterType, setFilterType] = React.useState<FilterType>('all');
  
  // Load discussions - general discussions have no spotId
  // When filterType is 'general', we only want discussions without spotId
  // The hook doesn't currently support this filter, so we'll filter client-side
  const { discussions: allDiscussions, loading, loadMore, refresh, hasMore } = useDiscussionLoad({ 
    pageSize: 20, 
    sort: sortBy,
    // Note: For general discussions page, we could pass spotId: '' to get only general ones
    // But for now we load all and filter client-side
  });
  
  // Filter discussions based on type
  const discussions = React.useMemo(() => {
    if (filterType === 'all') return allDiscussions;
    if (filterType === 'general') return allDiscussions.filter(d => !d.details.spotId);
    if (filterType === 'spot') return allDiscussions.filter(d => !!d.details.spotId);
    return allDiscussions;
  }, [allDiscussions, filterType]);
  
  const { user } = useUser();
  const router = useRouter();
  
  // Separate refreshing state
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleCreate = () => {
    // Create general discussion (no spotId)
    router.push('/discussion/create');
  };

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleSortChange = (newSort: SortOption) => {
    if (newSort !== sortBy) {
      setSortBy(newSort);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <VStack className="flex-1 p-3">
        <HStack className="justify-between items-center pb-3">
          <Text className="text-xl font-bold">Discussions</Text>
          {user?.id && (
            <Button onPress={handleCreate} variant="solid" size="sm">
              <ButtonText className="text-white">New Discussion</ButtonText>
            </Button>
          )}
        </HStack>

        {/* Filter by type */}
        <HStack className="gap-2 pb-2 items-center">
          <Pressable 
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${filterType === 'all' ? 'bg-gray-800' : 'bg-gray-200'}`}
            onPress={() => setFilterType('all')}
          >
            <Text className={`text-sm ${filterType === 'all' ? 'text-white' : 'text-gray-600'}`}>All</Text>
          </Pressable>
          <Pressable 
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${filterType === 'general' ? 'bg-purple-500' : 'bg-gray-200'}`}
            onPress={() => setFilterType('general')}
          >
            <Users size={14} color={filterType === 'general' ? '#fff' : '#6b7280'} />
            <Text className={`text-sm ${filterType === 'general' ? 'text-white' : 'text-gray-600'}`}>General</Text>
          </Pressable>
          <Pressable 
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${filterType === 'spot' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => setFilterType('spot')}
          >
            <MapPin size={14} color={filterType === 'spot' ? '#fff' : '#6b7280'} />
            <Text className={`text-sm ${filterType === 'spot' ? 'text-white' : 'text-gray-600'}`}>Spots</Text>
          </Pressable>
        </HStack>

        {/* Sort Options */}
        <HStack className="gap-2 pb-3 items-center">
          <ArrowDownWideNarrow size={18} color="#6b7280" />
          <Pressable 
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${sortBy === 'newest' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => handleSortChange('newest')}
          >
            <Clock size={14} color={sortBy === 'newest' ? '#fff' : '#6b7280'} />
            <Text className={`text-sm ${sortBy === 'newest' ? 'text-white' : 'text-gray-600'}`}>Recent</Text>
          </Pressable>
          <Pressable 
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${sortBy === 'mostVoted' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => handleSortChange('mostVoted')}
          >
            <Flame size={14} color={sortBy === 'mostVoted' ? '#fff' : '#6b7280'} />
            <Text className={`text-sm ${sortBy === 'mostVoted' ? 'text-white' : 'text-gray-600'}`}>Popular</Text>
          </Pressable>
        </HStack>

        {(!loading && discussions.length === 0) ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 }}>
            <Text className="text-gray-600 text-center">
              {filterType === 'general' 
                ? 'No general discussions yet — start a conversation about sports, tips, or community topics!'
                : filterType === 'spot'
                ? 'No spot discussions found — discussions about specific spots will appear here.'
                : 'No discussions yet — be the first to start one!'}
            </Text>
            {user?.id && filterType !== 'spot' && (
              <Button onPress={handleCreate} className="mt-4">
                <ButtonText className="text-white">Start Discussion</ButtonText>
              </Button>
            )}
          </View>
        ) : (
          <FlatList
            data={discussions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DiscussionCard 
                discussion={item} 
                onPress={(id) => router.push(`/discussion/${id}`)} 
              />
            )}
            onEndReached={() => { if (hasMore) loadMore(); }}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </VStack>
    </SafeAreaView>
  );
}
