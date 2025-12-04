import { MediaCarousel } from '@/src/components/commons/media-carousel';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { User } from '@/src/entities/user/model/user';
import { formatDate, getInitials } from '@/src/utils/date-utils';
import React from 'react';

interface DiscussionHeaderProps { 
  discussion: Discussion;
  author?: User | null;
}

export const DiscussionHeader: React.FC<DiscussionHeaderProps> = ({ discussion, author }) => {
  const userName = author?.userDetails?.userName || author?.userDetails?.fullName || 'Usuario';
  const profileImageUrl = author?.userDetails?.photoURL;
  const formattedDate = discussion.metadata?.createdAt ? formatDate(discussion.metadata.createdAt) : '';
  
  return (
    <VStack className="p-3 bg-white rounded-lg">
      <Text className="text-xl font-bold text-gray-900">{discussion.details.title}</Text>
      <HStack className="items-center gap-2 pt-1">
        <Avatar size="xs" className="bg-gray-100 border border-gray-200">
          {profileImageUrl ? (
            <AvatarImage source={{ uri: profileImageUrl }} />
          ) : (
            <AvatarFallbackText className="text-gray-600 text-xs">
              {getInitials(userName)}
            </AvatarFallbackText>
          )}
        </Avatar>
        <Text className="text-sm text-gray-600">Por {userName} — {formattedDate}</Text>
      </HStack>
      {discussion.details.description && (
        <Text className="text-sm text-gray-700 pt-2">{discussion.details.description}</Text>
      )}
      {discussion.details.media && discussion.details.media.length > 0 && (
        <VStack className="pt-3">
          <MediaCarousel media={discussion.details.media} />
        </VStack>
      )}
    </VStack>
  );
};
