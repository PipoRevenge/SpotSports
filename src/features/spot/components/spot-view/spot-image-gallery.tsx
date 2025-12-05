import { MediaCarousel } from "@/src/components/commons/media-carousel";
import { useMediaUrls } from "@/src/hooks";
import React from "react";
import { Image, View } from "react-native";

interface SpotImageGalleryProps {
  images: string[];
  spotName: string;
}

export const SpotImageGallery: React.FC<SpotImageGalleryProps> = ({ images, spotName }) => {
  const { urls, loading } = useMediaUrls(images);

  if (!images || images.length === 0) {
    return (
      <View className="w-full h-64 bg-black rounded-lg flex items-center justify-center">
        <Image
          source={{ uri: 'https://via.placeholder.com/400x300?text=No+Image' }}
          alt={spotName}
          className="w-full h-full object-contain"
        />
      </View>
    );
  }

  return (
    <MediaCarousel
      media={urls}
      altText={spotName}
      height={256}
      resizeMode="contain"
      loading={loading}
    />
  );
};
