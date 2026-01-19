import { MediaCarousel } from "@/src/components/commons/media-carousel";
import { RatingStars } from "@/src/components/commons/rating/rating-stars";
import { SportsRatingTable } from "@/src/components/commons/sports-rating-table/sports-rating-table";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Card } from "@/src/components/ui/card";
import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Review } from "@/src/entities/review/model/review";
import { User } from "@/src/entities/user/model/user";
import { useMediaUrls } from "@/src/hooks";
import { useAllSportsMap } from "@/src/hooks/use-sports";
import { formatDate, getInitials } from "@/src/utils/date-utils";
import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

interface ProfileReviewCardProps {
  review: Review;
  user?: User;
  spotName?: string;
  getSportName?: (sportId: string) => string | undefined;
  onNavigate?: (reviewId: string, spotId: string) => void;
}

export const ProfileReviewCard: React.FC<ProfileReviewCardProps> = ({
  review,
  user,
  spotName,
  getSportName,
  onNavigate,
}) => {
  const reviewDate = formatDate(review.metadata.createdAt);
  const userName =
    user?.userDetails?.userName || user?.userDetails?.fullName || "User";
  const userPhoto = user?.userDetails?.photoURL;
  const { urls: mediaUrls, loading: mediaLoading } = useMediaUrls(
    review.details.media || []
  );
  const { getSportName: globalGetSportName } = useAllSportsMap();

  const likes = review.activity?.likesCount ?? 0;
  const dislikes = review.activity?.dislikesCount ?? 0;
  const comments = review.activity?.commentsCount ?? 0;

  const handlePress = () => {
    if (onNavigate) onNavigate(review.id, review.details.spotId);
  };

  return (
    <Pressable onPress={handlePress}>
      <Card className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3">
        <HStack className="justify-between items-start mb-2">
          <HStack className="gap-3 items-center">
            <Avatar size="sm" className="bg-blue-100 border border-blue-200">
              {userPhoto ? (
                <AvatarImage source={{ uri: userPhoto }} />
              ) : (
                <AvatarFallbackText className="text-blue-700 font-semibold">
                  {getInitials(userName)}
                </AvatarFallbackText>
              )}
            </Avatar>
            <VStack className="gap-0.5">
              <Text className="text-sm font-semibold text-gray-900">
                {userName}
              </Text>
              <Text className="text-xs text-gray-500">{reviewDate}</Text>
              {spotName && (
                <Text className="text-xs text-blue-600 font-medium">
                  {spotName}
                </Text>
              )}
            </VStack>
          </HStack>
          {review.details.rating != null && (
            <VStack className="items-end">
              <RatingStars
                rating={review.details.rating}
                maxStars={5}
                size="sm"
              />
              <Text className="text-sm font-semibold text-gray-800">
                {review.details.rating.toFixed(1)} ⭐
              </Text>
            </VStack>
          )}
        </HStack>

        <VStack className="gap-1 mb-3">
          {(() => {
            const content = review.details.content || "";
            const lines = content.split("\n");
            const headlineRaw = lines[0] || "Review";
            const headline =
              headlineRaw.length > 70
                ? `${headlineRaw.slice(0, 67)}...`
                : headlineRaw;
            const remainder = lines.slice(1).join("\n");
            return (
              <>
                <Text
                  className="text-sm text-gray-900 font-semibold"
                  numberOfLines={2}
                >
                  {headline}
                </Text>
                {remainder ? (
                  <Text className="text-sm text-gray-700" numberOfLines={3}>
                    {remainder}
                  </Text>
                ) : null}
              </>
            );
          })()}
        </VStack>

        {mediaUrls.length > 0 && (
          <View className="pt-3">
            <MediaCarousel
              media={mediaUrls}
              altText={`Review by ${userName}`}
              height={90}
              width={160}
              resizeMode="contain"
              loading={mediaLoading}
            />
          </View>
        )}

        {review.details.reviewSports &&
          review.details.reviewSports.length > 0 && (
            <VStack className="gap-2 w-full mt-3">
              <Text className="text-sm font-semibold text-gray-700">
                Rated Sports:
              </Text>
              <View className="border border-gray-200 rounded-lg overflow-hidden w-full">
                <SportsRatingTable
                  sports={review.details.reviewSports.map((sport) => ({
                    sportId: sport.sportId,
                    sportName:
                      (getSportName
                        ? getSportName(sport.sportId)
                        : globalGetSportName(sport.sportId)) ?? sport.sportId,
                    rating: sport.sportRating,
                    difficulty: sport.difficulty,
                    sportComment: sport.comment,
                  }))}
                  variant="compact"
                  expandableContent="comment"
                  showHeader={true}
                  size="sm"
                />
              </View>
            </VStack>
          )}

        <HStack className="mt-3 items-center justify-between">
          <HStack className="gap-4 items-center">
            <HStack className="items-center gap-1">
              <ThumbsUp size={16} color="#16a34a" strokeWidth={2} />
              <Text className="text-xs text-gray-700">{likes}</Text>
            </HStack>
            <HStack className="items-center gap-1">
              <ThumbsDown size={16} color="#ef4444" strokeWidth={2} />
              <Text className="text-xs text-gray-700">{dislikes}</Text>
            </HStack>
            <HStack className="items-center gap-1">
              <MessageCircle size={16} color="#2563eb" strokeWidth={2} />
              <Text className="text-xs text-gray-700">{comments}</Text>
            </HStack>
          </HStack>
          <Text className="text-xs text-blue-600">View post</Text>
        </HStack>
      </Card>
    </Pressable>
  );
};
