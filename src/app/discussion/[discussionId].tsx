import { Button, ButtonText } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { HStack } from '@/src/components/ui/hstack';
import { Input, InputField } from '@/src/components/ui/input';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/context/user-context';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { CommentCard, CommentWithUser, ReplyModal, useComments } from '@/src/features/comment';
import { useDiscussionDetails, useDiscussionVote } from '@/src/features/discussion';
import { DiscussionHeader } from '@/src/features/discussion/components/discussion-view/discussion-header';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ImageIcon, MessageCircle, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Separate component for comment input to prevent re-renders
interface CommentInputProps {
  onSubmit: (content: string, media?: string[]) => Promise<void>;
}

const CommentInput = React.memo(function CommentInput({ onSubmit }: CommentInputProps) {
  const [newComment, setNewComment] = React.useState('');
  const [selectedMedia, setSelectedMedia] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setSelectedMedia(prev => [...prev, ...newUris].slice(0, 4));
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newComment.trim() && selectedMedia.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(newComment.trim(), selectedMedia.length > 0 ? selectedMedia : undefined);
      setNewComment('');
      setSelectedMedia([]);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-4 mx-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <VStack className="gap-3">
        <Text className="text-sm font-semibold text-gray-700">Añadir comentario</Text>
        <Input variant="outline" size="md" className="bg-gray-50 rounded-lg">
          <InputField
            placeholder="Escribe tu comentario..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            style={{ minHeight: 60 }}
          />
        </Input>
        
        {selectedMedia.length > 0 && (
          <HStack className="gap-2 flex-wrap">
            {selectedMedia.map((uri, index) => (
              <View key={index} style={{ position: 'relative' }}>
                <Image source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                <Pressable 
                  onPress={() => handleRemoveMedia(index)}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#ef4444',
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </HStack>
        )}
        
        <HStack className="justify-between items-center pt-2 border-t border-gray-100">
          <Pressable 
            onPress={handlePickMedia} 
            className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100"
          >
            <ImageIcon size={22} color="#6b7280" />
            <Text className="text-sm text-gray-600">Añadir imagen</Text>
          </Pressable>
          <Button 
            size="sm" 
            onPress={handleSubmit} 
            disabled={isSubmitting || (!newComment.trim() && selectedMedia.length === 0)}
            className="px-4"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <HStack className="items-center gap-2">
                <Send size={16} color="#fff" />
                <Text className="text-white font-medium">Enviar</Text>
              </HStack>
            )}
          </Button>
        </HStack>
      </VStack>
    </Card>
  );
});

// Separate component for discussion header to prevent re-renders
interface DiscussionInfoHeaderProps {
  discussion: Discussion;
  author?: import('@/src/entities/user/model/user').User | null;
  localLikes: number;
  localDislikes: number;
  voteState: { isLiked: boolean; isDisliked: boolean; isVoting: boolean };
  onLike: () => void;
  onDislike: () => void;
  isOwner: boolean;
  onEdit: () => void;
  commentsCount: number;
}

const DiscussionInfoHeader = React.memo(function DiscussionInfoHeader({ 
  discussion, 
  author,
  localLikes, 
  localDislikes, 
  voteState, 
  onLike, 
  onDislike,
  isOwner,
  onEdit,
  commentsCount,
}: DiscussionInfoHeaderProps) {
  return (
    <View style={{ padding: 12, backgroundColor: '#f9fafb' }}>
    <DiscussionHeader discussion={discussion} author={author} />
    
    <Card className="mt-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      <HStack className="gap-3 items-center justify-around">
        <Pressable 
          className="flex-row items-center gap-2 px-4 py-2 rounded-full active:bg-blue-50" 
          onPress={onLike}
          disabled={voteState.isVoting}
        >
          <ThumbsUp 
            size={20} 
            color={voteState.isLiked ? '#3b82f6' : '#6b7280'} 
            fill={voteState.isLiked ? '#3b82f6' : 'none'}
          />
          <Text className={`text-base font-semibold ${voteState.isLiked ? 'text-blue-600' : 'text-gray-600'}`}>
            {localLikes}
          </Text>
        </Pressable>
        <Pressable 
          className="flex-row items-center gap-2 px-4 py-2 rounded-full active:bg-red-50" 
          onPress={onDislike}
          
        >
          <ThumbsDown 
            size={20} 
            color={voteState.isDisliked ? '#ef4444' : '#6b7280'}
            fill={voteState.isDisliked ? '#ef4444' : 'none'}
          />
          <Text className={`text-base font-semibold ${voteState.isDisliked ? 'text-red-600' : 'text-gray-600'}`}>
            {localDislikes}
          </Text>
        </Pressable>
        
        <HStack className="items-center gap-2 px-4 py-2">
          <MessageCircle size={20} color="#6b7280" />
          <Text className="text-base font-semibold text-gray-600">
            {discussion?.activity?.commentsCount || 0}
          </Text>
        </HStack>
      </HStack>
    </Card>
    
    {isOwner && (
      <Button 
        variant="outline" 
        onPress={onEdit} 
        className="mt-3"
      >
        <ButtonText>Editar</ButtonText>
      </Button>
    )}
    
    <HStack className="mt-5 mb-1 items-center gap-2 px-1">
      <MessageCircle size={20} color="#374151" />
      <Text className="text-lg font-bold text-gray-800">Comentarios</Text>
      <Text className="text-sm text-gray-500">({commentsCount})</Text>
    </HStack>
  </View>
  );
});

export default function DiscussionPage() {
  const { discussionId } = useLocalSearchParams<{ discussionId: string }>();
  const { discussion, author, loading: discussionLoading } = useDiscussionDetails(discussionId);
  const [localLikes, setLocalLikes] = React.useState<number>(0);
  const [localDislikes, setLocalDislikes] = React.useState<number>(0);
  
  // Reply Modal State
  const [replyModalVisible, setReplyModalVisible] = React.useState(false);
  const [selectedCommentForReply, setSelectedCommentForReply] = React.useState<CommentWithUser | null>(null);
  
  const { voteState, handleLike, handleDislike } = useDiscussionVote(discussionId, (likes: number, dislikes: number) => {
    setLocalLikes(likes);
    setLocalDislikes(dislikes);
  }, true);
  const { user } = useUser();
  const router = useRouter();



  const { comments, loading, hasMore, loadMore, refresh, addComment, addReply, deleteComment, loadReplies, repliesMap } = useComments({ 
    parentId: discussionId!, 
    type: 'discussion', 
    pageSize: 10 
  });
  
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (discussion) {
      setLocalLikes(discussion.activity?.likesCount || 0);
      setLocalDislikes(discussion.activity?.dislikesCount || 0);
    }
  }, [discussion]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleSubmitComment = React.useCallback(async (content: string, media?: string[]) => {
    if (!user?.id) return;
    await addComment(content, media);
  }, [addComment, user?.id]);

  const handleCommentDelete = React.useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, [deleteComment]);

  const handleReply = React.useCallback(async (commentId: string, content: string, media?: string[], level?: number) => {
    try {
      await addReply(commentId, content, media, level);
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }, [addReply]);

  const handleLoadReplies = React.useCallback(async (commentId: string) => {
    try {
      await loadReplies(commentId);
    } catch (error) {
      console.error('Error loading replies:', error);
      throw error;
    }
  }, [loadReplies]);

  const handleLikePress = React.useCallback(() => {
    handleLike(localLikes, localDislikes);
  }, [handleLike, localLikes, localDislikes]);

  const handleDislikePress = React.useCallback(() => {
    handleDislike(localLikes, localDislikes);
  }, [handleDislike, localLikes, localDislikes]);

  const handleEditPress = React.useCallback(() => {
    if (discussion) {
      router.push(`/discussion/${discussion.id}/edit`);
    }
  }, [discussion, router]);

  // Reply Modal Handlers
  const handleOpenReplyModal = React.useCallback((comment: CommentWithUser) => {
    setSelectedCommentForReply(comment);
    setReplyModalVisible(true);
  }, []);

  const handleCloseReplyModal = React.useCallback(() => {
    setReplyModalVisible(false);
    setSelectedCommentForReply(null);
  }, []);

  const handleSubmitReply = React.useCallback(async (content: string, media?: string[]) => {
    if (!selectedCommentForReply) return;
    
    try {
      await addReply(
        selectedCommentForReply.id, 
        content, 
        media, 
        (selectedCommentForReply.level || 0) + 1
      );
      // Modal will be closed by the ReplyModal component on success
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }, [addReply, selectedCommentForReply]);

  const renderItem = React.useCallback(({ item, index }: { item: typeof comments[0]; index: number }) => {
    try {
      return (
        <CommentCard 
          comment={item} 
          currentUserId={user?.id}
          onDelete={handleCommentDelete}
          onReply={handleReply}
          onOpenReplyModal={handleOpenReplyModal}
          onLoadReplies={handleLoadReplies}
          repliesMap={repliesMap}
          replies={repliesMap[item.id]?.comments || []}
          repliesHasMore={repliesMap[item.id]?.hasMore || false}
          onReplyFocus={() => {
            // Scroll al item actual cuando se enfoca el input de respuesta
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
            }, 100);
          }}
        />
      );
    } catch (err) {
      throw err;
    }
  }, [user?.id, handleCommentDelete, handleReply, handleOpenReplyModal, handleLoadReplies, repliesMap]);

  const keyExtractor = React.useCallback((item: typeof comments[0]) => item.id, []);

  const handleEndReached = React.useCallback(() => {
    if (!loading && hasMore) loadMore();
  }, [loading, hasMore, loadMore]);

  if (discussionLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6"/>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!discussion) {
    return <SafeAreaView><View /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <FlatList
          ref={flatListRef}
          ListHeaderComponent={
            <>
              <DiscussionInfoHeader
                discussion={discussion}
                author={author}
                localLikes={localLikes}
                localDislikes={localDislikes}
                voteState={voteState}
                onLike={handleLikePress}
                onDislike={handleDislikePress}
                isOwner={user?.id === discussion.metadata.createdBy}
                onEdit={handleEditPress}
                commentsCount={comments.length}
              />
              {user?.id && <CommentInput onSubmit={handleSubmitComment} />}
            </>
          }
          data={comments}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          contentContainerStyle={{ paddingBottom: 100 }}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <Text className="text-center text-gray-500 mt-4">No hay comentarios aún. ¡Sé el primero en comentar!</Text>
            )
          }
        />
      </KeyboardAvoidingView>

      {/* Reply Modal */}
      {selectedCommentForReply && (
        <ReplyModal
          visible={replyModalVisible}
          onClose={handleCloseReplyModal}
          onSubmit={handleSubmitReply}
          parentComment={selectedCommentForReply}
        />
      )}
    </SafeAreaView>
  );
}
