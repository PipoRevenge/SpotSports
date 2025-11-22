import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Input, InputField } from "@/src/components/ui/input";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/context/user-context";
import { formatDate, getInitials } from "@/src/utils/date-utils";
// No router import inside feature. Navigation should be handled by the app and passed via props.
import { useAppAlert } from '@/src/context/app-alert-context';
import { ChevronDown, ChevronUp, MessageCircle, Send, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useReviewComments } from "../../hooks/use-review-comments";
import { CommentWithUser } from "../../types/comment-types";

interface ReviewCommentsProps {
  reviewId: string;
  initialCommentsCount?: number;
  onNavigateToProfile?: (userId: string) => void;
}

/**
 * Componente para mostrar y gestionar comentarios de una review
 * con paginación y carga incremental
 */
export const ReviewComments: React.FC<ReviewCommentsProps> = ({
  reviewId,
  initialCommentsCount = 0,
  onNavigateToProfile,
}) => {
  const { user: currentUser } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    comments,
    totalComments,
    loading,
    error,
    hasMore,
    loadMore,
    addComment,
    deleteComment,
    voteComment,
    removeCommentVote,
    getCommentVote,
  } = useReviewComments(reviewId);

  /**
   * Manejar envío de nuevo comentario
   */
  const { showError, showConfirm } = useAppAlert();
  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addComment(newComment);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      showError("No se pudo añadir el comentario", 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Manejar eliminación de comentario
   */
  const handleDelete = (commentId: string) => {
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
  };

  const displayCount = totalComments || initialCommentsCount;

  // Si no hay comentarios, mostrar botón simple
  if (displayCount === 0 && !isExpanded) {
    return (
      <Pressable
          onPress={() => setIsExpanded(true)}
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
          {/* Input para nuevo comentario */}
          {currentUser && (
            <HStack className="gap-2 items-center">
              <Avatar size="sm">
                {currentUser.userDetails.photoURL ? (
                  <AvatarImage source={{ uri: currentUser.userDetails.photoURL }} />
                ) : (
                  <AvatarFallbackText>
                    {getInitials(currentUser.userDetails.userName)}
                  </AvatarFallbackText>
                )}
              </Avatar>
              <Input className="flex-1">
                <InputField
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Escribe un comentario..."
                  multiline
                  numberOfLines={2}
                />
              </Input>
              <Pressable
                onPress={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className={`p-2 rounded-full ${
                  newComment.trim() && !isSubmitting ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Send
                    size={16}
                    color={newComment.trim() ? "#FFF" : "#9CA3AF"}
                  />
                )}
              </Pressable>
            </HStack>
          )}

          {/* Lista de comentarios */}
          {loading && comments.length === 0 ? (
            <View className="py-4 items-center">
              <ActivityIndicator />
            </View>
          ) : error ? (
            <Text className="text-red-600 text-sm text-center py-2">{error}</Text>
          ) : (
            <>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isOwnComment={comment.createdBy === currentUser?.id}
                  onDelete={handleDelete}
                  onVote={voteComment}
                  onRemoveVote={removeCommentVote}
                  onGetVote={getCommentVote}
                  onNavigateToProfile={onNavigateToProfile}
                />
              ))}

              {/* Botón de cargar más */}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={loadMore}
                  disabled={loading}
                  className="self-center"
                >
                  {loading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <ButtonText>Cargar más comentarios</ButtonText>
                  )}
                </Button>
              )}
            </>
          )}
        </VStack>
      )}
    </VStack>
  );
};

/**
 * Componente individual de comentario
 */
interface CommentItemProps {
  comment: CommentWithUser;
  isOwnComment: boolean;
  onDelete: (commentId: string) => void;
  onVote: (commentId: string, isLike: boolean) => Promise<void>;
  onRemoveVote: (commentId: string) => Promise<void>;
  onGetVote: (commentId: string) => Promise<boolean | null>;
  onNavigateToProfile?: (userId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isOwnComment,
  onDelete,
  onVote,
  onRemoveVote,
  onGetVote,
  onNavigateToProfile,
}) => {
  const { user: currentUser } = useUser();
  const [localLikesCount, setLocalLikesCount] = useState(comment.likesCount || 0);
  const [localDislikesCount, setLocalDislikesCount] = useState(comment.dislikesCount || 0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Cargar voto del usuario al montar
  React.useEffect(() => {
    const loadUserVote = async () => {
      const vote = await onGetVote(comment.id);
      if (vote !== null) {
        setUserVote(vote ? 'like' : 'dislike');
      }
    };
    
    if (currentUser) {
      loadUserVote();
    }
  }, [comment.id, currentUser, onGetVote]);

  const handleNavigateToProfile = (targetUserId?: string) => {
    if (!targetUserId) return;
    if (onNavigateToProfile) {
      onNavigateToProfile(targetUserId);
    }
    // If no navigation handler is provided, do nothing (app code should provide it)
  };

  /**
   * Manejar voto en comentario
   */
  const handleVote = async (isLike: boolean) => {
    if (!currentUser || isVoting) return;

    try {
      setIsVoting(true);
      
      // Si el usuario ya votó lo mismo, quitar el voto
      if ((isLike && userVote === 'like') || (!isLike && userVote === 'dislike')) {
        await onRemoveVote(comment.id);
        
        // Actualizar contadores locales
        if (isLike) {
          setLocalLikesCount(prev => Math.max(0, prev - 1));
        } else {
          setLocalDislikesCount(prev => Math.max(0, prev - 1));
        }
        setUserVote(null);
      } else {
        // Si cambió de voto, ajustar contadores
        if (userVote === 'like') {
          setLocalLikesCount(prev => Math.max(0, prev - 1));
        } else if (userVote === 'dislike') {
          setLocalDislikesCount(prev => Math.max(0, prev - 1));
        }

        await onVote(comment.id, isLike);
        
        // Actualizar contadores locales
        if (isLike) {
          setLocalLikesCount(prev => prev + 1);
          setUserVote('like');
        } else {
          setLocalDislikesCount(prev => prev + 1);
          setUserVote('dislike');
        }
      }
    } catch (err) {
      console.error("Error voting comment:", err);
      showError("No se pudo registrar el voto", 'Error');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <HStack className="gap-2 py-2 border-b border-gray-100">
      <Pressable onPress={handleNavigateToProfile}>
        <Avatar size="sm" className="bg-gray-300">
          {comment.userProfileUrl ? (
            <AvatarImage source={{ uri: comment.userProfileUrl }} />
          ) : (
            <AvatarFallbackText className="text-gray-700">
              {getInitials(comment.userName || comment.createdBy)}
            </AvatarFallbackText>
          )}
        </Avatar>
      </Pressable>
      <VStack className="flex-1 gap-1">
        <HStack className="items-center justify-between">
          <Pressable onPress={handleNavigateToProfile}>
            <Text className="text-sm font-semibold text-gray-900">
              {comment.userName || comment.createdBy}
            </Text>
          </Pressable>
          {isOwnComment && (
            <Pressable onPress={() => onDelete(comment.id)}>
              <Trash2 size={14} color="#EF4444" />
            </Pressable>
          )}
        </HStack>
        <Text className="text-sm text-gray-700">{comment.content}</Text>
        
        {/* Votación y timestamp */}
          <HStack className="items-center gap-3 pt-1">
          <Text className="text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </Text>
          
          {currentUser && (
            <HStack className="items-center gap-2">
              {/* Like button */}
              <Pressable 
                onPress={() => handleVote(true)}
                disabled={isVoting}
                className="flex-row items-center gap-1"
              >
                <ThumbsUp
                  size={14}
                  color={userVote === 'like' ? "#3B82F6" : "#9CA3AF"}
                  fill={userVote === 'like' ? "#3B82F6" : "none"}
                />
                <Text className={`text-xs ${userVote === 'like' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                  {localLikesCount}
                </Text>
              </Pressable>

              {/* Dislike button */}
              <Pressable 
                onPress={() => handleVote(false)}
                disabled={isVoting}
                className="flex-row items-center gap-1"
              >
                <ThumbsDown
                  size={14}
                  color={userVote === 'dislike' ? "#EF4444" : "#9CA3AF"}
                  fill={userVote === 'dislike' ? "#EF4444" : "none"}
                />
                <Text className={`text-xs ${userVote === 'dislike' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {localDislikesCount}
                </Text>
              </Pressable>
            </HStack>
          )}
        </HStack>
      </VStack>
    </HStack>
  );
};
