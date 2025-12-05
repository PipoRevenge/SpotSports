import { Card } from '@/src/components/ui/card';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Comment } from '@/src/entities/comment/model/comment';
import { CommentContext, useUserComments } from '@/src/features/comment/hooks/use-user-comments';
import { formatDate } from '@/src/utils/date-utils';
import { FileText, MapPin, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

export interface UserCommentListProps {
  userId: string | undefined;
  onNavigateToReview?: (reviewId: string, spotId: string) => void;
  onNavigateToDiscussion?: (discussionId: string, spotId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
}

interface UserCommentCardProps {
  comment: Comment;
  contextMap: Map<string, CommentContext>;
  onNavigateToReview?: (reviewId: string, spotId: string) => void;
  onNavigateToDiscussion?: (discussionId: string, spotId: string) => void;
  onNavigateToSpot?: (spotId: string) => void;
}

const UserCommentCard: React.FC<UserCommentCardProps> = ({
  comment,
  contextMap,
  onNavigateToReview,
  onNavigateToDiscussion,
  onNavigateToSpot,
}) => {
  const spot = contextMap.get(comment.contextId)?.spot;
  const sourceKey = `${comment.sourceType}-${comment.sourceId}`;
  const review = contextMap.get(sourceKey)?.review;
  const discussion = contextMap.get(sourceKey)?.discussion;

  const handlePress = () => {
    if (comment.sourceType === 'review' && onNavigateToReview) {
      onNavigateToReview(comment.sourceId, comment.contextId);
    } else if (comment.sourceType === 'discussion' && onNavigateToDiscussion) {
      onNavigateToDiscussion(comment.sourceId, comment.contextId);
    }
  };

  const getSourceTitle = () => {
    if (comment.sourceType === 'review' && review) {
      // Reviews don't have title, use first part of content or fallback
      const content = review.details.content || '';
      return content.length > 30 ? content.substring(0, 30) + '...' : content || 'Reseña';
    } else if (comment.sourceType === 'discussion' && discussion) {
      return discussion.details.title || 'Discusión';
    }
    return comment.sourceType === 'review' ? 'Reseña' : 'Discusión';
  };

  const SourceIcon = comment.sourceType === 'review' ? FileText : MessageCircle;

  return (
    <Pressable onPress={handlePress}>
      <Card className="bg-white px-4 py-3 shadow-sm mb-3">
        {/* Context header: spot and source info */}
        <VStack className="gap-1 mb-2">
          {/* Spot info */}
          {spot && (
            <HStack className="items-center gap-1">
              <MapPin size={12} color="#3b82f6" />
              <Text className="text-xs text-blue-600 font-medium" numberOfLines={1}>
                {spot.details.name}
              </Text>
            </HStack>
          )}
          
          {/* Source info (review/discussion) */}
          <HStack className="items-center gap-1">
            <SourceIcon size={12} color="#6b7280" />
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              en: {getSourceTitle()}
            </Text>
          </HStack>
        </VStack>

        {/* Comment content */}
        <Text className="text-sm text-gray-800 mb-2" numberOfLines={3}>
          {comment.content}
        </Text>

        {/* Footer: date and stats */}
        <HStack className="justify-between items-center">
          <Text className="text-xs text-gray-400">
            {formatDate(comment.createdAt)}
          </Text>
          
          <HStack className="gap-3">
            <HStack className="items-center gap-1">
              <ThumbsUp size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500">{comment.likesCount || 0}</Text>
            </HStack>
            <HStack className="items-center gap-1">
              <ThumbsDown size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500">{comment.dislikesCount || 0}</Text>
            </HStack>
            {comment.commentsCount > 0 && (
              <HStack className="items-center gap-1">
                <MessageCircle size={12} color="#6b7280" />
                <Text className="text-xs text-gray-500">{comment.commentsCount}</Text>
              </HStack>
            )}
          </HStack>
        </HStack>
      </Card>
    </Pressable>
  );
};

export const UserCommentList: React.FC<UserCommentListProps> = ({
  userId,
  onNavigateToReview,
  onNavigateToDiscussion,
  onNavigateToSpot,
}) => {
  const { comments, contextMap, loading, error } = useUserComments(userId);

  if (loading) {
    return (
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Cargando comentarios...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-red-600">Error cargando comentarios</Text>
        <Text className="pt-2 text-gray-600">{error}</Text>
      </VStack>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-gray-600">No hay comentarios hechos por este usuario</Text>
      </VStack>
    );
  }

  return (
    <VStack>
      {comments.map((comment: Comment) => (
        <View key={comment.id}>
          <UserCommentCard
            comment={comment}
            contextMap={contextMap}
            onNavigateToReview={onNavigateToReview}
            onNavigateToDiscussion={onNavigateToDiscussion}
            onNavigateToSpot={onNavigateToSpot}
          />
        </View>
      ))}
    </VStack>
  );
};

export default UserCommentList;
