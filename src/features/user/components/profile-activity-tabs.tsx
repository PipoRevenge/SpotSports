import { HStack } from '@/src/components/ui/hstack';
import { Icon } from '@/src/components/ui/icon';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { User } from '@/src/entities/user/model/user';
import { CheckCircle, Heart, MessageSquare } from 'lucide-react-native';
import React, { useState } from 'react';

interface ActivityTabsProps {
  user?: User | null;
  userId: string | undefined;
  reviewsSlot?: React.ReactNode; // slot injected by app layer to render reviews list
}

export const ProfileActivityTabs: React.FC<ActivityTabsProps> = ({ user, userId, reviewsSlot }) => {
  const [selectedTab, setSelectedTab] = useState<'reviews' | 'favorites' | 'interactions'>('reviews');

  const TABS = [
    {
      key: 'reviews',
      label: 'Reseñas',
      icon: MessageSquare,
      color: '#9B59B6',
      count: user?.activity?.reviewsCount || 0,
    },
    {
      key: 'favorites',
      label: 'Favoritos',
      icon: Heart,
      color: '#FF6B6B',
      count: user?.activity?.favoriteSpotsCount || 0,
    },
    {
      key: 'interactions',
      label: 'Interacción',
      icon: CheckCircle,
      color: '#4ECDC4',
      count: (user?.activity?.commentsCount || 0) + (user?.activity?.reviewsCount || 0),
    }
  ];

  // For now we only render Reviews tab. Add more tabs later (Favorites, Following, etc.)
  return (
    <VStack className="w-full">
      {/* Tabs header */}
      <HStack className="w-full gap-2 justify-start items-center">
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setSelectedTab(tab.key as any)}
            className={`flex-row items-center gap-3 px-4 py-2 rounded-full border ${selectedTab === tab.key ? 'bg-white border-gray-300 shadow-md' : 'bg-gray-100 border-transparent'}`}
          >
            <Icon as={tab.icon} size={18} color={tab.color} />
            <Text className={`text-sm ${selectedTab === tab.key ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>{tab.label} {tab.count !== undefined && (<Text className="text-xs text-gray-500 pl-2">{tab.count}</Text>)}</Text>
          </Pressable>
        ))}
      </HStack>

      {/* Tab content */}
      <VStack className="pt-4">
        {selectedTab === 'reviews' && reviewsSlot}
        {selectedTab !== 'reviews' && (
          <VStack className="items-center justify-center p-8">
            <Text className="text-gray-600">Contenido no disponible aún para esta pestaña</Text>
          </VStack>
        )}
      </VStack>
    </VStack>
  );
};

export default ProfileActivityTabs;
