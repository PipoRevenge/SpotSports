import { HStack } from '@/src/components/ui/hstack';
import {
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectTrigger,
} from '@/src/components/ui/select';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import {
    DEFAULT_DISCUSSION_SORT,
    DISCUSSION_SORT_OPTIONS,
} from '@/src/features/discussion/constants/sort-options';
import { useDiscussionLoad } from '@/src/features/discussion/hooks/use-discussion-load';
import type {
    DiscussionFilters,
    DiscussionSortField,
} from '@/src/features/discussion/types/discussion-filter-types';
import { ChevronDownIcon } from 'lucide-react-native';
import React, { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { DiscussionFilterButton, DiscussionFilterModal } from '../filters';

export interface DiscussionListWithFiltersControls {
  openFilters: () => void;
  getActiveFilters: () => number;
  refresh: () => void;
  /** Allow parent to programmatically change the sort */
  setSortBy: (sort: DiscussionSortField) => void;
}

interface DiscussionListWithFiltersProps {
  spotId: string;
  availableSports?: SimpleSport[];
  spotName?: string;
  onDiscussionPress?: (discussionId: string) => void;
  onRegisterControls?: (controls: DiscussionListWithFiltersControls) => void;
  discussionCardSlot?: (discussion: Discussion) => React.ReactNode;
  headerSlot?: React.ReactNode;
  emptySlot?: React.ReactNode;
}

export const DiscussionListWithFilters = React.forwardRef<
  DiscussionListWithFiltersControls,
  DiscussionListWithFiltersProps
>(
  (
    {
      spotId,
      availableSports = [],
      spotName,
      onDiscussionPress,
      onRegisterControls,
      discussionCardSlot,
      headerSlot,
      emptySlot,
    },
    ref
  ) => {
    const [filters, setFilters] = useState<DiscussionFilters>({});
    const [sortBy, setSortBy] = useState<DiscussionSortField>(DEFAULT_DISCUSSION_SORT);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const { discussions, loading, refresh } = useDiscussionLoad({
      pageSize: 10,
      spotId,
      filters,
      sort: { field: sortBy },
    });

    const getActiveFiltersCount = useCallback(() => {
      let count = 0;
      if (filters.tag) count += 1;
      if (filters.sportId) count += 1;
      return count;
    }, [filters]);

    const handleOpenFilters = useCallback(() => {
      setIsFilterModalVisible(true);
    }, []);

    const controls: DiscussionListWithFiltersControls = useMemo(
      () => ({
        openFilters: handleOpenFilters,
        getActiveFilters: getActiveFiltersCount,
        refresh,
        setSortBy: (s: DiscussionSortField) => setSortBy(s),
      }),
      [handleOpenFilters, getActiveFiltersCount, refresh]
    );

    // Expose controls via ref
    useImperativeHandle(ref, () => controls, [controls]);

    // Register controls with parent via callback
    React.useEffect(() => {
      if (onRegisterControls) {
        onRegisterControls(controls);
      }
    }, [onRegisterControls, controls]);

    const handleApplyFilters = (newFilters: DiscussionFilters) => {
      setFilters(newFilters);
    };

    const handleClearFilters = () => {
      setFilters({});
    };

    if (loading && discussions.length === 0) {
      return (
        <VStack className="items-center justify-center py-8">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 pt-2">Loading discussions...</Text>
        </VStack>
      );
    }

    return (
      <VStack className="gap-2">
        {/* Header with filters */}
        {headerSlot || (
          <VStack className="gap-2 pb-2">
            <HStack className="justify-between items-center">
              <Text className="text-lg font-semibold">
                {discussions.length} Discussion{discussions.length !== 1 ? 's' : ''}
              </Text>
              <DiscussionFilterButton
                onPress={handleOpenFilters}
                activeFiltersCount={getActiveFiltersCount()}
              />
            </HStack>
            <HStack className="justify-end">
              <Select
                selectedValue={sortBy}
                onValueChange={(value) => setSortBy(value as DiscussionSortField)}
              >
                <SelectTrigger variant="outline" size="sm" className="flex-row items-center gap-2">
                  <SelectInput placeholder="Sort by" className="text-sm" />
                  <SelectIcon as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {DISCUSSION_SORT_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </HStack>
          </VStack>
        )}

        {/* Empty state */}
        {discussions.length === 0 && !loading && (
          emptySlot || (
            <VStack className="items-center py-8">
              <Text className="text-gray-600">No discussions found</Text>
            </VStack>
          )
        )}

        {/* Discussion list */}
        <VStack className="gap-2">
          {discussions.map((discussion) => (
            <React.Fragment key={discussion.id}>
              {discussionCardSlot ? discussionCardSlot(discussion) : null}
            </React.Fragment>
          ))}
        </VStack>

        {/* Filter Modal */}
        <DiscussionFilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          filters={filters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          availableSports={availableSports}
        />
      </VStack>
    );
  }
);

DiscussionListWithFilters.displayName = 'DiscussionListWithFilters';
