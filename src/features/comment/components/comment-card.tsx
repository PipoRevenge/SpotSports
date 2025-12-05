import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { HStack } from '@/src/components/ui/hstack';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Comment, CommentSourceType } from '@/src/entities/comment/model/comment';
import { formatDate, getInitials } from '@/src/utils/date-utils';
import { ChevronDown, ChevronUp, MessageCircle, Play, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, View } from 'react-native';
import { useCommentVote } from '../hooks/use-comment-vote';

type CommentWithUser = Comment & { userName?: string; userProfileUrl?: string };

export type { CommentWithUser };

export interface CommentCardProps {
  comment: CommentWithUser;
  /** ID del contexto (spot) - usado para operaciones de voto */
  contextId: string;
  /** Tipo de recurso padre (review o discussion) */
  sourceType: CommentSourceType;
  /** ID del recurso padre (reviewId o discussionId) */
  sourceId: string;
  onDelete?: (commentId: string) => void;
  onReply?: (commentId: string, content: string, media?: string[], level?: number) => Promise<void>;
  onOpenReplyModal?: (comment: CommentWithUser) => void;
  onLoadReplies?: (commentId: string) => Promise<void>;
  replies?: CommentWithUser[];
  repliesHasMore?: boolean;
  repliesMap?: Record<string, { comments: CommentWithUser[]; page: number; total: number; hasMore: boolean }>;
  currentUserId?: string;
  isReply?: boolean;
  onReplyFocus?: () => void;
}

// Thread line colors - dark gray and SpotSport green alternating
const THREAD_COLORS = [
  '#374151', // dark gray (gray-700)
  '#22c55e', // green (SpotSport brand)
];

const getThreadColor = (level: number): string => {
  return THREAD_COLORS[level % THREAD_COLORS.length];
};

// URL regex pattern for detecting links
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Helper to parse text and create linked content
const LinkedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = String(text || '').split(URL_REGEX);
  
  return (
    <Text className="text-sm text-gray-700">
      {parts.map((part, index) => {
          if (URL_REGEX.test(part as string)) {
          // Reset regex lastIndex for next test
          URL_REGEX.lastIndex = 0;
          return (
            <Text
              key={index}
              className="text-blue-600 underline"
              onPress={() => Linking.openURL(part)}
            >
              {part}
            </Text>
          );
        }
          return <Text key={index}>{String(part)}</Text>;
      })}
    </Text>
  );
};

// Helper to check if a URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// Video placeholder component - shows play icon overlay on thumbnail
const VideoPlaceholder: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  return (
    <Pressable 
      onPress={onPress}
      style={{ 
        width: 80, 
        height: 80, 
        backgroundColor: '#1f2937',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8
      }}
    >
      <View style={{ 
        backgroundColor: 'rgba(255,255,255,0.9)', 
        borderRadius: 18, 
        padding: 8 
      }}>
        <Play size={18} color="#1f2937" />
      </View>
    </Pressable>
  );
};

export const CommentCard: React.FC<CommentCardProps> = memo(({ 
  comment, 
  contextId,
  sourceType,
  sourceId,
  onDelete,
  onReply,
  onOpenReplyModal,
  onLoadReplies,
  replies = [],
  repliesHasMore = false,
  repliesMap = {},
  currentUserId,
  isReply = false,
  onReplyFocus,
}) => {
  const canDelete = currentUserId && currentUserId === comment.userId;
  if (__DEV__) {
    try {
      console.log('[CommentCard] Rendering comment:', comment.id, 'contentType:', typeof comment.content);
    } catch (err) {
      console.warn(err);
    }
  }
  const canReply = !!currentUserId; // Allow replies on any comment (supports nested threading)
  
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  
  // Local state for vote counts
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [dislikesCount, setDislikesCount] = useState(comment.dislikesCount || 0);
  
  // Sync counts when comment changes
  useEffect(() => {
    setLikesCount(comment.likesCount || 0);
    setDislikesCount(comment.dislikesCount || 0);
  }, [comment.likesCount, comment.dislikesCount]);
  
  // Callback when vote changes
  const handleVoteChange = useCallback((newLikes: number, newDislikes: number) => {
    setLikesCount(newLikes);
    setDislikesCount(newDislikes);
  }, []);
  
  // Use the vote hook - handles toggle behavior automatically
  const { voteState, handleLike, handleDislike } = useCommentVote(
    contextId,
    sourceType,
    sourceId,
    comment.id,
    handleVoteChange,
    true // autoFetch
  );
  
  const commentDate = comment.createdAt ? formatDate(comment.createdAt) : '';
  
  const handleReplyPress = useCallback(() => {
    if (onOpenReplyModal) {
      onOpenReplyModal(comment);
    }
  }, [onOpenReplyModal, comment]);
  
  const handleToggleReplies = useCallback(async () => {
    if (!showReplies && replies.length === 0 && onLoadReplies) {
      setIsLoadingReplies(true);
      try {
        await onLoadReplies(comment.id);
      } catch (error) {
        console.error('Error loading replies:', error);
      } finally {
        setIsLoadingReplies(false);
      }
    }
    setShowReplies(prev => !prev);
  }, [showReplies, replies.length, onLoadReplies, comment.id]);
  
  const handleLoadMoreReplies = useCallback(async () => {
    if (!onLoadReplies) return;
    setIsLoadingReplies(true);
    try {
      await onLoadReplies(comment.id);
    } catch (error) {
      console.error('Error loading more replies:', error);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [onLoadReplies, comment.id]);
  
  const level = comment.level || 0;
  const threadColor = getThreadColor(level);
  
  return (
    <View style={{ flexDirection: 'row' }}>
      {/* Thread line for ALL comments - provides visual cohesion */}
      <Pressable 
        onPress={handleToggleReplies}
        style={{
          width: 20,
          alignItems: 'center',
          paddingTop: 4,
        }}
      >
        <View 
          style={{
            width: 2,
            flex: 1,
            backgroundColor: threadColor,
            borderRadius: 1,
            minHeight: 40,
          }}
        />
      </Pressable>
      
      {/* Comment Content */}
      <View style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 4 }}>
        <HStack className="gap-2">
          {/* Avatar */}
          <Avatar size="sm" className="bg-blue-100 border border-blue-200">
            {comment.userProfileUrl ? (
              <AvatarImage source={{ uri: comment.userProfileUrl }} />
            ) : (
              <AvatarFallbackText className="text-blue-700 font-semibold">
                {getInitials(comment.userName || comment.userId)}
              </AvatarFallbackText>
            )}
          </Avatar>
          
          {/* Content */}
          <VStack className="flex-1 gap-1">
            {/* Header: name and date */}
            <HStack className="justify-between items-center">
              <Text className="text-sm font-semibold text-gray-900">
                {comment.userName || 'Usuario'}
              </Text>
              <Text className="text-xs text-gray-400">
                {commentDate}
              </Text>
            </HStack>
            
            {/* Text content with linked URLs */}
            <LinkedText text={comment.content} />
            
            {/* Media Grid */}
            {comment.media && comment.media.length > 0 && (
              <HStack className="gap-2 flex-wrap pt-2">
                {comment.media.map((mediaUrl, index) => (
                  <View key={index} className="rounded-lg overflow-hidden">
                    {isVideoUrl(mediaUrl) ? (
                      <VideoPlaceholder onPress={() => Linking.openURL(mediaUrl)} />
                    ) : (
                      <Image
                        source={{ uri: mediaUrl }}
                        style={{ width: 80, height: 80, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                ))}
              </HStack>
            )}
            
            {/* Actions Row */}
            <HStack className="gap-2 items-center pt-2 flex-wrap">
              {/* Like Button */}
              <Pressable 
                className="flex-row items-center gap-1 px-2 py-1 rounded-full active:bg-blue-50"
                onPress={() => handleLike(likesCount, dislikesCount)}
                disabled={voteState.isVoting}
              >
                <ThumbsUp 
                  size={14} 
                  color={voteState.isLiked ? '#3b82f6' : '#9ca3af'} 
                  fill={voteState.isLiked ? '#3b82f6' : 'none'}
                />
                <Text className={`text-xs font-medium ${voteState.isLiked ? 'text-blue-600' : 'text-gray-400'}`}>
                  {likesCount}
                </Text>
              </Pressable>
              
              {/* Dislike Button */}
              <Pressable 
                className="flex-row items-center gap-1 px-2 py-1 rounded-full active:bg-red-50"
                onPress={() => handleDislike(likesCount, dislikesCount)}
                disabled={voteState.isVoting}
              >
                <ThumbsDown 
                  size={14} 
                  color={voteState.isDisliked ? '#ef4444' : '#9ca3af'}
                  fill={voteState.isDisliked ? '#ef4444' : 'none'}
                />
                <Text className={`text-xs font-medium ${voteState.isDisliked ? 'text-red-600' : 'text-gray-400'}`}>
                  {dislikesCount}
                </Text>
              </Pressable>
              
              {/* Reply Button */}
              {canReply && onOpenReplyModal && (
                <Pressable 
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full active:bg-gray-100"
                  onPress={handleReplyPress}
                >
                  <MessageCircle size={14} color="#9ca3af" />
                  <Text className="text-xs font-medium text-gray-400">
                    Responder
                  </Text>
                </Pressable>
              )}
              
              {/* Show Replies Button */}
              {comment.commentsCount > 0 && (
                <Pressable 
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full active:bg-gray-100"
                  onPress={handleToggleReplies}
                >
                  {showReplies ? (
                    <ChevronUp size={14} color="#6b7280" />
                  ) : (
                    <ChevronDown size={14} color="#6b7280" />
                  )}
                  <Text className="text-xs font-medium text-gray-500">
                    {comment.commentsCount} {comment.commentsCount === 1 ? 'respuesta' : 'respuestas'}
                  </Text>
                </Pressable>
              )}
              
              {/* Delete Button (only for owner) */}
              {canDelete && onDelete && (
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Pressable 
                    className="flex-row items-center gap-1 px-2 py-1 rounded-full active:bg-red-50"
                    onPress={() => onDelete(comment.id)}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </Pressable>
                </View>
              )}
            </HStack>
          </VStack>
        </HStack>
        
        {/* Replies Section */}
        {showReplies && (
          <VStack className="mt-2">
            {isLoadingReplies && replies.length === 0 && (
              <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 8 }} />
            )}
            
            {replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                contextId={contextId}
                sourceType={sourceType}
                sourceId={sourceId}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onReply={onReply}
                onOpenReplyModal={onOpenReplyModal}
                onLoadReplies={onLoadReplies}
                repliesMap={repliesMap}
                replies={repliesMap?.[reply.id]?.comments || []}
                repliesHasMore={repliesMap?.[reply.id]?.hasMore || false}
                isReply={true}
                onReplyFocus={onReplyFocus}
              />
            ))}
            
            {repliesHasMore && (
              <Pressable 
                className="py-2 items-center"
                onPress={handleLoadMoreReplies}
                disabled={isLoadingReplies}
              >
                {isLoadingReplies ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Text className="text-sm text-blue-600 font-medium">
                    Cargar más respuestas
                  </Text>
                )}
              </Pressable>
            )}
          </VStack>
        )}
      </View>
    </View>
  );
});

CommentCard.displayName = 'CommentCard';
