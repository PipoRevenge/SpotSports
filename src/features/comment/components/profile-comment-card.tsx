import { userRepository } from '@/src/api/repositories';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Card } from '@/src/components/ui/card';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Comment } from '@/src/entities/comment/model/comment';
import { CommentContext } from '@/src/features/comment/hooks/use-user-comments';
import { formatDateTime, getInitials } from '@/src/utils/date-utils';
import { FileText, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

export interface ProfileCommentCardProps {
  comment: Comment;
  contextMap: Map<string, CommentContext>;
  parentComments: Map<string, Comment>;
  getSportName?: (id: string) => string | undefined;
  onNavigateToReview?: (reviewId: string, spotId: string, commentId?: string, parentCommentId?: string) => void;
  onNavigateToDiscussion?: (discussionId: string, spotId: string, commentId?: string, parentCommentId?: string) => void;
}

export const ProfileCommentCard: React.FC<ProfileCommentCardProps> = ({
  comment,
  contextMap,
  parentComments,
  getSportName,
  onNavigateToReview,
  onNavigateToDiscussion,
}) => {
  const spot = contextMap.get(comment.contextId)?.spot;
  const sourceKey = `${comment.sourceType}-${comment.sourceId}`;
  const review = contextMap.get(sourceKey)?.review;
  const discussion = contextMap.get(sourceKey)?.discussion;
  const parentComment = parentComments.get(comment.id);
  const [authorUser, setAuthorUser] = React.useState<{ name?: string; photo?: string } | null>(null);

  const handlePress = () => {
    if (comment.sourceType === 'review' && onNavigateToReview) {
      onNavigateToReview(comment.sourceId, comment.contextId, comment.id, comment.parentId);
    } else if (comment.sourceType === 'discussion' && onNavigateToDiscussion) {
      onNavigateToDiscussion(comment.sourceId, comment.contextId, comment.id, comment.parentId);
    }
  };

  const sourceTitle = (() => {
    if (comment.sourceType === 'review' && review) {
      const content = review.details.content || '';
      return content.length > 40 ? `${content.substring(0, 40)}...` : content || 'Reseña';
    }
    if (comment.sourceType === 'discussion' && discussion) {
      return discussion.details.title || 'Discusión';
    }
    return comment.sourceType === 'review' ? 'Reseña' : 'Discusión';
  })();

  const SourceIcon = comment.sourceType === 'review' ? FileText : MessageCircle;

  const replyTargetLabel = React.useMemo(() => {
    if (comment.parentId && parentComment) return 'comentario';
    if (comment.sourceType === 'review') return 'reseña';
    if (comment.sourceType === 'discussion') return 'discusión';
    return comment.sourceType;
  }, [comment.parentId, parentComment, comment.sourceType]);

  // Parent comment user info
  const [parentUser, setParentUser] = React.useState<{ name?: string; photo?: string } | null>(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!parentComment) {
        if (mounted) setParentUser(null);
        return;
      }
      try {
        const u = await userRepository.getUserById(parentComment.userId);
        if (!mounted) return;
        setParentUser({ name: u?.userDetails?.userName || u?.userDetails?.fullName, photo: u?.userDetails?.photoURL });
      } catch {
        if (mounted) setParentUser(null);
      }
    })();
    return () => { mounted = false; };
  }, [parentComment]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await userRepository.getUserById(comment.userId);
        if (!mounted) return;
        setAuthorUser({ name: u?.userDetails?.userName || u?.userDetails?.fullName, photo: u?.userDetails?.photoURL });
      } catch {
        if (mounted) setAuthorUser(null);
      }
    })();
    return () => { mounted = false; };
  }, [comment.userId]);

  return (
    <Pressable onPress={handlePress}>
      <Card className="bg-white px-4 py-3 shadow-sm mb-3 rounded-xl">
        {/* Reply target label */}
        <Text className="text-xs text-gray-500 font-medium mb-2">{`Respondiendo a: ${replyTargetLabel}`}</Text>

        {/* Parent quote (moved above header) */}
        {parentComment && (
          <View className="bg-gray-50 border border-gray-100 rounded-md p-3 mb-3">
            <Text className="text-xs text-gray-500 font-medium mb-2">Respondiendo a:</Text>
            <HStack className="items-start gap-3 mb-1">
              <Avatar size="xs" className="bg-gray-100 border border-gray-200">
                {parentUser?.photo ? (
                  <AvatarImage source={{ uri: parentUser.photo }} />
                ) : (
                  <AvatarFallbackText className="text-gray-700 font-semibold">{getInitials(parentUser?.name || parentComment.userId)}</AvatarFallbackText>
                )}
              </Avatar>
              <VStack className="flex-1">
                <HStack className="items-center justify-between">
                  <Text className="text-sm font-semibold">{parentUser?.name || 'Usuario'}</Text>
                  <Text className="text-xs text-gray-400">{formatDateTime(parentComment.createdAt)}</Text>
                </HStack>
                <Text className="text-sm text-gray-700 italic mt-1" numberOfLines={3}>{parentComment.content}</Text>
              </VStack>
            </HStack>
          </View>
        )}

        {/* Header: author + full date-time + spot */}
        <HStack className="items-center justify-between mb-2">
          <HStack className="items-center gap-3">
            <Avatar size="sm" className="bg-blue-100 border border-blue-200">
              {authorUser?.photo ? (
                <AvatarImage source={{ uri: authorUser.photo }} />
              ) : (
                <AvatarFallbackText className="text-blue-700 font-semibold">{getInitials(authorUser?.name || comment.userId)}</AvatarFallbackText>
              )}
            </Avatar>
            <VStack>
              <Text className="text-sm font-semibold">{authorUser?.name || 'Usuario'}</Text>
              <Text className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</Text>
            </VStack>
          </HStack>
          <VStack className="items-end">
            {spot && <Text className="text-xs text-blue-600 font-medium">{spot.details.name}</Text>}
            <HStack className="items-center gap-1">
              <SourceIcon size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500">en: {sourceTitle}</Text>
            </HStack>
          </VStack>
        </HStack>

        {/* Current comment */}
        <Text className="text-xs text-gray-500 font-medium mb-1">Tu comentario</Text>
        <Text className="text-sm text-gray-800 mb-2">{comment.content}</Text>
        <Text className="text-xs text-gray-400 mb-3">{formatDateTime(comment.createdAt)}</Text>

        {/* Footer stats */}
        <HStack className="justify-end items-center gap-4">
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
      </Card>
    </Pressable>
  );
};
