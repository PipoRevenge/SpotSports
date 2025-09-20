import { Progress, ProgressFilledTrack } from '@components/ui/progress';
import { Text } from '@components/ui/text';
import { VStack } from '@components/ui/vstack';
import React from 'react';

interface DifficultyRatingProps {
  value: number; // valor del 1 al 10
}

const DifficultyRating: React.FC<DifficultyRatingProps> = ({ value }) => {
  const getLevel = (value: number) => {
    if (value <= 3) return 'Beginner';
    if (value <= 6) return 'Intermediate';
    if (value <= 8) return 'Advanced';
    return 'Expert';
  };

  const getColor = (value: number) => {
    if (value <= 3) return 'bg-emerald-600';
    if (value <= 6) return 'bg-yellow-400';
    if (value <= 8) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const percentage = (value / 10) * 100;

  return (
    <VStack space={2}>
      <Progress className="w-32 h-3 rounded-full border-spacing-1 border-black" value={percentage} max={100}>
        <ProgressFilledTrack 
          className={`${getColor(value)}`} 
        />
      </Progress>
      
      <Text className="text-sm">
        {value}/10 - {getLevel(value)}
      </Text>
      
    </VStack>
  );
};

export default DifficultyRating;