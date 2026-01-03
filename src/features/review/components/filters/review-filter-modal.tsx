import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { CloseIcon, Icon } from '@/src/components/ui/icon';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@/src/components/ui/modal';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Trophy } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

interface ReviewFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSportId?: string;
  onApply: (sportId: string) => void;
  onClear: () => void;
  availableSports?: { id: string; name: string }[];
}

export const ReviewFilterModal: React.FC<ReviewFilterModalProps> = ({
  visible,
  onClose,
  selectedSportId,
  onApply,
  onClear,
  availableSports = [],
}) => {
  const [localSelectedSportId, setLocalSelectedSportId] = React.useState<string | undefined>(selectedSportId);

  React.useEffect(() => {
    if (visible) {
      setLocalSelectedSportId(selectedSportId);
    }
  }, [visible, selectedSportId]);

  const handleSportToggle = (sportId: string) => {
    setLocalSelectedSportId((current) => (current === sportId ? undefined : sportId));
  };

  const handleApply = () => {
    onApply(localSelectedSportId || '');
    onClose();
  };

  const handleClearAll = () => {
    setLocalSelectedSportId(undefined);
    onClear();
    onClose();
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
              {/* Sports Filter */}
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
                          localSelectedSportId === sport.id
                            ? 'bg-green-50 border-green-500'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            localSelectedSportId === sport.id
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
                Apply {localSelectedSportId ? '(1)' : ''}
              </ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
