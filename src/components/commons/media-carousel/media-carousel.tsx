import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import { storage } from "@/src/lib/firebase-config";
import { VideoView, useVideoPlayer } from 'expo-video';
import { getDownloadURL, ref } from "firebase/storage";
import { X } from "lucide-react-native";
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
 * Componente para reproducir videos con manejo robusto del player
 */
const VideoPlayer: React.FC<{ uri: string; style: any; shouldPlay?: boolean }> = ({ 
  uri, 
  style, 
  shouldPlay = false 
}) => {
  // Solo crear el player si hay una URI válida
  const player = useVideoPlayer(uri || "", player => {
    if (uri) {
      player.loop = true;
      if (shouldPlay) {
        player.play();
      }
    }
  });

  useEffect(() => {
    // Cleanup cuando el componente se desmonta
    return () => {
      if (player) {
        try {
          player.pause();
          player.release();
        } catch {
          // Ignorar errores de cleanup
        }
      }
    };
  }, [player]);

  // Si no hay URI válida, no renderizar nada
  if (!uri) {
    return null;
  }

  return (
    <VideoView
      player={player}
      style={style}
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
 * - Reproducción de videos
 * 
 * @example
 * ```tsx
 * <MediaCarousel 
 *   media={["spots/abc/reviews/xyz/xyz_0.jpg", "spots/abc/reviews/xyz/xyz_1.mp4"]}
 *   altText="Review media"
 * />
 * ```
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

  // Determinar el ancho del item
  const itemWidth = width !== undefined ? width : SCREEN_WIDTH - 48;

  /**
   * Determina si un archivo es video por su extensión
   */
  const isVideo = (uri: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    return videoExtensions.some(ext => uri.toLowerCase().includes(ext));
  };

  /**
   * Convierte rutas de Storage a URLs de descarga
   * Memoizado para evitar recargas innecesarias
   */
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
            // Si ya es una URL completa (http/https o firebasestorage), devolverla directamente
            if (
              path.startsWith('http://') || 
              path.startsWith('https://') ||
              path.includes('firebasestorage.googleapis.com')
            ) {
              return path;
            }
            
            // Si es una ruta de Storage (sin dominio), obtener URL de descarga
            try {
              const storageRef = ref(storage, path);
              const url = await getDownloadURL(storageRef);
              return url;
            } catch (error) {
              console.warn('[MediaCarousel] Error getting download URL for:', path, error);
              return path; // Devolver path original si falla
            }
          })
        );
        
        setMediaUrls(urls);
      } catch (error) {
        console.error('[MediaCarousel] Error loading media URLs:', error);
        setMediaUrls(media); // Usar paths originales si falla
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
    setSelectedIndex(null);
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

  if (mediaUrls.length === 1) {
    const uri = mediaUrls[0];
    const isVideoFile = isVideo(uri);

    return (
      <>
        <Pressable onPress={() => openFullscreen(0)}>
          <View style={{ width: itemWidth, height, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
            {isVideoFile ? (
              <VideoPlayer
                uri={uri}
                style={{ width: '100%', height }}
                shouldPlay={false}
              />
            ) : (
              <Image
                source={{ uri }}
                alt={altText}
                style={{ width: '100%', height }}
                resizeMode={resizeMode}
              />
            )}
          </View>
        </Pressable>

        {/* Modal para vista ampliada */}
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
          {mediaUrls.map((mediaUri, index) => {
            const isVideoFile = isVideo(mediaUri);
            return (
              <Pressable
                key={index}
                onPress={() => openFullscreen(index)}
                style={{ width: itemWidth }}
              >
                <View style={{ 
                  width: itemWidth, 
                  height, 
                  backgroundColor: '#000', 
                  borderRadius: 12, 
                  overflow: 'hidden' 
                }}>
                  {isVideoFile ? (
                    <VideoPlayer
                      uri={mediaUri}
                      style={{ width: '100%', height }}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: mediaUri }}
                      alt={`${altText} - ${index + 1}`}
                      style={{ width: '100%', height }}
                      resizeMode={resizeMode}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>

      {/* Modal para vista ampliada */}
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
            {mediaUrls.map((mediaUri, index) => {
              const isVideoFile = isVideo(mediaUri);
              return (
                <View key={index} style={styles.fullscreenSlide}>
                  <View style={styles.fullscreenContainer}>
                    {isVideoFile ? (
                      <VideoPlayer
                        uri={mediaUri}
                        style={styles.fullscreenMedia}
                        shouldPlay={index === selectedIndex}
                      />
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
