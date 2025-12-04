import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Comment } from '@/src/entities/comment/model/comment';
import { formatDate, getInitials } from '@/src/utils/date-utils';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, X } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CommentWithUser = Comment & { userName?: string; userProfileUrl?: string };

export interface ReplyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, media?: string[]) => Promise<void>;
  /** Comment being replied to (for nested replies) */
  parentComment?: CommentWithUser;
  /** Custom header slot - use this to show a Review or other content instead of parent comment */
  headerSlot?: React.ReactNode;
  /** Title shown in the header bar */
  title?: string;
  /** Placeholder text for the input */
  placeholder?: string;
  isSubmitting?: boolean;
}

/**
 * Default header component showing the parent comment
 */
const DefaultCommentHeader: React.FC<{ comment: CommentWithUser }> = ({ comment }) => {
  const commentDate = comment.createdAt ? formatDate(comment.createdAt) : '';
  
  return (
    <View className="px-4 py-4 bg-gray-50 border-b border-gray-100">
      <HStack className="items-start gap-3">
        <Avatar size="md" className="bg-blue-100 border border-blue-200">
          {comment.userProfileUrl ? (
            <AvatarImage source={{ uri: comment.userProfileUrl }} />
          ) : (
            <AvatarFallbackText className="text-blue-700 font-semibold">
              {getInitials(comment.userName || comment.userId)}
            </AvatarFallbackText>
          )}
        </Avatar>

        <VStack className="flex-1 gap-1">
          <HStack className="items-center gap-2">
            <Text className="text-sm font-semibold text-gray-900">
              {comment.userName || 'Usuario'}
            </Text>
            <Text className="text-xs text-gray-400">
              • {commentDate}
            </Text>
          </HStack>

          <Text 
            className="text-sm text-gray-600"
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {comment.content}
          </Text>
        </VStack>
      </HStack>

      <HStack className="items-center mt-3 pt-3 border-t border-gray-200">
        <Text className="text-xs text-gray-500">
          Respondiendo a{' '}
          <Text className="font-semibold text-blue-600">
            @{comment.userName || 'Usuario'}
          </Text>
        </Text>
      </HStack>
    </View>
  );
};

export const ReplyModal: React.FC<ReplyModalProps> = memo(({
  visible,
  onClose,
  onSubmit,
  parentComment,
  headerSlot,
  title = 'Responder',
  placeholder = 'Escribe tu respuesta...',
  isSubmitting = false,
}) => {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const isSubmittingState = isSubmitting || localSubmitting;
  const canSubmit = (content.trim().length > 0 || media.length > 0) && !isSubmittingState;

  const handlePickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setMedia(prev => [...prev, ...newUris].slice(0, 4));
    }
  }, []);

  const handleRemoveMedia = useCallback((index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setLocalSubmitting(true);
    try {
      await onSubmit(content.trim(), media.length > 0 ? media : undefined);
      // Reset state on success
      setContent('');
      setMedia([]);
      onClose();
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setLocalSubmitting(false);
    }
  }, [canSubmit, content, media, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmittingState) {
      setContent('');
      setMedia([]);
      onClose();
    }
  }, [isSubmittingState, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View 
        style={{ 
          flex: 1, 
          backgroundColor: '#ffffff',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <HStack 
            className="items-center justify-between px-4 py-3 border-b border-gray-200"
            style={{ minHeight: 56 }}
          >
            {/* Close Button */}
            <Pressable
              onPress={handleClose}
              disabled={isSubmittingState}
              className="p-2 -ml-2 rounded-full active:bg-gray-100"
            >
              <X size={24} color={isSubmittingState ? '#d1d5db' : '#374151'} />
            </Pressable>

            {/* Title */}
            <Text className="text-base font-semibold text-gray-900">
              {title}
            </Text>

            {/* Submit Button */}
            <Button
              size="sm"
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`px-4 ${canSubmit ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              {isSubmittingState ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ButtonText className="text-white font-semibold">Publicar</ButtonText>
              )}
            </Button>
          </HStack>

          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Slot - either custom slot or default comment header */}
            {headerSlot ? headerSlot : parentComment ? (
              <DefaultCommentHeader comment={parentComment} />
            ) : null}

            {/* Media Section */}
            <View className="px-4 py-4 border-b border-gray-100">
              <Pressable
                onPress={handlePickMedia}
                disabled={isSubmittingState || media.length >= 4}
                className="flex-row items-center gap-2 py-3 px-4 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <ImageIcon 
                  size={22} 
                  color={media.length >= 4 ? '#d1d5db' : '#6b7280'} 
                />
                <Text className={`text-sm ${media.length >= 4 ? 'text-gray-400' : 'text-gray-600'}`}>
                  {media.length >= 4 
                    ? 'Límite de imágenes alcanzado' 
                    : 'Añadir fotos o videos (máx. 4)'
                  }
                </Text>
              </Pressable>

              {/* Media Preview Grid */}
              {media.length > 0 && (
                <HStack className="gap-3 flex-wrap mt-4">
                  {media.map((uri, index) => (
                    <View key={index} style={{ position: 'relative' }}>
                      <Image
                        source={{ uri }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                        }}
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => handleRemoveMedia(index)}
                        disabled={isSubmittingState}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#ef4444',
                          borderRadius: 14,
                          padding: 4,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 3,
                        }}
                      >
                        <X size={14} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </HStack>
              )}
            </View>

            {/* Text Input Section */}
            <View className="flex-1 px-4 py-4">
              <TextInput
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                editable={!isSubmittingState}
                style={{
                  flex: 1,
                  minHeight: 150,
                  fontSize: 16,
                  lineHeight: 24,
                  color: '#1f2937',
                  padding: 0,
                }}
                autoFocus
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

ReplyModal.displayName = 'ReplyModal';
