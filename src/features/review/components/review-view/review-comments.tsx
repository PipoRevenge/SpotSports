import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from "@/src/context/user-context";
import { CommentCard, CommentWithUser, useComments } from '@/src/features/comment';
import { ChevronDown, ChevronUp, MessageCircle, Plus } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

export interface ReviewCommentsProps {
  reviewId: string;
  initialCommentsCount?: number;
  onNavigateToProfile?: (userId: string) => void;
  /** Slot for the reply modal - injected from app/ layer */
  replyModalSlot?: React.ReactNode;
  /** Callback when user wants to open reply modal for a comment */
  onOpenReplyModal?: (comment: CommentWithUser) => void;
  /** Callback when user wants to add a new comment to the review (opens modal with review header) */
  onOpenNewCommentModal?: () => void;
}

/**
 * Componente para mostrar y gestionar comentarios de una review
 * Usa slots para inyectar el modal desde app/ layer
 */
export const ReviewComments: React.FC<ReviewCommentsProps> = ({
  reviewId,
  initialCommentsCount = 0,
  onNavigateToProfile,
  replyModalSlot,
  onOpenReplyModal,
  onOpenNewCommentModal,
}) => {
  const { user: currentUser } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const { showError, showConfirm } = useAppAlert();

  // Use the shared comments hook
  const { 
    comments, 
    total: totalComments,
    loading, 
    error, 
    hasMore, 
    loadMore, 
    addReply,
    deleteComment,
    loadReplies,
    repliesMap,
  } = useComments({ 
    parentId: reviewId, 
    type: 'review', 
    pageSize: 10,
    autoLoad: true 
  });

  /**
   * Manejar eliminación de comentario
   */
  const handleDelete = useCallback((commentId: string) => {
    showConfirm('Eliminar Comentario', '¿Estás seguro de que quieres eliminar este comentario?', 'Eliminar', 'Cancelar')
      .then(async (confirmed) => {
        if (!confirmed) return;
        try {
          await deleteComment(commentId);
        } catch (err) {
          console.error("Error deleting comment:", err);
          showError('No se pudo eliminar el comentario', 'Error');
        }
      });
  }, [deleteComment, showConfirm, showError]);

  const handleReply = useCallback(async (commentId: string, content: string, media?: string[], level?: number) => {
    try {
      await addReply(commentId, content, media, level);
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }, [addReply]);

  const handleLoadReplies = useCallback(async (commentId: string) => {
    try {
      await loadReplies(commentId);
    } catch (error) {
      console.error('Error loading replies:', error);
      throw error;
    }
  }, [loadReplies]);

  const displayCount = totalComments || initialCommentsCount;

  // Si no hay comentarios y no está expandido, mostrar botón simple
  if (displayCount === 0 && !isExpanded) {
    return (
      <Pressable
        onPress={() => {
          setIsExpanded(true);
          if (onOpenNewCommentModal && currentUser) {
            onOpenNewCommentModal();
          }
        }}
        className="pt-3 py-2 px-3 bg-gray-50 rounded-lg"
      >
        <HStack className="items-center gap-2">
          <MessageCircle size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600">Añadir comentario</Text>
        </HStack>
      </Pressable>
    );
  }

  return (
    <VStack className="pt-3 gap-2">
      {/* Header con contador de comentarios */}
      {displayCount > 0 && (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="py-2 px-3 bg-gray-50 rounded-lg"
        >
          <HStack className="items-center justify-between">
            <HStack className="items-center gap-2">
              <MessageCircle size={16} color="#6B7280" />
              <Text className="text-sm text-gray-700 font-medium">
                {displayCount} {displayCount === 1 ? "comentario" : "comentarios"}
              </Text>
            </HStack>
            {isExpanded ? (
              <ChevronUp size={16} color="#6B7280" />
            ) : (
              <ChevronDown size={16} color="#6B7280" />
            )}
          </HStack>
        </Pressable>
      )}

      {/* Sección expandida de comentarios */}
      {isExpanded && (
        <VStack className="gap-3 pt-2">
          {/* Botón para añadir nuevo comentario */}
          {currentUser && onOpenNewCommentModal && (
            <Pressable
              onPress={onOpenNewCommentModal}
              className="flex-row items-center gap-2 py-3 px-4 bg-blue-50 rounded-xl active:bg-blue-100 border border-blue-100"
            >
              <Plus size={18} color="#3b82f6" />
              <Text className="text-sm text-blue-600 font-medium">Añadir comentario</Text>
            </Pressable>
          )}

          {/* Lista de comentarios */}
          {loading && comments.length === 0 ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="#3b82f6" />
            </View>
          ) : error ? (
            <Text className="text-red-600 text-sm text-center py-2">{error}</Text>
          ) : comments.length === 0 ? (
            <Text className="text-center text-gray-500 py-4">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </Text>
          ) : (
            <VStack className="gap-1">
              {comments.map((comment) => (
                <CommentCard 
                  key={comment.id}
                  comment={comment} 
                  currentUserId={currentUser?.id}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  onOpenReplyModal={onOpenReplyModal}
                  onLoadReplies={handleLoadReplies}
                  repliesMap={repliesMap}
                  replies={repliesMap[comment.id]?.comments || []}
                  repliesHasMore={repliesMap[comment.id]?.hasMore || false}
                />
              ))}
              
              {/* Botón de cargar más */}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={loadMore}
                  disabled={loading}
                  className="self-center mt-2"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <ButtonText>Cargar más comentarios</ButtonText>
                  )}
                </Button>
              )}
            </VStack>
          )}
        </VStack>
      )}

      {/* Reply Modal Slot - injected from app/ */}
      {replyModalSlot}
    </VStack>
  );
};

// Re-export CommentWithUser for convenience
export type { CommentWithUser };
