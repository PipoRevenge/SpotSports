import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import { VideoView, useVideoPlayer } from 'expo-video';
import { X } from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

interface SpotImageGalleryProps {
  images: string[];
  spotName: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoPlayer: React.FC<{ uri: string; style: any; shouldPlay?: boolean }> = ({ uri, style, shouldPlay = false }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    if (shouldPlay) {
      player.play();
    }
  });

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="contain"
      allowsPictureInPicture
    />
  );
};

export const SpotImageGallery: React.FC<SpotImageGalleryProps> = ({ images, spotName }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const isVideo = (uri: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    return videoExtensions.some(ext => uri.toLowerCase().includes(ext));
  };

  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
  };

  const closeFullscreen = () => {
    setIsModalVisible(false);
    setSelectedIndex(null);
  };

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

  if (images.length === 1) {
    const uri = images[0];
    const isVideoFile = isVideo(uri);

    return (
      <>
        <Pressable onPress={() => openFullscreen(0)}>
          <View className="w-full h-64 bg-black rounded-lg overflow-hidden">
            {isVideoFile ? (
              <VideoPlayer
                uri={uri}
                style={{ width: '100%', height: 256 }}
                shouldPlay={false}
              />
            ) : (
              <Image
                source={{ uri }}
                alt={spotName}
                style={{ width: '100%', height: 256 }}
                resizeMode="cover"
              />
            )}
          </View>
        </Pressable>

        {/* Modal para vista en grande */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeFullscreen}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.closeButton} onPress={closeFullscreen}>
              <Icon as={X} className="text-white w-8 h-8" />
            </Pressable>
            <View style={styles.fullscreenContainer}>
              {isVideoFile ? (
                <VideoPlayer
                  uri={uri}
                  style={styles.fullscreenMedia}
                  shouldPlay={true}
                  
                />
              ) : (
                <Image
                  source={{ uri }}
                  alt={spotName}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH - 48} // 48 = padding horizontal total (24*2)
        decelerationRate="fast"
        className="w-full"
      >
        <HStack className="gap-3">
          {images.map((imageUri, index) => {
            const isVideoFile = isVideo(imageUri);
            return (
              <Pressable
                key={index}
                onPress={() => openFullscreen(index)}
                style={{ width: SCREEN_WIDTH - 48 }}
              >
                <View style={{ width: SCREEN_WIDTH - 48, height: 256, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
                  {isVideoFile ? (
                    <VideoPlayer
                      uri={imageUri}
                      style={{ width: '100%', height: 256 }}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: imageUri }}
                      alt={`${spotName} - Image ${index + 1}`}
                      style={{ width: '100%', height: 256 }}
                      resizeMode="center"
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>

      {/* Modal para vista en grande */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
        
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.closeButton} onPress={closeFullscreen}>
            <Icon as={X} className="text-white w-8 h-8" />
          </Pressable>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={Dimensions.get('window').width}
            decelerationRate="fast"
            contentOffset={{ x: (selectedIndex || 0) * Dimensions.get('window').width, y: 0 }}
          >
            {images.map((imageUri, index) => {
              const isVideoFile = isVideo(imageUri);
              return (
                <View key={index} style={styles.fullscreenSlide}>
                  <View style={styles.fullscreenContainer}>
                    {isVideoFile ? (
                      <VideoPlayer
                        uri={imageUri}
                        style={styles.fullscreenMedia}
                        shouldPlay={index === selectedIndex}
                      />
                    ) : (
                      <Image
                        source={{ uri: imageUri }}
                        alt={`${spotName} - Image ${index + 1}`}
                        style={styles.fullscreenImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  fullscreenSlide: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    width: "100%",
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingTop: 80,
    paddingBottom: 20,
  },
  fullscreenMedia: {
    width: '100%',
    height: '100%',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
