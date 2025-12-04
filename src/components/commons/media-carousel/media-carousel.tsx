import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import { Text } from "@/src/components/ui/text";
import { storage } from "@/src/lib/firebase-config";
import { VideoView, useVideoPlayer } from 'expo-video';
import { getDownloadURL, ref } from "firebase/storage";
import { Play, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

interface MediaCarouselProps {
  /** Array de rutas de Storage o URLs */
  media: string[];
  /** Texto alternativo para las imágenes */
  altText?: string;
  /** Altura de cada item del carrusel (por defecto 256) */
  height?: number;
  /** Ancho de cada item del carrusel en píxeles (por defecto SCREEN_WIDTH - 48 para carrusel, SCREEN_WIDTH - 48 para item único) */
  width?: number;
  /** Modo de ajuste de imagen (por defecto "cover") */
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Placeholder para videos - muestra un icono de play
 * Se usa en el carrusel para evitar problemas con el player
 */
const VideoPlaceholder: React.FC<{ 
  width: number | string;
  height: number;
  onPress?: () => void 
}> = ({ width: w, height: h, onPress }) => {
  return (
    <Pressable onPress={onPress} style={{ width: w, height: h, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 30, padding: 16 }}>
        <Play size={32} color="#1f2937" />
      </View>
      <Text style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>Tap to play</Text>
    </Pressable>
  );
};

/**
 * Componente para reproducir videos en el modal fullscreen
 * Solo se renderiza cuando el modal está visible para evitar el error de shared object
 */
const FullscreenVideoPlayer: React.FC<{ uri: string; shouldPlay: boolean }> = ({ 
  uri, 
  shouldPlay 
}) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    if (shouldPlay) {
      p.play();
    }
  });

  if (!uri) return null;

  return (
    <VideoView
      player={player}
      style={styles.fullscreenMedia}
      contentFit="contain"
      allowsPictureInPicture
      nativeControls
    />
  );
};

/**
 * Componente MediaCarousel
 * 
 * Carrusel de imágenes y videos con:
 * - Scroll horizontal
 * - Ampliación en modal
 * - Soporte para Storage paths y URLs
 * - Reproducción de videos (solo en modal fullscreen)
 */
export const MediaCarousel: React.FC<MediaCarouselProps> = ({ 
  media, 
  altText = "Media",
  height = 256,
  width,
  resizeMode = "contain"
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const itemWidth = width !== undefined ? width : SCREEN_WIDTH - 48;

  const isVideo = (uri: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    return videoExtensions.some(ext => uri.toLowerCase().includes(ext));
  };

  const mediaKey = useMemo(() => JSON.stringify(media), [media]);
  
  useEffect(() => {
    const loadMediaUrls = async () => {
      if (!media || media.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const urls = await Promise.all(
          media.map(async (path) => {
            if (
              path.startsWith('http://') || 
              path.startsWith('https://') ||
              path.includes('firebasestorage.googleapis.com')
            ) {
              return path;
            }
            
            try {
              const storageRef = ref(storage, path);
              const url = await getDownloadURL(storageRef);
              return url;
            } catch (error) {
              console.warn('[MediaCarousel] Error getting download URL for:', path, error);
              return path;
            }
          })
        );
        
        setMediaUrls(urls);
      } catch (error) {
        console.error('[MediaCarousel] Error loading media URLs:', error);
        setMediaUrls(media);
      } finally {
        setLoading(false);
      }
    };

    loadMediaUrls();
  }, [mediaKey, media]);

  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
  };

  const closeFullscreen = () => {
    setIsModalVisible(false);
    // Delay clearing selectedIndex to allow modal to close first
    setTimeout(() => setSelectedIndex(null), 300);
  };

  if (loading) {
    return (
      <View style={{ width: '100%', height, backgroundColor: '#f3f4f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  // Renderizar item de media (imagen o placeholder de video)
  const renderMediaItem = (uri: string, index: number, itemW: number | string, itemH: number) => {
    const isVideoFile = isVideo(uri);
    
    return (
      <Pressable key={index} onPress={() => openFullscreen(index)}>
        <View style={{ 
          width: itemW, 
          height: itemH, 
          backgroundColor: '#000', 
          borderRadius: 12, 
          overflow: 'hidden' 
        }}>
          {isVideoFile ? (
            <VideoPlaceholder width={itemW} height={itemH} onPress={() => openFullscreen(index)} />
          ) : (
            <Image
              source={{ uri }}
              alt={`${altText} - ${index + 1}`}
              style={{ width: '100%', height: itemH }}
              resizeMode={resizeMode}
            />
          )}
        </View>
      </Pressable>
    );
  };

  if (mediaUrls.length === 1) {
    const uri = mediaUrls[0];
    const isVideoFile = isVideo(uri);

    return (
      <>
        {renderMediaItem(uri, 0, itemWidth, height)}

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
                <FullscreenVideoPlayer uri={uri} shouldPlay={isModalVisible} />
              ) : (
                <Image
                  source={{ uri }}
                  alt={altText}
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

  // Múltiples medios: carrusel
  return (
    <>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        className="w-full"
      >
        <HStack className="gap-3">
          {mediaUrls.map((mediaUri, index) => renderMediaItem(mediaUri, index, itemWidth, height))}
        </HStack>
      </ScrollView>

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
          
          {isModalVisible && selectedIndex !== null && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').width}
              decelerationRate="fast"
              contentOffset={{ x: selectedIndex * Dimensions.get('window').width, y: 0 }}
            >
              {mediaUrls.map((mediaUri, index) => {
                const isVideoFile = isVideo(mediaUri);
                return (
                  <View key={index} style={styles.fullscreenSlide}>
                    <View style={styles.fullscreenContainer}>
                      {isVideoFile ? (
                        <FullscreenVideoPlayer uri={mediaUri} shouldPlay={index === selectedIndex} />
                      ) : (
                        <Image
                          source={{ uri: mediaUri }}
                          alt={`${altText} - ${index + 1}`}
                          style={styles.fullscreenImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
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
