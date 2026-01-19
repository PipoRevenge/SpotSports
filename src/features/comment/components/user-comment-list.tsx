import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Comment } from "@/src/entities/comment/model/comment";
import {
  CommentContext,
  useUserComments,
} from "@/src/features/comment/hooks/use-user-comments";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { ProfileCommentCard } from "./profile-comment-card";

export interface UserCommentListProps {
  userId: string | undefined;
  onNavigateToReview?: (
    reviewId: string,
    spotId: string,
    commentId?: string,
    parentCommentId?: string
  ) => void;
  onNavigateToDiscussion?: (
    discussionId: string,
    spotId: string,
    commentId?: string,
    parentCommentId?: string
  ) => void;
  onNavigateToSpot?: (spotId: string) => void;
  getSportName?: (id: string) => string | undefined;
}

interface UserCommentCardProps {
  comment: Comment;
  contextMap: Map<string, CommentContext>;
  parentComments: Map<string, Comment>;
  onNavigateToReview?: (
    reviewId: string,
    spotId: string,
    commentId?: string,
    parentCommentId?: string
  ) => void;
  onNavigateToDiscussion?: (
    discussionId: string,
    spotId: string,
    commentId?: string,
    parentCommentId?: string
  ) => void;
  onNavigateToSpot?: (spotId: string) => void;
  getSportName?: (id: string) => string | undefined;
}

const UserCommentCard: React.FC<UserCommentCardProps> = ({
  comment,
  contextMap,
  parentComments,
  getSportName,
  onNavigateToReview,
  onNavigateToDiscussion,
  onNavigateToSpot,
}) => {
  return (
    <ProfileCommentCard
      comment={comment}
      contextMap={contextMap}
      parentComments={parentComments}
      getSportName={getSportName}
      onNavigateToReview={onNavigateToReview}
      onNavigateToDiscussion={onNavigateToDiscussion}
    />
  );
};

export const UserCommentList: React.FC<UserCommentListProps> = ({
  userId,
  onNavigateToReview,
  onNavigateToDiscussion,
  onNavigateToSpot,
  getSportName,
}) => {
  const { comments, contextMap, loading, error, parentComments } =
    useUserComments(userId);

  if (loading) {
    return (
      <VStack className="items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="pt-4 text-gray-600">Loading comments...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-red-600">Error loading comments</Text>
        <Text className="pt-2 text-gray-600">{error}</Text>
      </VStack>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <VStack className="items-center justify-center p-8">
        <Text className="text-gray-600">No comments made by this user</Text>
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
            parentComments={parentComments}
            getSportName={getSportName}
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
