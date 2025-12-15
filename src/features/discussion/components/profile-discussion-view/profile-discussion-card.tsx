import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Card } from '@/src/components/ui/card';
import { HStack } from '@/src/components/ui/hstack';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { User } from '@/src/entities/user/model/user';
import { useMediaUrls } from '@/src/hooks';
import { formatDate, getInitials } from '@/src/utils/date-utils';
import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import React from 'react';
import { Image, View } from 'react-native';

interface ProfileDiscussionCardProps {
  discussion: Discussion;
  user?: User;
  spotName?: string;
  onNavigate?: (discussionId: string, spotId: string) => void;
}

export const ProfileDiscussionCard: React.FC<ProfileDiscussionCardProps> = ({
  discussion,
  user,
  spotName,
  onNavigate,
}) => {
  const createdAt = formatDate(discussion.metadata.createdAt);
  const userName = user?.userDetails?.userName || user?.userDetails?.fullName || 'Usuario';
  const userPhoto = user?.userDetails?.photoURL;

  const { urls: mediaUrls } = useMediaUrls(discussion.details.media || []);

  const likes = discussion.activity?.likesCount ?? 0;
  const dislikes = discussion.activity?.dislikesCount ?? 0;
  const comments = discussion.activity?.commentsCount ?? 0;

  const handlePress = () => {
    if (onNavigate) onNavigate(discussion.id, discussion.details.spotId);
  };

  return (
    <Pressable onPress={handlePress}>
      <Card className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3">
        <VStack className="gap-3">
          <HStack className="justify-between items-start">
            <HStack className="gap-3 items-center">
              <Avatar size="sm" className="bg-blue-100 border border-blue-200">
                {userPhoto ? <AvatarImage source={{ uri: userPhoto }} /> : <AvatarFallbackText className="text-blue-700 font-semibold">{getInitials(userName)}</AvatarFallbackText>}
              </Avatar>
              <VStack className="gap-0.5">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{userName}</Text>
                <Text className="text-xs text-gray-500">{createdAt}</Text>
                {spotName && <Text className="text-xs text-blue-600 font-medium">{spotName}</Text>}
              </VStack>
            </HStack>
          </HStack>

          <VStack className="gap-1">
            <Text className="text-sm text-gray-900 font-semibold" numberOfLines={2}>
              {discussion.details.title || 'Discusión'}
            </Text>
            <Text className="text-sm text-gray-700" numberOfLines={3}>
              {discussion.details.description}
            </Text>
          </VStack>

          {mediaUrls.length > 0 && (
            <HStack className="gap-2 mt-1">
              {mediaUrls.slice(0, 3).map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
              ))}
              {mediaUrls.length > 3 && (
                <View className="w-14 h-14 rounded-lg bg-gray-100 items-center justify-center">
                  <Text className="text-xs text-gray-600">+{mediaUrls.length - 3}</Text>
                </View>
              )}
            </HStack>
          )}

          <HStack className="items-center justify-between pt-1">
            <HStack className="gap-4 items-center">
              <HStack className="items-center gap-1">
                <ThumbsUp size={16} color="#16a34a" strokeWidth={2} />
                <Text className="text-xs text-gray-700">{likes}</Text>
              </HStack>
              <HStack className="items-center gap-1">
                <ThumbsDown size={16} color="#ef4444" strokeWidth={2} />
                <Text className="text-xs text-gray-700">{dislikes}</Text>
              </HStack>
              <HStack className="items-center gap-1">
                <MessageCircle size={16} color="#2563eb" strokeWidth={2} />
                <Text className="text-xs text-gray-700">{comments}</Text>
              </HStack>
            </HStack>
            <Text className="text-xs text-blue-600">Ver discusión</Text>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );
};
