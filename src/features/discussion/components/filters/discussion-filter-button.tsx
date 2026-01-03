import { Button, ButtonIcon } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { Filter } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

interface DiscussionFilterButtonProps {
  onPress: () => void;
  activeFiltersCount?: number;
}

export const DiscussionFilterButton: React.FC<DiscussionFilterButtonProps> = ({
  onPress,
  activeFiltersCount = 0,
}) => {
  return (
    <View className="relative">
      <Button
        onPress={onPress}
        variant="solid"
        action="default"
        size="sm"
        className="rounded-full p-2 bg-gray-100"
      >
        <ButtonIcon as={Filter} className="text-blue-600 h-5 w-5" />
      </Button>
      {activeFiltersCount > 0 ? (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center">
          <Text className="text-white text-[10px] font-bold">{activeFiltersCount}</Text>
        </View>
      ) : null}
    </View>
  );
};
