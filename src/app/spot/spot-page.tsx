
import { SpotSportsTable } from "@/src/features/sport";
import { SpotDataDetails, useSpotDetails } from "@/src/features/spot";
import { HStack } from "@components/ui/hstack";
import { Icon } from "@components/ui/icon";
import { SafeAreaView } from "@components/ui/safe-area-view";
import { Text } from "@components/ui/text";
import { VStack } from "@components/ui/vstack";
import { useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

export const SpotPage = () => {
    const params = useLocalSearchParams();
    const spotId = params.spotId as string | undefined;
    
    const [isSportsTableVisible, setIsSportsTableVisible] = useState(true);
    const { spot, sportRatings, loading, error } = useSpotDetails(spotId);

    const toggleSportsTableVisibility = () => {
        setIsSportsTableVisible(!isSportsTableVisible);
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

    if (error) {
        return (
            <SafeAreaView>
                <View className="flex-1 justify-center items-center p-6">
                    <Text className="text-red-600 text-lg font-semibold">Error</Text>
                    <Text className="mt-2 text-gray-600 text-center">{error}</Text>
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
        <SafeAreaView>
            <ScrollView className="w-full">
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
            </ScrollView>
        </SafeAreaView>
    );
};

export default SpotPage;
