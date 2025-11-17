import { RatingStars } from '@/src/components/commons/rating/rating-stars';
import { Card } from '@/src/components/ui/card';
import { HStack } from '@/src/components/ui/hstack';
import { Image } from '@/src/components/ui/image';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import React, { useState } from 'react';


interface SpotCardProps {
  id: string;
  name: string;
  number: number;
  imageUrl: string;
  onPress?: () => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({ name, number, imageUrl, onPress }) => {
  const [isPressed, setIsPressed] = useState(false);


  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={{ opacity: isPressed ? 0.7 : 1 }}
      className='p-1'
      
    >
      <Card className={`w-full overflow-hidden rounded-md border border-background-200 self-center ${isPressed ? 'bg-gray-200' : ''}`}>
        <VStack>
          <Image
            source={{ uri: imageUrl }}
            alt={name}
            className="w-full h-40"
            resizeMode="cover"
            style={{ opacity: isPressed ? 0.8 : 1 }}
          />
          <HStack className="p-3 justify-between items-center">
            <Text className="font-medium text-lg w-1/2">{name}</Text>
            <RatingStars rating={number} size="sm" showValue={true} />
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );
};