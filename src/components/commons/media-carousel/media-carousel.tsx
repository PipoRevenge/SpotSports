import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";

interface MediaCarouselProps {
  /** Array de URLs de medios (ya resueltas, no paths de Storage) */
  media: string[];
  /** Texto alternativo para las imágenes */
  altText?: string;
  /** Altura de cada item del carrusel (por defecto 256) */
  height?: number;
  /** Ancho de cada item del carrusel en píxeles (por defecto SCREEN_WIDTH - 48) */
  width?: number;
  /** Modo de ajuste de imagen (por defecto "contain") */
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  /** Mostrar indicador de carga mientras se inicializa */
  loading?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Placeholder para videos - muestra un icono de play
 * Se usa en el carrusel para evitar problemas con el player
 */
const VideoPlaceholder: React.FC<{ 
  onPress?: () => void 
}> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      className="w-full h-full bg-gray-800 items-center justify-center"
    >
      <View className="bg-white/90 p-4 rounded-full">
        <Play size={32} color="#1f2937" />
      </View>
      <Text className="text-white text-xs mt-2">Toca para reproducir</Text>
    </TouchableOpacity>
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
      style={{ width: '100%', height: '100%' }}
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
 * - Soporte para URLs de medios
 * - Reproducción de videos (solo en modal fullscreen)
 * 
 * NOTA: Este componente espera URLs ya resueltas, no paths de Firebase Storage.
 * La resolución de URLs debe hacerse en el componente padre o en un hook.
 */
export const MediaCarousel: React.FC<MediaCarouselProps> = ({ 
  media, 
  altText = "Media",
  height = 256,
  width,
  resizeMode = "contain",
  loading = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const itemWidth = width ?? SCREEN_WIDTH - 48;

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
    setTimeout(() => setSelectedIndex(null), 300);
  };

  if (loading) {
    return (
      <View 
        className="w-full bg-gray-100 rounded-lg items-center justify-center"
        style={{ height }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!media || media.length === 0) {
    return null;
  }

  // Renderizar item de media (imagen o placeholder de video)
  const renderMediaItem = (uri: string, index: number) => {
    const isVideoFile = isVideo(uri);
    
    return (
      <TouchableOpacity 
        key={index} 
        onPress={() => openFullscreen(index)}
        activeOpacity={0.8}
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ width: itemWidth, height }}
      >
        {isVideoFile ? (
          <VideoPlaceholder onPress={() => openFullscreen(index)} />
        ) : (
          <Image
            source={{ uri }}
            alt={`${altText} - ${index + 1}`}
            className="w-full h-full"
            style={{ backgroundColor: '#000' }}
            resizeMode={resizeMode}
          />
        )}
        
        {/* Contador (solo si hay múltiples medios) */}
        {media.length > 1 && (
          <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs">
              {index + 1} / {media.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Modal de preview fullscreen
  const renderModal = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeFullscreen}
    >
      <View className="flex-1 bg-black">
        {/* Botón cerrar */}
        <TouchableOpacity
          onPress={closeFullscreen}
          className="absolute top-12 right-4 z-10 bg-white/20 p-3 rounded-full"
        >
          <X size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Contenido del modal */}
        {isModalVisible && selectedIndex !== null && (
          media.length === 1 ? (
            // Un solo medio
            <View className="flex-1 items-center justify-center pt-20 pb-5">
              {isVideo(media[0]) ? (
                <FullscreenVideoPlayer uri={media[0]} shouldPlay={isModalVisible} />
              ) : (
                <Image
                  source={{ uri: media[0] }}
                  alt={altText}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              )}
            </View>
          ) : (
            // Múltiples medios con scroll
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH}
                decelerationRate="fast"
                contentOffset={{ x: selectedIndex * SCREEN_WIDTH, y: 0 }}
              >
                {media.map((mediaUri, index) => {
                  const isVideoFile = isVideo(mediaUri);
                  return (
                    <View 
                      key={index} 
                      className="items-center justify-center bg-black pt-20 pb-5"
                      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                    >
                      {isVideoFile ? (
                        <FullscreenVideoPlayer uri={mediaUri} shouldPlay={index === selectedIndex} />
                      ) : (
                        <Image
                          source={{ uri: mediaUri }}
                          alt={`${altText} - ${index + 1}`}
                          className="w-full h-full"
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Navegación */}
              <View className="absolute bottom-12 left-0 right-0 items-center">
                <HStack space="md" className="bg-black/50 px-4 py-2 rounded-full">
                  <TouchableOpacity
                    onPress={() => setSelectedIndex((prev) => 
                      prev !== null ? (prev > 0 ? prev - 1 : media.length - 1) : 0
                    )}
                  >
                    <Text className="text-white font-semibold text-lg">←</Text>
                  </TouchableOpacity>
                  <Text className="text-white">
                    {(selectedIndex ?? 0) + 1} / {media.length}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedIndex((prev) => 
                      prev !== null ? (prev < media.length - 1 ? prev + 1 : 0) : 0
                    )}
                  >
                    <Text className="text-white font-semibold text-lg">→</Text>
                  </TouchableOpacity>
                </HStack>
              </View>
            </>
          )
        )}
      </View>
    </Modal>
  );

  // Un solo medio
  if (media.length === 1) {
    return (
      <>
        {renderMediaItem(media[0], 0)}
        {renderModal()}
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
        snapToInterval={itemWidth + 12}
        decelerationRate="fast"
        className="w-full"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <HStack className="gap-3">
          {media.map((mediaUri, index) => renderMediaItem(mediaUri, index))}
        </HStack>
      </ScrollView>

      {renderModal()}
    </>
  );
};
