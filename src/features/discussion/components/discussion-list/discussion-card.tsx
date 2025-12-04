import Tag from '@/src/components/commons/tag';
import { Avatar, AvatarFallbackText } from '@/src/components/ui/avatar';
import { Card } from '@/src/components/ui/card';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import { getTagColor } from '@/src/features/discussion/constants/tags';
import { MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

interface DiscussionCardProps {
  discussion: Discussion;
  onPress?: (discussionId: string) => void;
  spotSports?: SimpleSport[];
  spotName?: string; // Optional: show spot name for spot discussions
}

export const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion, onPress, spotSports, spotName }) => {
  const isSpotDiscussion = !!discussion.details.spotId;
  
  if (__DEV__) {
    // debug logs removed for production
    // If essential imports are undefined, return a safe fallback to avoid crashing the renderer
    if (!Tag || !HStack || !VStack || !Text) {
      console.warn('[DiscussionCard] One or more UI components are undefined. Rendering fallback.');
      return (
        <Pressable onPress={() => onPress?.(discussion.id)} className="p-3 bg-white rounded-lg shadow-sm">
          <VStack>
            <Text>{discussion.details.title}</Text>
            <Text className="text-sm text-gray-600">{discussion.details.description}</Text>
          </VStack>
        </Pressable>
      );
    }
  }
  return (
    <Pressable onPress={() => onPress?.(discussion.id)} className="mb-3">
      <Card className="bg-white px-3 py-3 shadow-sm">
      {/* Discussion type indicator */}
      <View className="flex-row items-center gap-1 pb-2">
        {isSpotDiscussion ? (
          <>
            <MapPin size={12} color="#3b82f6" />
            <Text className="text-xs text-blue-600 font-medium">
              {spotName || 'Spot Discussion'}
            </Text>
          </>
        ) : (
          <>
            <Users size={12} color="#8b5cf6" />
            <Text className="text-xs text-purple-600 font-medium">General Discussion</Text>
          </>
        )}
      </View>
      
      <HStack className="gap-3 items-start">
        <Avatar size="sm" className="border-2 border-gray-200">
          <AvatarFallbackText>{discussion.details.title?.charAt(0) || 'D'}</AvatarFallbackText>
        </Avatar>
        <VStack className="flex-1">
          <Text className="text-base font-bold text-gray-900">{discussion.details.title}</Text>
          <Text className="text-sm text-gray-600" numberOfLines={2}>{discussion.details.description}</Text>
        </VStack>
        {discussion.details.media && discussion.details.media.length > 0 && (
          <Image source={{ uri: discussion.details.media[0] }} className="w-16 h-16 rounded-lg bg-black" resizeMode="cover" />
        )}
      </HStack>
        {discussion.details.tags && discussion.details.tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pt-2">
            <HStack className="gap-2">
                    {discussion.details.tags.map(tag => {
                      // If tag matches sport ID, find its sport name
                      const tagSportById = spotSports?.find(s => s.id === tag);
                      const tagSportByName = spotSports?.find(s => s.name === tag);
                      const displayLabel = tagSportById ? tagSportById.name : (tagSportByName ? tag : tag);
                      const isSpotSport = !!tagSportById || !!tagSportByName;
                      const color = getTagColor(displayLabel) || (isSpotSport ? '#2ECC71' : '#E5E7EB');
                      return (
                        <Tag key={`${discussion.id}-${tag}`} label={displayLabel} color={color} />
                      );
                    })}
            </HStack>
          </ScrollView>
        )}
        <HStack className="gap-2 pt-2">
          <Text className="text-xs text-gray-500">{discussion.activity?.commentsCount || 0} comentarios</Text>
          <Text className="text-xs text-gray-500">{discussion.activity?.likesCount || 0} likes</Text>
          <Text className="text-xs text-gray-500">{discussion.activity?.dislikesCount || 0} dislikes</Text>
        </HStack>
      </Card>
    </Pressable>
  );
};
