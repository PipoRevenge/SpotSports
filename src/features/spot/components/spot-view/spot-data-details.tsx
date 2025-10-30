import { RatingStar } from "@/src/components/commons/rating-start/rating-star";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import { SpotImageGallery } from "@/src/features/spot/components/spot-view/spot-image-gallery";
import React from "react";


interface SpotDataDetailsProps {
  spot: Spot;
}

export const SpotDataDetails: React.FC<SpotDataDetailsProps> = ({ spot }) => {
    return (
        <VStack className="w-full flex-1 px-6 pt-6">
            {/* Galería de imágenes */}
            <SpotImageGallery images={spot.details.media} spotName={spot.details.name} />
            
            {/* Nombre y rating */}
            <HStack className="w-full flex-row justify-between items-center mt-4">
                <Text size="2xl" className="font-bold">{spot.details.name}</Text>
                <RatingStar rating={spot.details.overallRating} />
            </HStack>
            
            {/* Descripción */}
            <Text className="pt-2 text-gray-700">{spot.details.description}</Text>
            
            {/* Información de contacto */}
            {(spot.details.contactInfo.phone || spot.details.contactInfo.email || spot.details.contactInfo.website) && (
                <VStack className="mt-4 gap-2">
                    <Text className="font-semibold text-lg">Contact Information</Text>
                    {spot.details.contactInfo.phone && (
                        <Text className="text-gray-600">Phone: {spot.details.contactInfo.phone}</Text>
                    )}
                    {spot.details.contactInfo.email && (
                        <Text className="text-gray-600">Email: {spot.details.contactInfo.email}</Text>
                    )}
                    {spot.details.contactInfo.website && (
                        <Text className="text-blue-600">Website: {spot.details.contactInfo.website}</Text>
                    )}
                </VStack>
            )}

            {/* Información de actividad */}
            {spot.activity && (
                <HStack className="mt-4 gap-4">
                    <Text className="text-gray-600">
                        Reviews: {spot.activity.reviewsCount || 0}
                    </Text>
                    <Text className="text-gray-600">
                        Visits: {spot.activity.visitsCount || 0}
                    </Text>
                </HStack>
            )}
        </VStack>
    );
};
 