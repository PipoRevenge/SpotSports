import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@/src/components/ui/modal';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import { AVAILABLE_TAGS } from '@/src/features/discussion/constants/tags';
import type { DiscussionFilters } from '@/src/features/discussion/types/discussion-filter-types';
import { CloseIcon, Icon } from '@components/ui/icon';
import { Tag as TagIcon, Trophy } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

interface DiscussionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: DiscussionFilters;
  onApply: (filters: DiscussionFilters) => void;
  onClear: () => void;
  availableSports?: SimpleSport[];
}

export const DiscussionFilterModal: React.FC<DiscussionFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onClear,
  availableSports = [],
}) => {
  // Local arrays for UI state
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedSports, setSelectedSports] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (visible) {
      // Convert singular filter to array for UI
      setSelectedTags(filters.tag ? [filters.tag] : []);
      setSelectedSports(filters.sportId ? [filters.sportId] : []);
    }
  }, [visible, filters]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  };

  const handleSportToggle = (sportId: string) => {
    setSelectedSports((current) =>
      current.includes(sportId) ? current.filter((s) => s !== sportId) : [...current, sportId]
    );
  };

  const handleApply = () => {
    // Convert arrays back to singular filter format
    const newFilters: DiscussionFilters = {
      ...(selectedTags.length > 0 ? { tag: selectedTags[0] } : {}),
      ...(selectedSports.length > 0 ? { sportId: selectedSports[0] } : {}),
    };
    onApply(newFilters);
    onClose();
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    setSelectedSports([]);
    onClear();
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (selectedSports.length > 0) count += selectedSports.length;
    return count;
  };

  return (
    <Modal isOpen={visible} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[90%]">
        <ModalHeader className="border-b border-gray-200">
          <HStack className="justify-between items-center w-full">
            <Text className="text-xl font-bold">Filters</Text>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack className="gap-4 py-2">
              {/* Tags Filter */}
              <VStack className="gap-2">
                <HStack className="items-center gap-2">
                  <Icon as={TagIcon} size="sm" className="text-gray-700" />
                  <Text className="text-base font-semibold">Tags</Text>
                </HStack>
                <HStack className="flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <Pressable
                      key={tag.label}
                      onPress={() => handleTagToggle(tag.label)}
                      className={`px-3 py-2 rounded-full border ${
                        selectedTags.includes(tag.label)
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedTags.includes(tag.label)
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {tag.label}
                      </Text>
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              {/* Sports Filter (if available) */}
              {availableSports.length > 0 && (
                <VStack className="gap-2">
                  <HStack className="items-center gap-2">
                    <Icon as={Trophy} size="sm" className="text-gray-700" />
                    <Text className="text-base font-semibold">Sports</Text>
                  </HStack>
                  <HStack className="flex-wrap gap-2">
                    {availableSports.map((sport) => (
                      <Pressable
                        key={sport.id}
                        onPress={() => handleSportToggle(sport.id)}
                        className={`px-3 py-2 rounded-full border ${
                          selectedSports.includes(sport.id)
                            ? 'bg-green-50 border-green-500'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            selectedSports.includes(sport.id)
                              ? 'text-green-700'
                              : 'text-gray-700'
                          }`}
                        >
                          {sport.name}
                        </Text>
                      </Pressable>
                    ))}
                  </HStack>
                </VStack>
              )}
            </VStack>
          </ScrollView>
        </ModalBody>

        <ModalFooter className="border-t border-gray-200">
          <HStack className="w-full gap-2">
            <Button
              variant="outline"
              action="secondary"
              onPress={handleClearAll}
              className="flex-1"
            >
              <ButtonText>Clear All</ButtonText>
            </Button>
            <Button
              variant="solid"
              action="primary"
              onPress={handleApply}
              className="flex-1"
            >
              <ButtonText>
                Apply {getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()})` : ''}
              </ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
