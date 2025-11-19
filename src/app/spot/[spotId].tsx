import {
    ReviewList,
    useReviewDelete
} from "@/src/features/review";
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
import { CheckCircle, ChevronDown, ChevronUp, Heart, MessageSquare, Target } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from "react-native";

export const SpotPage = () => {
    const params = useLocalSearchParams();
    const spotId = params.spotId as string | undefined;
    
    const [isSportsTableVisible, setIsSportsTableVisible] = useState(true);
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'rating-high' | 'rating-low'>('recent');
    const [sportFilter, setSportFilter] = useState<string>('');
    
    // Usar el contexto de Spot Seleccionado que incluye todo
    const {
        selectedSpot,
        sportRatings,
        availableSports,
        reviews,
        usersData,
        loadingSpot,
        loadingReviews,
        spotError,
        reviewsError,
        selectSpot,
        refreshAll,
    } = useSelectedSpot();
    
    // Cargar el spot cuando se monta el componente
    useEffect(() => {
        if (spotId && (!selectedSpot || selectedSpot.id !== spotId)) {
            selectSpot(spotId, true);
        }
    }, [spotId, selectSpot, selectedSpot]);
    
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

    const handleToggleCategory = async (category: import("@/src/entities/user/model/spot-collection").SpotCategory) => {
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
        const sport = sportRatings.find(sr => sr.sportId === sportId);
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
            pathname: `/spot/review/[spotId]/edit-review`,
            params: {
                spotId,
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
            console.error('Error deleting review:', error);
        }
    };

    if (loadingSpot) {
        return (
            <SafeAreaView>
                <View className="flex-1 justify-center items-center p-6">
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text className="mt-4 text-gray-600">Loading spot details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (spotError) {
        return (
            <SafeAreaView>
                <View className="flex-1 justify-center items-center p-6">
                    <Text className="text-red-600 text-lg font-semibold">Error</Text>
                    <Text className="mt-2 text-gray-600 text-center">{spotError}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!selectedSpot) {
        return (
            <SafeAreaView>
                <View className="flex-1 justify-center items-center p-6">
                    <Text className="text-gray-600 text-lg">Spot not found</Text>
                    <Text className="text-gray-500 text-sm mt-2">
                        {spotId ? `ID: ${spotId}` : 'No spot ID provided'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1">
            <KeyboardAvoidingView
                behavior="padding"
                className="flex-1"
            >
                <ScrollView 
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
                                <>
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
                                </>
                            }
                        />
                    </View>
                    
                </View>

                {/* Sección de deportes disponibles */}
                <VStack className="w-full px-6 mt-6 mb-4">
                    <Pressable onPress={toggleSportsTableVisibility}>
                        <HStack className="flex-row justify-between items-center py-3 border-b border-gray-300">
                            <Text className="text-xl font-bold">Available Sports</Text>
                            <Icon
                                as={isSportsTableVisible ? ChevronUp : ChevronDown}
                                className="text-gray-600 w-6 h-6"
                            />
                        </HStack>
                    </Pressable>

                    {isSportsTableVisible && (
                        <View className="mt-4">
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

                {/* Sección de ubicación */}
                {selectedSpot.details.location && selectedSpot.details.location.latitude && selectedSpot.details.location.longitude && (
                    <VStack className="w-full px-6 mt-4 mb-6">
                        <Text className="text-xl font-bold mb-2">Location</Text>
                        <Text className="text-gray-600">
                            Latitude: {selectedSpot.details.location.latitude.toFixed(6)}
                        </Text>
                        <Text className="text-gray-600">
                            Longitude: {selectedSpot.details.location.longitude.toFixed(6)}
                        </Text>
                    </VStack>
                )}

                {/* Separador antes de reviews */}
                <View className="h-2 bg-gray-100" />

                {/* Contadores de interacción */}
                <VStack className="w-full px-6 mb-4">
                    <HStack className="flex-row justify-between items-center py-3 border-b border-gray-300">
                        <Text className="text-xl font-bold">Interactions</Text>
                    </HStack>

                    <View className="flex-row justify-around mt-4 py-4 bg-gray-50 rounded-lg">
                        <View className="flex-1 items-center">
                            <View className="flex-row items-center mb-1">
                                <Heart size={18} color="#FF6B6B" fill="#FF6B6B" />
                                <Text className="ml-1 text-lg font-semibold text-gray-800">
                                    {selectedSpot.activity.favoritesCount || 0}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-600 text-center">Favorites</Text>
                        </View>
                        
                        <View className="flex-1 items-center">
                            <View className="flex-row items-center mb-1">
                                <CheckCircle size={18} color="#4ECDC4" fill="#4ECDC4" />
                                <Text className="ml-1 text-lg font-semibold text-gray-800">
                                    {selectedSpot.activity.visitedCount || 0}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-600 text-center">Visited</Text>
                        </View>
                        
                        <View className="flex-1 items-center">
                            <View className="flex-row items-center mb-1">
                                <Target size={18} color="#45B7D1" fill="#45B7D1" />
                                <Text className="ml-1 text-lg font-semibold text-gray-800">
                                    {selectedSpot.activity.wantToVisitCount || 0}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-600 text-center">Want to Visit</Text>
                        </View>
                        
                        <View className="flex-1 items-center">
                            <View className="flex-row items-center mb-1">
                                <MessageSquare size={18} color="#9B59B6" fill="#9B59B6" />
                                <Text className="ml-1 text-lg font-semibold text-gray-800">
                                    {selectedSpot.activity.reviewsCount || 0}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-600 text-center">Reviews</Text>
                        </View>
                    </View>
                </VStack>

                {/* Lista de reviews */}
                <ReviewList
                    reviews={reviews}
                    spotId={spotId || ""}
                    totalReviews={reviews.length}
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
                    onDelete={handleDeleteReview}
                />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SpotPage;
