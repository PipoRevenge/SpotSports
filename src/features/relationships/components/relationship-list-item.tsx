import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/context/user-context";
import React from "react";
import { Pressable } from "react-native";
import { useFollow } from "../hooks/use-follow";
import { RelationshipListItemProps } from "../types/relationship-types";

export const RelationshipListItem: React.FC<RelationshipListItemProps> = ({
  user,
  onNavigateToProfile,
  onFollowChange,
}) => {
  const { user: currentUser } = useUser();
  const { isFollowing, isLoading, toggleFollow } = useFollow(user.id);

  const handleNavigate = () => {
    if (!onNavigateToProfile) return;
    onNavigateToProfile(user.id);
  };

  return (
    <HStack space="md" className="items-center p-3">
      <Pressable onPress={handleNavigate} style={{ flex: 1 }}>
        <HStack space="md" className="items-center">
          <Avatar size="md">
            {user.userDetails.photoURL ? (
              <AvatarImage source={{ uri: user.userDetails.photoURL }} />
            ) : (
              <AvatarFallbackText>
                {user.userDetails.fullName || user.userDetails.userName || "U"}
              </AvatarFallbackText>
            )}
          </Avatar>
          <VStack className="flex-1">
            <Text className="font-bold">
              {user.userDetails.fullName || "Name"}
            </Text>
            <Text className="text-gray-500">@{user.userDetails.userName}</Text>
          </VStack>
        </HStack>
      </Pressable>
      {currentUser?.id !== user.id && (
        <Button
          size="sm"
          variant={isFollowing ? "solid" : "outline"}
          onPress={async () => {
            const newState = await toggleFollow();
            if (onFollowChange) {
              onFollowChange(user.id, !!newState);
            }
          }}
          disabled={isLoading}
        >
          <ButtonText>{isFollowing ? "Following" : "Follow"}</ButtonText>
        </Button>
      )}
    </HStack>
  );
};
