import { SportsRatingTable } from "@/src/components/commons/sports-rating-table/sports-rating-table";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Review } from "@/src/entities/review/model/review";
import { User } from "@/src/entities/user/model/user";
import { formatDate, getInitials } from "@/src/utils/date-utils";
import { Star } from "lucide-react-native";
import React from "react";
import { ScrollView, View } from "react-native";

export interface ReviewHeaderForModalProps {
  review: Review;
  reviewUser?: User;
  /** Función para obtener el nombre del deporte por ID */
  getSportName?: (sportId: string) => string;
}

/**
 * Header component to show review info in the ReplyModal
 * Used when adding a new comment to a review
 */
export const ReviewHeaderForModal: React.FC<ReviewHeaderForModalProps> = ({
  review,
  reviewUser,
  getSportName,
}) => {
  const userName =
    reviewUser?.userDetails?.userName ||
    reviewUser?.userDetails?.fullName ||
    "User";
  const userPhoto = reviewUser?.userDetails?.photoURL;
  const reviewDate = review.metadata.createdAt
    ? formatDate(review.metadata.createdAt)
    : "";
  const rating = review.details.rating;
  const reviewSports = review.details.reviewSports;

  return (
    <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-4 bg-amber-50 border-b border-amber-100">
        <HStack className="items-start gap-3">
          <Avatar size="md" className="bg-amber-100 border border-amber-200">
            {userPhoto ? (
              <AvatarImage source={{ uri: userPhoto }} />
            ) : (
              <AvatarFallbackText className="text-amber-700 font-semibold">
                {getInitials(userName)}
              </AvatarFallbackText>
            )}
          </Avatar>

          <VStack className="flex-1 gap-1">
            <HStack className="items-center gap-2">
              <Text className="text-sm font-semibold text-gray-900">
                {userName}
              </Text>
              <Text className="text-xs text-gray-400">• {reviewDate}</Text>
            </HStack>

            {/* Rating stars */}
            <HStack className="items-center gap-1 py-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  color="#f59e0b"
                  fill={i < Math.floor(rating) ? "#f59e0b" : "none"}
                />
              ))}
              <Text className="text-xs text-amber-700 font-medium ml-1">
                {rating.toFixed(1)}
              </Text>
            </HStack>

            {/* Review content preview */}
            {review.details.content && (
              <Text
                className="text-sm text-gray-600"
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {review.details.content}
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Tabla de deportes valorados */}
        {reviewSports && reviewSports.length > 0 && (
          <VStack className="mt-3 pt-3 border-t border-amber-200 gap-2">
            <Text className="text-xs font-semibold text-gray-700">
              Rated sports:
            </Text>
            <View className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <SportsRatingTable
                sports={reviewSports.map((sport) => ({
                  sportId: sport.sportId,
                  sportName: getSportName
                    ? getSportName(sport.sportId)
                    : sport.sportId,
                  rating: sport.sportRating,
                  difficulty: sport.difficulty,
                  sportComment: sport.comment,
                }))}
                variant="compact"
                showHeader={false}
                size="sm"
              />
            </View>
          </VStack>
        )}

        <HStack className="items-center mt-3 pt-3 border-t border-amber-200">
          <Text className="text-xs text-gray-500">
            Commenting on the review by{" "}
            <Text className="font-semibold text-amber-600">@{userName}</Text>
          </Text>
        </HStack>
      </View>
    </ScrollView>
  );
};
