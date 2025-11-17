import {
    ReviewList,
    useReviewDelete,
    useSpotReviews
} from "@/src/features/review";
import { SpotSportsTable } from "@/src/features/sport";
import { SpotDataDetails, useSpotDetails } from "@/src/features/spot";
import { HStack } from "@components/ui/hstack";
import { Icon } from "@components/ui/icon";
import { SafeAreaView } from "@components/ui/safe-area-view";
import { Text } from "@components/ui/text";
import { VStack } from "@components/ui/vstack";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

export const SpotPage = () => {
    const params = useLocalSearchParams();
    const spotId = params.spotId as string | undefined;
    
    const [isSportsTableVisible, setIsSportsTableVisible] = useState(true);
    const { spot, sportRatings, loading, error: spotError, refetch } = useSpotDetails(spotId);
    
    // Hook para gestionar reviews
    const {
        reviews,
        totalReviews,
        usersData,
        loading: reviewsLoading,
        error: reviewsError,
        filters,
        sortBy,
        updateFilters,
        setSortBy,
        refetch: refetchReviews,
    } = useSpotReviews(spotId);
    
    // Hook de eliminación
    const {
        deleteReview,
    } = useReviewDelete(() => {
        refetch();
        refetchReviews();
    });

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
        
        const sports = sportRatings.map(sr => ({
            id: sr.sportId,
            name: sr.sportName,
        }));
        
        router.push({
            pathname: `/spot/review/[spotId]/edit-review`,
            params: {
                spotId,
                spotSports: JSON.stringify(sports),
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

    if (loading) {
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

    if (!spot) {
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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Detalles del spot */}
                <SpotDataDetails spot={spot} />

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
                {spot.details.location && spot.details.location.latitude && spot.details.location.longitude && (
                    <VStack className="w-full px-6 mt-4 mb-6">
                        <Text className="text-xl font-bold mb-2">Location</Text>
                        <Text className="text-gray-600">
                            Latitude: {spot.details.location.latitude.toFixed(6)}
                        </Text>
                        <Text className="text-gray-600">
                            Longitude: {spot.details.location.longitude.toFixed(6)}
                        </Text>
                    </VStack>
                )}

                {/* Separador antes de reviews */}
                <View className="h-2 bg-gray-100" />

                {/* Lista de reviews */}
                <ReviewList
                    reviews={reviews}
                    spotId={spotId || ""}
                    totalReviews={totalReviews}
                    usersData={usersData}
                    loading={reviewsLoading}
                    error={reviewsError}
                    availableSports={sportRatings.map(sr => ({
                        id: sr.sportId,
                        name: sr.sportName,
                    }))}
                    selectedSportId={filters.sportId || ""}
                    onSportFilterChange={(sportId) => updateFilters({ sportId })}
                    getSportName={getSportName}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    emptyMessage="Sé el primero en escribir una review"
                    onEdit={handleEditReview}
                    onDelete={handleDeleteReview}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default SpotPage;
