import { CreatedByMeToggle, SortDropdown } from '@/src/components/commons/filters';
import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useSelectedSpot } from '@/src/context/selected-spot-context';
import { useUser } from '@/src/context/user-context';
import { useDiscussionLoad } from '@/src/features/discussion';
import { DiscussionCard } from '@/src/features/discussion/components/discussion-list/discussion-card';
import { DISCUSSION_SORT_OPTIONS } from '@/src/features/discussion/constants/sort-options';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortOption = 'newest' | 'mostVoted';
type FilterType = 'all' | 'general' | 'spot';

export default function DiscussionsPage() {
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [showOnlyMine, setShowOnlyMine] = React.useState(false);
  
  const { user } = useUser();
  const router = useRouter();
  const { spotId } = useLocalSearchParams<{ spotId: string }>();
  const { discussionRefreshCount } = useSelectedSpot();

  // Build filters for server-side query
  const filters = React.useMemo(() => {
    const f: any = {};
    if (spotId) f.spotId = String(spotId);
    if (showOnlyMine) f.createdByMe = true;
    return f;
  }, [spotId, showOnlyMine]);

  // Load discussions using the filters + sort
  const { discussions, loading, loadMore, refresh, hasMore } = useDiscussionLoad({ 
    pageSize: 20,
    filters,
    sort: { field: sortBy }
  });
  
  // Separate refreshing state
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleCreate = () => {
    // Create a discussion for this spot (nested route)
    if (!spotId) return;
    router.push({ pathname: `/spot/[spotId]/discussion/create`, params: { spotId } });
  };

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  React.useEffect(() => {
    // When the selected spot's discussion counter is bumped, refresh lists
    if (!spotId) return;
    refresh();
  }, [discussionRefreshCount, spotId, refresh]);

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



        {/* Filtros y ordenamiento */}
        <HStack className="gap-2 pb-3 items-center">
          <View className="flex-1 min-w-[140px]">
            <SortDropdown
              options={DISCUSSION_SORT_OPTIONS}
              value={sortBy}
              onChange={(field) => setSortBy(field as SortOption)}
              label="Ordenar"
            />
          </View>

          {user?.id && (
            <CreatedByMeToggle
              active={showOnlyMine}
              onChange={setShowOnlyMine}
              contentType="discussions"
            />
          )}
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
                onPress={(id) => {
                  if (!spotId) return;
                  router.push({ pathname: `/spot/[spotId]/discussion/[discussionId]`, params: { spotId, discussionId: id } });
                }} 
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
