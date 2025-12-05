import { MediaCarousel } from "@/src/components/commons/media-carousel";
import { RatingStars } from "@/src/components/commons/rating/rating-stars";
import { SportsRatingTable } from "@/src/components/commons/sports-rating-table/sports-rating-table";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
import { Card } from "@/src/components/ui/card";
import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from "@/src/context/user-context";
import { Review } from "@/src/entities/review/model/review";
import { Spot } from '@/src/entities/spot/model/spot';
import { User } from "@/src/entities/user/model/user";
import { useMediaUrls } from "@/src/hooks";
import { formatDate, getInitials } from "@/src/utils/date-utils";
import { Image, View } from 'react-native';
// Import router is not allowed inside feature components; navigation must be handled by the app
import { Edit, MessageCircle, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react-native";
import React, { useState } from "react";

import type { CommentWithUser } from '@/src/features/comment';
import { useReviewVote } from "../../hooks/use-review-vote";
import { ReviewComments } from "./review-comments";

/**
 * Props del componente ReviewCard
 */
export interface ReviewCardProps {
  review: Review;
  spotId: string; // ID del spot (necesario para votos)
  user?: User; // Información del usuario que creó la review
  spot?: Spot; // Información del spot (opcional). Si se proporciona, se muestra en el header
  onNavigateToSpot?: (spotId: string) => void;
  getSportName?: (sportId: string) => string; // Función para obtener nombre del deporte
  onReply?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void; // Callback para editar review
  onDelete?: (reviewId: string) => void; // Callback para eliminar review
  onNavigateToProfile?: (userId: string) => void;
  // Comment slots and callbacks
  /** Slot for the reply modal - injected from app/ layer */
  commentModalSlot?: React.ReactNode;
  /** Callback when user wants to reply to a comment */
  onOpenReplyModal?: (comment: CommentWithUser, review: Review) => void;
  /** Callback when user wants to add a new comment to this review */
  onOpenNewCommentModal?: (review: Review) => void;
}

/**
 * Componente ReviewCard
 * 
 * Muestra una tarjeta de review con:
 * - Avatar del usuario
 * - Nombre del usuario
 * - Calificación del spot (estrellas)
 * - Contenido de la review
 * - Fecha de creación
 * - Botones de like/dislike
 * - Botón de responder
 * 
 * @example
 * ```tsx
 * <ReviewCard
 *   review={review}
 *   spotId={spotId}
 *   user={userData}
 *   onReply={(id) => handleReply(id)}
 * />
 * ```
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  spotId,
  user,
  spot,
  onNavigateToSpot,
  getSportName,
  onReply,
  onEdit,
  onDelete,
  onNavigateToProfile,
  commentModalSlot,
  onOpenReplyModal,
  onOpenNewCommentModal,
}) => {
  const { user: currentUser } = useUser();
  const userName = user?.userDetails?.userName || user?.userDetails?.fullName || "Usuario Anónimo";
  const userPhoto = user?.userDetails?.photoURL;
  const userId = user?.id || review.metadata.createdBy;
  const reviewDate = formatDate(review.metadata.createdAt);
  const isOwnReview = currentUser?.id === userId;

  // Resolver URLs de media
  const { urls: mediaUrls, loading: mediaLoading } = useMediaUrls(review.details.media);

  // Estado local para contadores de votos
  const [likesCount, setLikesCount] = useState(review.activity?.likesCount || 0);
  const [dislikesCount, setDislikesCount] = useState(review.activity?.dislikesCount || 0);

  // Sincronizar contadores cuando cambia la review (ej: después de recargar)
  React.useEffect(() => {
    setLikesCount(review.activity?.likesCount || 0);
    setDislikesCount(review.activity?.dislikesCount || 0);
  }, [review.activity?.likesCount, review.activity?.dislikesCount]);

  // Callback para actualizar contadores cuando cambia un voto
  const handleVoteChange = (newLikes: number, newDislikes: number) => {
    setLikesCount(newLikes);
    setDislikesCount(newDislikes);
  };

  // Hook para manejar votos (likes/dislikes)
  const { voteState, handleLike, handleDislike } = useReviewVote(
    spotId, 
    review.id, 
    handleVoteChange
  );

  /**
   * Navegar al perfil del usuario
   */
  const handleNavigateToProfile = () => {
    if (!userId) return;
    if (onNavigateToProfile) {
      onNavigateToProfile(userId);
      return;
    }
    // Fallback: no-op if no navigation handler is provided
  };

  /**
   * Manejar eliminación de review con confirmación
   */
  const { showConfirm } = useAppAlert();

  const handleDelete = () => {
    showConfirm('Eliminar Review', '¿Estás seguro de que quieres eliminar esta review? Esta acción no se puede deshacer.', 'Eliminar', 'Cancelar')
      .then((confirmed) => {
        if (!confirmed) return;
        if (onDelete) onDelete(review.id);
      });
  };

  return (
    <Card className="bg-white px-6 border border-gray-500 shadow-sm">
      <VStack className="gap-3">
        {/* Optional spot header for context when reviews are shown in user's activity lists */}
        {spot && (
          <Pressable onPress={() => onNavigateToSpot && onNavigateToSpot(spot.id)}>
            <HStack className="items-center gap-3 py-2">
              {/* Optionally display a small thumbnail if spot has media */}
              {spot.details.media && spot.details.media.length > 0 ? (
                <View className="w-12 h-12 rounded-lg overflow-hidden">
                  {/* Use Image from react-native for a simple thumbnail */}
                  <Image
                    source={{ uri: spot.details.media[0] }}
                    className="w-12 h-12 rounded-s bg-black"
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center">
                  <Text className="text-sm text-gray-600">SP</Text>
                </View>
              )}

              <VStack className="flex-1">
                <Text className="font-semibold text-gray-900">{spot.details.name}</Text>
                <Text className="text-sm text-gray-500">{spot.details.location?.latitude ? `${spot.details.location.latitude.toFixed(3)}, ${spot.details.location.longitude.toFixed(3)}` : ''}</Text>
              </VStack>
            </HStack>
          </Pressable>
        )}
        {/* Header: Avatar + Nombre + Rating */}
        <HStack className="justify-between items-start gap-2">
          
            <HStack className="gap-3 flex-1">
              <Pressable onPress={handleNavigateToProfile}>
              {/* Avatar */}
              <Avatar size="md" className="border-2 border-gray-200">
                {userPhoto ? (
                  <AvatarImage source={{ uri: userPhoto }} />
                ) : (
                  <AvatarFallbackText>{getInitials(userName)}</AvatarFallbackText>
                )}
              </Avatar>
              </Pressable>
              {/* Nombre y fecha */}
              <VStack className="flex-1 gap-1 ">
                <Text className="font-semibold text-gray-900 text-base">
                  {userName}
                </Text>
                <Text className="text-sm text-gray-500">
                  {reviewDate}
                </Text>
              </VStack>
                </HStack>
              
          
          
            

          {/* Rating con estrellas */}
          <VStack className="items-end gap-1">
            <RatingStars
              rating={review.details.rating}
              maxStars={5}
              size="sm"
              disabled={true}
              showValue={false}
            />
            <Text className="text-xs text-gray-600">
              {review.details.rating.toFixed(1)} / 5.0
            </Text>
          </VStack>
        </HStack>

        {/* Contenido de la review */}
        {review.details.content && (
          <Text className="text-gray-700 text-base leading-6">
            {review.details.content}
          </Text>
        )}

        {/* Carrusel de media (imágenes y videos) */}
        {review.details.media && review.details.media.length > 0 && (
          <View className="pt-3">
            <MediaCarousel
              media={mediaUrls}
              altText={`Review de ${userName}`}
              height={90}
              width={160}
              resizeMode="contain"
              loading={mediaLoading}
            />
          </View>
        )}

        {/* Tabla de deportes calificados */}
        {review.details.reviewSports && review.details.reviewSports.length > 0 && (
          <VStack className="gap-2 w-full">
            <Text className="text-sm font-semibold text-gray-700">Deportes calificados:</Text>
              <View className="border border-gray-200 rounded-lg overflow-hidden w-full">
              <SportsRatingTable
                sports={review.details.reviewSports.map(sport => ({
                  sportId: sport.sportId,
                  sportName: getSportName ? getSportName(sport.sportId) : sport.sportId,
                  rating: sport.sportRating,
                  difficulty: sport.difficulty,
                  sportComment: sport.comment, // Pasar el comentario del deporte
                }))}
                variant="compact"
                expandableContent="comment"
                showHeader={true}
                size="sm"
              />
            </View>
          </VStack>
        )}

        {/* Separador */}
        <View className="h-px bg-gray-200" />

        {/* Footer: Botones de interacción */}
        <HStack className="justify-between items-center pb-4">
          {/* Like y Dislike */}
          <HStack className="gap-4">
            {/* Botón Like */}
            <Pressable
              onPress={() => handleLike(likesCount, dislikesCount)}
              disabled={voteState.isVoting}
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100"
            >
              <ThumbsUp
                size={18}
                color={voteState.isLiked ? "#3b82f6" : "#6b7280"}
                fill={voteState.isLiked ? "#3b82f6" : "none"}
              />
              <Text className={`text-sm font-medium ${voteState.isLiked ? "text-blue-600" : "text-gray-600"}`}>
                {likesCount}
              </Text>
            </Pressable>

            {/* Botón Dislike */}
            <Pressable
              onPress={() => handleDislike(likesCount, dislikesCount)}
              disabled={voteState.isVoting}
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100"
            >
              <ThumbsDown
                size={18}
                color={voteState.isDisliked ? "#ef4444" : "#6b7280"}
                fill={voteState.isDisliked ? "#ef4444" : "none"}
              />
              <Text className={`text-sm font-medium ${voteState.isDisliked ? "text-red-600" : "text-gray-600"}`}>
                {dislikesCount}
              </Text>
            </Pressable>
          </HStack>

          {/* Botones de acción */}
          <HStack className="gap-2">
            {/* Botón Editar (solo si es la review del usuario) */}
            {isOwnReview && onEdit && (
              <Pressable
                onPress={() => onEdit(review.id)}
                className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100"
              >
                <Edit size={18} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-600">
                  Editar
                </Text>
              </Pressable>
            )}
            
            {/* Botón Eliminar (solo si es la review del usuario) */}
            {isOwnReview && onDelete && (
              <Pressable
                onPress={handleDelete}
                className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100"
              >
                <Trash2 size={18} color="#ef4444" />
                <Text className="text-sm font-medium text-red-600">
                  Eliminar
                </Text>
              </Pressable>
            )}
            
            {/* Botón Responder */}
            {!isOwnReview && (
              <Pressable
                onPress={() => onReply && onReply(review.id)}
                className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100"
              >
                <MessageCircle size={18} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-600">
                  Responder
                </Text>
              </Pressable>
            )}
          </HStack>
        </HStack>

        {/* Sección de comentarios */}
        <ReviewComments
          reviewId={review.id}
          spotId={spotId}
          initialCommentsCount={review.activity?.commentsCount || 0}
          onNavigateToProfile={onNavigateToProfile}
          replyModalSlot={commentModalSlot}
          onOpenReplyModal={onOpenReplyModal ? (comment) => onOpenReplyModal(comment, review) : undefined}
          onOpenNewCommentModal={onOpenNewCommentModal ? () => onOpenNewCommentModal(review) : undefined}
        />
      </VStack>
    </Card>
  );
};
