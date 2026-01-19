import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import React from "react";
import { ActivityIndicator, FlatList, View as RNView } from "react-native";
import { RelationshipListProps } from "../types/relationship-types";
import { RelationshipListItem } from "./relationship-list-item";

export const RelationshipList: React.FC<RelationshipListProps> = ({
  users,
  onNavigateToProfile,
  isLoading,
  onLoadMore,
  isLoadingMore,
  onFollowChange,
}) => {
  if (!users || users.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-gray-500 text-center">No users yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      renderItem={({ item }) => (
        <RelationshipListItem
          user={item}
          onNavigateToProfile={onNavigateToProfile}
          onFollowChange={onFollowChange}
        />
      )}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (onLoadMore && !isLoadingMore && !isLoading) onLoadMore();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        onLoadMore ? (
          <RNView style={{ padding: 12, alignItems: "center" }}>
            {isLoadingMore && <ActivityIndicator size="small" />}
          </RNView>
        ) : null
      }
    />
  );
};
