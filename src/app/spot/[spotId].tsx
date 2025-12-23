import { MapMarker, MapView } from "@/src/components/commons/map";
import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import { useUser } from "@/src/context/user-context";
import { Review } from "@/src/entities/review/model/review";
import {
  CommentWithUser,
  ReplyModal,
  ReviewHeaderForModal,
  useComments,
} from "@/src/features/comment";
import { DiscussionCard, useDiscussionLoad } from "@/src/features/discussion";
import { MeetupList } from "@/src/features/meetup";
import { ReviewList, useReviewDelete } from "@/src/features/review";
import { SpotSportsTable } from "@/src/features/sport";
import { SpotDataDetails, useSelectedSpot } from "@/src/features/spot";
import { SpotCollectionButton } from "@/src/features/spot-collection/components/spot-collection-button";
import { SpotCollectionModal } from "@/src/features/spot-collection/components/spot-collection-modal";
import { useSpotCollection } from "@/src/features/spot-collection/hooks/use-spot-collection";
import { HStack } from "@components/ui/hstack";
import { Icon } from "@components/ui/icon";
import { SafeAreaView } from "@components/ui/safe-area-view";
import { Text } from "@components/ui/text";
import { VStack } from "@components/ui/vstack";
import { router, useLocalSearchParams } from "expo-router";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Heart,
  MessageSquare,
  Target,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  UIManager,
  View,
} from "react-native";

export const SpotPage = () => {
  const params = useLocalSearchParams();
  const spotId = params.spotId as string | undefined;
  const targetReviewId = params.reviewId as string | undefined;
  const targetCommentId = params.commentId as string | undefined;
  const targetParentCommentId = params.parentCommentId as string | undefined;

  const [isSportsTableVisible, setIsSportsTableVisible] = useState(true);
  const [sortBy, setSortBy] = useState<
    "recent" | "oldest" | "rating-high" | "rating-low"
  >("recent");
  const [sportFilter, setSportFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"reviews" | "discussions" | "meetups">(
    "reviews"
  );

  // Reply modal state for review comments
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedParentComment, setSelectedParentComment] =
    useState<CommentWithUser | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isNewComment, setIsNewComment] = useState(false); // true = new comment on review, false = reply to comment

  // Usar el contexto de Spot Seleccionado que incluye todo
  const {
    selectedSpot,
    sportRatings,
    availableSports,
    reviews,
    totalReviews,
    usersData,
    loadingSpot,
    loadingReviews,
    spotError,
    reviewsError,
    selectSpot,
    refreshAll,
    clearReviewsCache,
    discussionRefreshCount,
  } = useSelectedSpot();

  // Cargar el spot y reviews cuando se monta el componente
  // SIEMPRE con shouldLoadReviews: true para asegurar que las reviews se carguen
  useEffect(() => {
    if (spotId) {
      console.log('[SpotPage] Mounting with spotId:', spotId, 'forcing review load');
      // Siempre seleccionar con shouldLoadReviews: true para cargar reviews
      selectSpot(spotId, true);
    }
  }, [spotId, selectSpot]);

  // Filters controls exposed by MeetupList
  const [meetupFiltersControls, setMeetupFiltersControls] = useState<{
    open: () => void;
    getActiveFilters: () => number;
  } | null>(null);

  const FiltersButton = () => {
    const count = meetupFiltersControls?.getActiveFilters() ?? 0;
    return (
      <View className="relative">
        <Button
          onPress={() => meetupFiltersControls?.open()}
          variant="solid"
          action="default"
          size="sm"
          className="rounded-full p-2 bg-gray-100"
        >
          <ButtonIcon as={Filter} className="text-blue-600 h-5 w-5" />
        </Button>
        {count > 0 ? (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">{count}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  // When deep-linking to a comment inside a review, attempt to scroll to its measured position
  React.useEffect(() => {
    if (!targetCommentId) return;
    let attempts = 0;
    const tryScroll = () => {
      attempts++;
      const y = layoutMapRef.current.get(targetCommentId);
      if (y != null && scrollViewRef.current) {
        // Scroll to position with some offset for header
        // @ts-ignore
        scrollViewRef.current.scrollTo({ y: Math.max(0, y - 80), animated: true });
      } else if (attempts < 8) {
        setTimeout(tryScroll, 300);
      }
    };
    setTimeout(tryScroll, 400);
  }, [targetCommentId]);

  

  // Hook de eliminación
  const { deleteReview, isLoading: isDeleting } = useReviewDelete(async () => {
    await refreshAll();
  });

  // Spot Collection logic
  const {
    categories,
    isLoading: isCollectionLoading,
    addToCategories,
    removeFromCategories,
  } = useSpotCollection(spotId);

  const [modalVisible, setModalVisible] = useState(false);

  const handleCollectionButtonPress = () => {
    setModalVisible(true);
  };

  const handleToggleCategory = async (
    category: import("@/src/entities/user/model/spot-collection").SpotCategory
  ) => {
    const isInCategory = categories.includes(category);
    if (isInCategory) {
      return await removeFromCategories([category]);
    } else {
      return await addToCategories([category]);
    }
  };

  /**
   * Función helper para obtener el nombre de un deporte por su ID
   */
  const getSportName = (sportId: string): string => {
    const sport = sportRatings.find((sr) => sr.sportId === sportId);
    return sport?.sportName || "Deporte desconocido";
  };

  const toggleSportsTableVisibility = () => {
    setIsSportsTableVisible(!isSportsTableVisible);
  };

  /**
   * Navegar a la página de edición de review
   */
  const handleEditReview = (reviewId: string) => {
    if (!spotId) return;

    router.push({
      pathname: `/spot/${spotId}/review/edit-review` as any,
      params: {
        reviewId,
        spotSports: JSON.stringify(availableSports),
      },
    });
  };

  /**
   * Eliminar review
   */
  const handleDeleteReview = async (reviewId: string) => {
    if (!spotId) return;

    try {
      await deleteReview(reviewId, spotId);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleCreateReview = () => {
    if (!spotId) return;
    router.push({
      pathname: `/spot/${spotId}/review/create-review` as any,
      params: {
        spotSports: JSON.stringify(availableSports),
      },
    });
  };

  const { user } = useUser();
  const { discussions, refresh: refreshDiscussions } = useDiscussionLoad({ pageSize: 6, spotId });

  useEffect(() => {
    if (!spotId) return;
    if (!discussionRefreshCount) return;
    refreshDiscussions();
  }, [discussionRefreshCount, spotId, refreshDiscussions]);
  const handleNavigateToProfile = (userIdToNavigate: string) => {
    if (!userIdToNavigate) return;
    if (userIdToNavigate === user?.id) {
      router.push("/home-tabs/my-profile");
    } else {
      router.push(`/profile/${userIdToNavigate}`);
    }
  };

  // Comments hook for the selected review - only load when needed
  const { addComment, addReply } = useComments({
    contextId: spotId || '',
    sourceType: "review",
    sourceId: selectedReview?.id || "",
    autoLoad: false,
  });

  // ScrollView ref and layout map for precise deep-link scrolling
  const scrollViewRef = React.useRef<ScrollView>(null);
  const layoutMapRef = React.useRef<Map<string, number>>(new Map());
  const registerLayout = React.useCallback((id: string, node: any) => {
    const attempt = (tries: number) => {
      try {
        const containerHandle = findNodeHandle(scrollViewRef.current as any);
        const nodeHandle = findNodeHandle(node);
        if (!nodeHandle || !containerHandle) {
          if (tries < 3) setTimeout(() => attempt(tries + 1), 200);
          return;
        }
        if (UIManager && typeof UIManager.measureLayout === 'function') {
          // @ts-ignore
          UIManager.measureLayout(nodeHandle, containerHandle, () => {
            if (tries < 3) setTimeout(() => attempt(tries + 1), 200);
          }, (x: number, y: number) => {
            layoutMapRef.current.set(id, y);
          });
        }
      } catch {
        if (tries < 3) setTimeout(() => attempt(tries + 1), 200);
      }
    };
    attempt(0);
  }, []);

  // Handlers for comment modals
  const handleOpenReplyModal = useCallback(
    (comment: CommentWithUser, review: Review) => {
      setSelectedParentComment(comment);
      setSelectedReview(review);
      setIsNewComment(false);
      setReplyModalVisible(true);
    },
    []
  );

  const handleOpenNewCommentModal = useCallback((review: Review) => {
    setSelectedParentComment(null);
    setSelectedReview(review);
    setIsNewComment(true);
    setReplyModalVisible(true);
  }, []);

  const handleCloseReplyModal = useCallback(() => {
    setReplyModalVisible(false);
    setSelectedParentComment(null);
    setSelectedReview(null);
    setIsNewComment(false);
  }, []);

  const handleSubmitComment = useCallback(
    async (content: string, media?: string[]) => {
      if (!selectedReview) return;

      if (isNewComment) {
        // New comment on the review
        await addComment(content, media);
      } else if (selectedParentComment) {
        // Reply to an existing comment
        await addReply(
          selectedParentComment.id,
          content,
          media,
          (selectedParentComment.level || 0) + 1
        );
      }

      // Refresh to show new comment
      await refreshAll();
    },
    [
      selectedReview,
      isNewComment,
      selectedParentComment,
      addComment,
      addReply,
      refreshAll,
    ]
  );

  if (loadingSpot) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="pt-4 text-gray-600">Loading spot details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (spotError) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-600 text-lg font-semibold">Error</Text>
          <Text className="pt-2 text-gray-600 text-center">{spotError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedSpot) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-gray-600 text-lg">Spot not found</Text>
          <Text className="text-gray-500 text-sm pt-2">
            {spotId ? `ID: ${spotId}` : "No spot ID provided"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Detalles del spot */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <SpotDataDetails
                spot={selectedSpot}
                collectionSlot={
                  <View>
                    <SpotCollectionButton
                      hasCategories={categories.length > 0}
                      onPress={handleCollectionButtonPress}
                      disabled={isCollectionLoading}
                    />
                    <SpotCollectionModal
                      visible={modalVisible}
                      categories={categories}
                      isLoading={isCollectionLoading}
                      onToggleCategory={handleToggleCategory}
                      onClose={() => setModalVisible(false)}
                    />
                  </View>
                }
                sportsSlot={
                  <VStack className="w-full pt-2 ">
                    <Pressable onPress={toggleSportsTableVisibility}>
                      <HStack className="flex-row justify-between items-center py-3 border-b border-gray-300">
                        <Text className="text-xl font-bold">
                          Available Sports
                        </Text>
                        <Icon
                          as={isSportsTableVisible ? ChevronUp : ChevronDown}
                          className="text-gray-600 w-6 h-6"
                        />
                      </HStack>
                    </Pressable>

                    {isSportsTableVisible && (
                      <View className="pt-4">
                        {sportRatings.length > 0 ? (
                          <SpotSportsTable sports={sportRatings} />
                        ) : (
                          <Text className="text-gray-500 text-center py-4">
                            No sports information available
                          </Text>
                        )}
                      </View>
                    )}
                  </VStack>
                }
                locationSlot={
                  selectedSpot?.details?.location?.latitude &&
                  selectedSpot?.details?.location?.longitude ? (
                    <VStack className="w-full pt-4 pb-6">
                      <Text className="text-xl font-bold pb-2">Location</Text>
                      <View className="w-full h-48 overflow-hidden rounded-lg">
                        <MapView
                          initialRegion={{
                            latitude: selectedSpot.details.location.latitude,
                            longitude: selectedSpot.details.location.longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                          }}
                          containerStyle={{ height: 192 }}
                          mapStyle={{ height: 192 }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                          rotateEnabled={false}
                          pitchEnabled={false}
                        >
                          <MapMarker
                            coordinate={{
                              latitude: selectedSpot.details.location.latitude,
                              longitude:
                                selectedSpot.details.location.longitude,
                            }}
                            data={selectedSpot}
                            onPress={() => {}}
                          />
                        </MapView>
                      </View>
                    </VStack>
                  ) : null
                }
                interactionsSlot={
                  <VStack className="w-full ">
                    <HStack className="flex-row justify-between items-center py-3 border-b border-gray-300">
                      <Text className="text-xl font-bold">Interactions</Text>
                    </HStack>

                    <View className="flex-row justify-around py-4 bg-gray-50 rounded-lg">
                      <View className="flex-1 items-center">
                        <View className="flex-row items-center pb-1">
                          <Heart size={18} color="#FF6B6B" fill="#FF6B6B" />
                          <Text className="pl-1 text-lg font-semibold text-gray-800">
                            {selectedSpot.activity?.favoritesCount || 0}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          Favorites
                        </Text>
                      </View>

                      <View className="flex-1 items-center">
                        <View className="flex-row items-center pb-1">
                          <CheckCircle
                            size={18}
                            color="#4ECDC4"
                            fill="#4ECDC4"
                          />
                          <Text className="pl-1 text-lg font-semibold text-gray-800">
                            {selectedSpot.activity?.visitedCount || 0}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          Visited
                        </Text>
                      </View>

                      <View className="flex-1 items-center">
                        <View className="flex-row items-center pb-1">
                          <Target size={18} color="#45B7D1" fill="#45B7D1" />
                          <Text className="pl-1 text-lg font-semibold text-gray-800">
                            {selectedSpot.activity?.wantToVisitCount || 0}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          Want to Visit
                        </Text>
                      </View>

                      <View className="flex-1 items-center">
                        <View className="flex-row items-center pb-1">
                          <MessageSquare
                            size={18}
                            color="#9B59B6"
                            fill="#9B59B6"
                          />
                          <Text className="pl-1 text-lg font-semibold text-gray-800">
                            {selectedSpot.activity?.reviewsCount || 0}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          Reviews
                        </Text>
                      </View>

                      <View className="flex-1 items-center">
                        <View className="flex-row items-center pb-1">
                          <MessageSquare
                            size={18}
                            color="#7C3AED"
                            fill="#7C3AED"
                          />
                          <Text className="pl-1 text-lg font-semibold text-gray-800">
                            {selectedSpot.activity?.discussionsCount || 0}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          Discussions
                        </Text>
                      </View>
                    </View>
                  </VStack>
                }
              />
            </View>
          </View>

          {/* Tabs for Reviews and Discussions */}
          <HStack className="flex-row border-b border-gray-200">
            <Pressable
              className={`flex-1 py-3 px-4 ${
                activeTab === "reviews" ? "border-b-2 border-blue-600" : ""
              }`}
              onPress={() => setActiveTab("reviews")}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "reviews" ? "text-blue-600" : "text-gray-600"
                }`}
              >
                Reviews
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-3 px-4 ${
                activeTab === "discussions" ? "border-b-2 border-blue-600" : ""
              }`}
              onPress={() => setActiveTab("discussions")}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "discussions"
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Discussions
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-3 px-4 ${
                activeTab === "meetups" ? "border-b-2 border-blue-600" : ""
              }`}
              onPress={() => setActiveTab("meetups")}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "meetups"
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Meetups
              </Text>
            </Pressable>
          </HStack>

          {/* Tab Content */}
          {activeTab === "reviews" && (
            <ReviewList
              reviews={reviews}
              spotId={spotId || ""}
              totalReviews={totalReviews}
              usersData={usersData}
              loading={loadingReviews}
              isDeleting={isDeleting}
              error={reviewsError || undefined}
              availableSports={availableSports}
              selectedSportId={sportFilter}
              onSportFilterChange={setSportFilter}
              getSportName={getSportName}
              sortBy={sortBy}
              onSortChange={setSortBy}
              emptyMessage="Sé el primero en escribir una review"
              onEdit={handleEditReview}
              onCreate={handleCreateReview}
              onDelete={handleDeleteReview}
              onNavigateToProfile={handleNavigateToProfile}
              onOpenReplyModal={handleOpenReplyModal}
              onOpenNewCommentModal={handleOpenNewCommentModal}
              onClearCache={clearReviewsCache}
              targetReviewId={targetReviewId}
              targetCommentId={targetCommentId}
              targetParentCommentId={targetParentCommentId}
              registerLayout={registerLayout}
            />
          )}
          {activeTab === "meetups" && (
            <VStack className="p-4">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-xl font-bold">Meetups</Text>
                {user?.id && (
                  <HStack className="items-center gap-2">
                    <Button
                      onPress={() => {
                        if (!spotId) return;
                        router.push({ pathname: `/spot/[spotId]/meetup/create`, params: { spotId } });
                      }}
                      variant="outline"
                    >
                      <ButtonText>Create Meetup</ButtonText>
                    </Button>

                    {/* Filters button will open MeetupList modal via registered controls */}
                    <FiltersButton />
                  </HStack>
                )}
              </HStack>
              <MeetupList spotId={spotId || ""} onRegisterFiltersControls={setMeetupFiltersControls} />
            </VStack>
          )}
          {activeTab === "discussions" && (
            <VStack className="p-4">
              <HStack className="justify-between items-center">
                <Text className="text-xl font-bold pb-2">Discussions</Text>
                {user?.id && (
                  <Button
                    onPress={() => {
                      if (!spotId) return;
                      router.push({ pathname: `/spot/[spotId]/discussion/create`, params: { spotId } });
                    }}
                    variant="outline"
                  >
                    <ButtonText>Create</ButtonText>
                  </Button>
                )}
              </HStack>
              <VStack className="gap-2">
                {!discussions || discussions.length === 0 ? (
                  <VStack className="items-center py-8">
                    <Text className="text-gray-600">
                      No discussions yet — be the first to start one
                    </Text>
                    {user?.id && (
                      <Button
                        className="mt-4"
                        onPress={() => {
                          if (!spotId) return;
                          router.push({ pathname: `/spot/[spotId]/discussion/create`, params: { spotId } });
                        }}
                      >
                        <ButtonText className="text-white">
                          Create Discussion
                        </ButtonText>
                      </Button>
                    )}
                  </VStack>
                ) : (
                  discussions.map((discussion) =>
                    typeof DiscussionCard !== "undefined" ? (
                      <DiscussionCard
                        key={discussion.id}
                        discussion={discussion}
                        onPress={(id) => {
                          if (!spotId) return;
                          router.push({ pathname: `/spot/[spotId]/discussion/[discussionId]`, params: { spotId, discussionId: id } });
                        }}
                        spotSports={availableSports ?? []}
                      />
                    ) : (
                      <Text key={discussion.id}>
                        {discussion.details.title}
                      </Text>
                    )
                  )
                )}
              </VStack>
            </VStack>
          )}

          {/* Close scroll and layout containers - sports, location, interactions and reviews are passed as slots to SpotDataDetails */}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reply Modal for review comments */}
      <ReplyModal
        visible={replyModalVisible}
        onClose={handleCloseReplyModal}
        onSubmit={handleSubmitComment}
        parentComment={selectedParentComment || undefined}
        headerSlot={
          isNewComment && selectedReview ? (
            <ReviewHeaderForModal
              review={selectedReview}
              reviewUser={usersData.get(selectedReview.metadata.createdBy)}
              getSportName={getSportName}
            />
          ) : undefined
        }
        title={isNewComment ? "Comentar" : "Responder"}
        placeholder={
          isNewComment ? "Escribe tu comentario..." : "Escribe tu respuesta..."
        }
      />
    </SafeAreaView>
  );
};

export default SpotPage;
