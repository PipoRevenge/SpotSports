import { userRepository } from "@/src/api/repositories";
import { MapMarker, MapView } from "@/src/components/commons/map";
import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/src/components/ui/select";
import { useUser } from "@/src/context/user-context";
import { Review } from "@/src/entities/review/model/review";
import {
  CommentWithUser,
  ReplyModal,
  ReviewHeaderForModal,
  useComments,
} from "@/src/features/comment";
import {
  DiscussionCard,
  DiscussionListWithFilters,
  type DiscussionListWithFiltersControls,
} from "@/src/features/discussion";
import {
  DEFAULT_DISCUSSION_SORT,
  DISCUSSION_SORT_OPTIONS,
  getDiscussionSortLabel,
} from "@/src/features/discussion/constants/sort-options";
import { MeetupList } from "@/src/features/meetup";
import {
  DEFAULT_MEETUP_SORT,
  getMeetupSortLabel,
  MEETUP_SORT_OPTIONS,
} from "@/src/features/meetup/constants/sort-options";
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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  Filter,
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

  const [activeTab, setActiveTab] = useState<
    "reviews" | "discussions" | "meetups"
  >("reviews");
  // Local state to reflect selected sort in the header controls
  const [meetupSortField, setMeetupSortField] = useState(DEFAULT_MEETUP_SORT);
  const [discussionSortField, setDiscussionSortField] = useState(
    DEFAULT_DISCUSSION_SORT,
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
    sort,
    filters,
    updateSort,
    updateFilters,
  } = useSelectedSpot();

  // Cargar el spot y reviews cuando se monta el componente
  // SIEMPRE con shouldLoadReviews: true para asegurar que las reviews se carguen
  // Cargar el spot y reviews cuando se monta el componente
  // Refrescar cuando la pantalla gana foco (ej. al volver de crear review)
  useFocusEffect(
    useCallback(() => {
      // Si tenemos spotId, refrescamos los datos
      if (spotId) {
        // selectSpot carga si no estaba cargado o fuerza recarga
        // Usamos selectSpot con forceLoadReviews=true para asegurar
        console.log("[SpotPage] Screen focused, refreshing data for:", spotId);
        selectSpot(spotId, true);

        // También llamamos a refreshAll si ya estaba cargado para actualizar todo
        // refreshAll(); // selectSpot(true) debería ser suficiente si está bien implementado,
        // pero refreshAll actualiza también contadores y otras cosas si es necesario.
        // Verificamos si selectSpot ya hace todo.
        // Si no, descomentar refreshAll()
      }
    }, [spotId, selectSpot]),
  );

  // Efecto inicial mantenido por si mounting necesita lógica específica diferente al focus,
  // pero useFocusEffect cubre el montaje inicial también.
  // Dejamos useFocusEffect encargarse de todo.

  // Filters controls exposed by MeetupList
  const [meetupFiltersControls, setMeetupFiltersControls] = useState<{
    open: () => void;
    getActiveFilters: () => number;
    setSort?: (s: {
      field: import("@/src/features/meetup/types/meetup-filter-types").MeetupSortField;
    }) => void;
  } | null>(null);

  // Filters controls exposed by DiscussionListWithFilters
  const [discussionFiltersControls, setDiscussionFiltersControls] =
    useState<DiscussionListWithFiltersControls | null>(null);
  const discussionControlsRef =
    React.useRef<DiscussionListWithFiltersControls | null>(null);

  // Update ref when controls change
  React.useEffect(() => {
    discussionControlsRef.current = discussionFiltersControls;
  }, [discussionFiltersControls]);

  // Filter reviews based on selected sport
  // const reviewHasSport = (review: Review, sportIdToCheck: string) =>
  //   !!review?.details?.reviewSports?.some((s) => s.sportId === sportIdToCheck);

  // We are now doing server-side filtering via context, but we keep this memo
  // if we want to support optimistic client-side filtering while loading.
  // For now, let's just use 'reviews' directly as they are already filtered by the hook.
  const filteredReviews = reviews;

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
        scrollViewRef.current.scrollTo({
          y: Math.max(0, y - 80),
          animated: true,
        });
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
    category: import("@/src/entities/user/model/spot-collection").SpotCategory,
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

  // Local state for creator user (in case it's not among review users)
  const [creatorUser, setCreatorUser] = useState<any | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    if (!discussionRefreshCount) return;
    // Refresh discussions when discussionRefreshCount changes
    if (discussionControlsRef.current?.refresh) {
      discussionControlsRef.current.refresh();
    }
  }, [discussionRefreshCount, spotId]);
  const handleNavigateToProfile = (userIdToNavigate: string) => {
    if (!userIdToNavigate) return;
    if (userIdToNavigate === user?.id) {
      router.push("/home-tabs/my-profile");
    } else {
      router.push(`/profile/${userIdToNavigate}`);
    }
  };

  // Fetch creator user if not present in usersData
  useEffect(() => {
    let canceled = false;
    const fetchCreator = async () => {
      if (!selectedSpot?.metadata?.createdBy) return;
      const creatorId = selectedSpot.metadata.createdBy;
      // If creator already present in users map, use it
      const fromMap = usersData?.get(creatorId);
      if (fromMap) {
        setCreatorUser(fromMap);
        return;
      }

      setIsLoadingCreator(true);
      try {
        const fetched = await userRepository.getUserById(creatorId);
        if (!canceled) setCreatorUser(fetched);
      } catch (err) {
        console.warn("[SpotPage] Failed to fetch creator user:", err);
        if (!canceled) setCreatorUser(null);
      } finally {
        if (!canceled) setIsLoadingCreator(false);
      }
    };

    fetchCreator();
    return () => {
      canceled = true;
    };
  }, [selectedSpot?.metadata?.createdBy, usersData]);

  // Comments hook for the selected review - only load when needed
  const { addComment, addReply } = useComments({
    contextId: spotId || "",
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
        if (UIManager && typeof UIManager.measureLayout === "function") {
          // @ts-ignore
          UIManager.measureLayout(
            nodeHandle,
            containerHandle,
            () => {
              if (tries < 3) setTimeout(() => attempt(tries + 1), 200);
            },
            (x: number, y: number) => {
              layoutMapRef.current.set(id, y);
            },
          );
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
    [],
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
          (selectedParentComment.level || 0) + 1,
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
    ],
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
                // Creator slot: show username and link to profile
                creatorSlot={
                  <Pressable
                    onPress={() => {
                      const cid = selectedSpot.metadata?.createdBy;
                      if (
                        !cid ||
                        (typeof cid === "string" && cid.startsWith("[object"))
                      ) {
                        console.warn(
                          "[SpotPage] Invalid creator id, aborting navigation",
                          { cid },
                        );
                        return;
                      }
                      handleNavigateToProfile(cid as string);
                    }}
                  >
                    <Text className="pt-2 text-sm text-gray-600">
                      Creado por @
                      {isLoadingCreator
                        ? "loading..."
                        : creatorUser?.userDetails?.userName ||
                          usersData.get(selectedSpot.metadata?.createdBy)
                            ?.userDetails?.userName ||
                          "usuario"}
                    </Text>
                  </Pressable>
                }
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
                      {/* Edit button visible only to the creator */}
                      {user?.id === selectedSpot.metadata?.createdBy && (
                        <Button
                          onPress={() => {
                            if (!spotId) return;
                            router.push({
                              pathname: `/spot/[spotId]/edit`,
                              params: { spotId },
                            });
                          }}
                          variant="outline"
                        >
                          <ButtonText>Edit</ButtonText>
                        </Button>
                      )}
                    </HStack>

                    <View className="flex-row justify-around py-4 bg-gray-50 rounded-lg">
                      <View className="flex-1 items-center">
                        <View className="flex-row items-center pb-1">
                          <Target size={18} color="#FF6B6B" fill="#FF6B6B" />
                          <Text className="pl-1 text-lg font-semibold text-gray-800">
                            {selectedSpot.activity?.activeMeetupsCount || 0}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          Active Meetups
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
                  activeTab === "meetups" ? "text-blue-600" : "text-gray-600"
                }`}
              >
                Meetups
              </Text>
            </Pressable>
          </HStack>

          {/* Tab Content */}
          {activeTab === "reviews" && (
            <ReviewList
              reviews={filteredReviews}
              spotId={spotId || ""}
              totalReviews={totalReviews}
              usersData={usersData}
              loading={loadingReviews}
              isDeleting={isDeleting}
              error={reviewsError || undefined}
              availableSports={availableSports}
              selectedSportId={filters.sportId || ""}
              onSportFilterChange={(newSportId) =>
                updateFilters({ sportId: newSportId || undefined })
              }
              getSportName={getSportName}
              sortBy={sort.field}
              onSortChange={(field) => updateSort({ field })}
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
              onReply={(reviewId) => {
                const review = reviews.find((r) => r.id === reviewId);
                if (review) {
                  handleOpenNewCommentModal(review);
                }
              }}
              registerLayout={registerLayout}
            />
          )}
          {activeTab === "meetups" && (
            <VStack className="p-4">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-xl font-bold">Meetups</Text>
                {user?.id && (
                  <HStack className="items-center gap-2">
                    <View className="relative">
                      <Button
                        onPress={() => meetupFiltersControls?.open?.()}
                        variant="solid"
                        action="default"
                        size="sm"
                        className="rounded-full p-2 bg-gray-100"
                      >
                        <ButtonIcon
                          as={Filter}
                          className="text-blue-600 h-5 w-5"
                        />
                      </Button>
                      {meetupFiltersControls &&
                      meetupFiltersControls.getActiveFilters &&
                      meetupFiltersControls.getActiveFilters() > 0 ? (
                        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center">
                          <Text className="text-white text-[10px] font-bold">
                            {meetupFiltersControls.getActiveFilters()}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Select
                      selectedValue={meetupSortField}
                      onValueChange={(value) => {
                        setMeetupSortField(value as any);
                        meetupFiltersControls?.setSort?.({
                          field: value as any,
                        });
                      }}
                    >
                      <SelectTrigger
                        variant="outline"
                        size="sm"
                        className="flex-row items-center gap-2"
                      >
                        <SelectInput
                          placeholder="Sort by"
                          className="text-sm"
                          value={getMeetupSortLabel(meetupSortField)}
                        />
                        <SelectIcon as={ChevronDown} />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          {MEETUP_SORT_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              label={option.label}
                              value={option.value}
                            />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>

                    <Button
                      onPress={() => {
                        if (!spotId) return;
                        router.push({
                          pathname: `/spot/[spotId]/meetup/create`,
                          params: { spotId },
                        });
                      }}
                      variant="outline"
                    >
                      <ButtonText>Create Meetup</ButtonText>
                    </Button>
                  </HStack>
                )}
              </HStack>

              <MeetupList
                spotId={spotId || ""}
                onRegisterFiltersControls={setMeetupFiltersControls}
                headerSlot={null}
              />
            </VStack>
          )}
          {activeTab === "discussions" && (
            <VStack className="p-4">
              <DiscussionListWithFilters
                spotId={spotId || ""}
                availableSports={availableSports}
                spotName={selectedSpot?.details.name}
                onDiscussionPress={(discussionId) => {
                  if (!spotId) return;
                  router.push({
                    pathname: `/spot/[spotId]/discussion/[discussionId]`,
                    params: { spotId, discussionId },
                  });
                }}
                onRegisterControls={setDiscussionFiltersControls}
                discussionCardSlot={(discussion) => (
                  <DiscussionCard
                    discussion={discussion}
                    onPress={(id) => {
                      if (!spotId) return;
                      router.push({
                        pathname: `/spot/[spotId]/discussion/[discussionId]`,
                        params: { spotId, discussionId: id },
                      });
                    }}
                    spotSports={availableSports ?? []}
                  />
                )}
                headerSlot={
                  <HStack className="justify-between items-center pb-3">
                    <Text className="text-xl font-bold">Discussions</Text>
                    <HStack className="items-center gap-2">
                      <View className="relative">
                        <Button
                          onPress={() =>
                            discussionFiltersControls?.openFilters()
                          }
                          variant="solid"
                          action="default"
                          size="sm"
                          className="rounded-full p-2 bg-gray-100"
                        >
                          <ButtonIcon
                            as={Filter}
                            className="text-blue-600 h-5 w-5"
                          />
                        </Button>
                        {(discussionFiltersControls?.getActiveFilters() ?? 0) >
                        0 ? (
                          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 items-center justify-center">
                            <Text className="text-white text-[10px] font-bold">
                              {discussionFiltersControls?.getActiveFilters()}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Select
                        selectedValue={discussionSortField}
                        onValueChange={(value) => {
                          setDiscussionSortField(value as any);
                          discussionFiltersControls?.setSortBy?.(value as any);
                        }}
                      >
                        <SelectTrigger
                          variant="outline"
                          size="sm"
                          className="flex-row items-center gap-2"
                        >
                          <SelectInput
                            placeholder="Sort by"
                            className="text-sm"
                            value={getDiscussionSortLabel(discussionSortField)}
                          />
                          <SelectIcon as={ChevronDown} />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent>
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {DISCUSSION_SORT_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                label={option.label}
                                value={option.value}
                              />
                            ))}
                          </SelectContent>
                        </SelectPortal>
                      </Select>

                      {user?.id && (
                        <Button
                          onPress={() => {
                            if (!spotId) return;
                            router.push({
                              pathname: `/spot/[spotId]/discussion/create`,
                              params: { spotId },
                            });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <ButtonText>Create</ButtonText>
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                }
                emptySlot={
                  <VStack className="items-center py-8">
                    <Text className="text-gray-600">
                      No discussions yet — be the first to start one
                    </Text>
                    {user?.id && (
                      <Button
                        className="mt-4"
                        onPress={() => {
                          if (!spotId) return;
                          router.push({
                            pathname: `/spot/[spotId]/discussion/create`,
                            params: { spotId },
                          });
                        }}
                      >
                        <ButtonText className="text-white">
                          Create Discussion
                        </ButtonText>
                      </Button>
                    )}
                  </VStack>
                }
              />
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
