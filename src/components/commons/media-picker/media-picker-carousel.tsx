import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from '@/src/context/app-alert-context';
import * as ExpoImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import { Image as ImageIcon, Trash2, Video as VideoIcon, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    TouchableOpacity,
    View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH-100;
const THUMBNAIL_SIZE = 80;
const MAX_MEDIA_COUNT = 10;

export interface MediaItem {
  uri: string;
  type: "image" | "video";
  thumbnail?: string;
  duration?: number;
}

export interface MediaPickerCarouselProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  error?: string;
  maxCount?: number;
  minCount?: number;
  required?: boolean;
  title?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  showTitle?: boolean;
  helpText?: string;
  showHelpText?: boolean;
}

export const MediaPickerCarousel: React.FC<MediaPickerCarouselProps> = ({
  media,
  onMediaChange,
  error,
  maxCount = MAX_MEDIA_COUNT,
  minCount = 0,
  required = false,
  title = "Photos & Videos",
  emptyMessage = "No media files",
  emptyDescription = "Add photos or videos",
  showTitle = true,
  helpText,
  showHelpText = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  // Log para debug en edición
  useEffect(() => {
    if (media.length > 0) {
      console.log('[MediaPickerCarousel] Media loaded:', media.length, 'items');
      media.forEach((item, index) => {
        console.log(`[MediaPickerCarousel] Item ${index}:`, {
          type: item.type,
          uri: item.uri, // URI completo
          isVideo: item.type === 'video'
        });
      });
    }
  }, [media]);
  
  // Create a small component that only uses the video player hook when rendered
  const PreviewVideoPlayer: React.FC<{ uri: string; shouldPlay: boolean }> = ({ uri, shouldPlay }) => {
    const player = useVideoPlayer(uri, (p) => {
      p.loop = false;
      if (shouldPlay) p.play();
    });

    useEffect(() => {
      try {
        if (player) {
          if (shouldPlay) player.play();
          else player.pause();
        }
      } catch {
        // ignore user-level player errors
      }
    }, [shouldPlay, player]);

    if (!uri) return null;
    return (
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%", padding: 16 }}
        contentFit="contain"
        nativeControls
      />
    );
  };

  /**
   * Solicita permisos para acceder a la galería
   */
  const { showError, showInfo, showConfirm, showActionSheet } = useAppAlert();

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const permissionResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showError("We need access to your gallery to select photos and videos.", 'Permission Required');
        return false;
      }
      return true;
      } catch {
      showError("Could not request permission");
      return false;
    }
  };

  /**
   * Solicita permisos para acceder a la cámara
   */
  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      const permissionResult = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showError("We need access to your camera to take photos.", 'Permission Required');
        return false;
      }
      return true;
      } catch {
      showError("Could not request permission");
      return false;
    }
  };

  /**
   * Selecciona medios desde la galería
   */
  const pickMedia = async () => {
    if (media.length >= maxCount) {
      showInfo(`You can only upload a maximum of ${maxCount} files.`, 'Limit Reached');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"], // Permite imágenes y videos
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60, // 60 segundos máximo
      });

      if (!result.canceled && result.assets.length > 0) {
        const remainingSlots = maxCount - media.length;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        const newMedia: MediaItem[] = assetsToAdd.map((asset) => ({
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "image",
          duration: asset.duration ?? undefined,
        }));

        onMediaChange([...media, ...newMedia]);

        if (result.assets.length > remainingSlots) {
          showInfo(`Only ${remainingSlots} files were added. Limit: ${maxCount}.`, 'Limit Reached');
        }
      }
    } catch {
      showError("Could not select the file");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toma una foto con la cámara
   */
  const takePhoto = async () => {
    if (media.length >= maxCount) {
      showInfo(`You can only upload a maximum of ${maxCount} files.`, 'Limit Reached');
      return;
    }

    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const newMediaItem: MediaItem = {
          uri: asset.uri,
          type: "image",
        };

        onMediaChange([...media, newMediaItem]);
      }
    } catch {
      showError("Could not take the photo");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Elimina un medio
   */
  const removeMedia = async (index: number) => {
    const confirmed = await showConfirm('Delete File', 'Are you sure you want to delete this file?', 'Delete', 'Cancel');
    if (!confirmed) return;
    const newMedia = media.filter((_, i) => i !== index);
    onMediaChange(newMedia);
    
    // Ajustar el índice actual si es necesario
    if (currentIndex >= newMedia.length && newMedia.length > 0) {
      setCurrentIndex(newMedia.length - 1);
    }
  };

  /**
   * Muestra las opciones para añadir medios
   */
  const showMediaOptions = async () => {
    const choice = await showActionSheet('Add Media', 'Select an option', [
      { key: 'camera', label: 'Take Photo' },
      { key: 'gallery', label: 'Select from Gallery' },
    ]);
    if (choice === 'camera') return takePhoto();
    if (choice === 'gallery') return pickMedia();
    return; // cancelled
  };

  /**
   * Abre el preview de un medio
   */
  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  /**
   * Renderiza un item del carrusel principal
   */
  const renderCarouselItem = ({ item, index }: { item: MediaItem; index: number }) => {
    return (
      <View
        style={{
          width: CAROUSEL_ITEM_WIDTH,
          marginHorizontal: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => openPreview(index)}
          activeOpacity={0.8}
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{ aspectRatio: 16 / 9 }}
        >
          {/* Renderizar video o imagen según el tipo */}
          {item.type === "video" ? (
            // Para videos, mostrar un fondo oscuro con icono de play
            <View className="w-full h-full p-4 bg-black items-center justify-center">
              <View className="bg-white/90 p-4 rounded-full">
                <VideoIcon size={48} color="#000" />
              </View>
              {item.duration && (
                <View className="absolute bottom-4 right-4 bg-black/70 px-2 py-1 rounded">
                  <Text className="text-white text-xs">
                    {Math.floor(item.duration / 1000)}s
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // Para imágenes, renderizar normalmente
            <Image
              source={{ uri: item.uri }}
              className="w-full h-full"
              style={{ backgroundColor: '#000' }}
              resizeMode="contain"
            />
          )}

          {/* Icono de video si es video (superpuesto) - REMOVIDO porque ya se muestra arriba */}

          {/* Botón de eliminar */}
          <TouchableOpacity
            onPress={() => removeMedia(index)}
            className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
          >
            <X size={16} color="#FFF" />
          </TouchableOpacity>

          {/* Contador */}
          <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs">
              {index + 1} / {media.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Renderiza las miniaturas
   */
  const renderThumbnail = ({ item, index }: { item: MediaItem; index: number }) => (
    <TouchableOpacity
      onPress={() => {
        setCurrentIndex(index);
        carouselRef.current?.scrollToIndex({ index, animated: true });
      }}
      className={`mr-2 rounded-lg overflow-hidden border-2 ${
        index === currentIndex ? "border-blue-500" : "border-gray-300"
      }`}
      style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
    >
      {item.type === "video" ? (
        // Para videos, mostrar fondo negro con icono
        <View className="w-full h-full bg-black items-center justify-center">
          <VideoIcon size={24} color="#FFF" />
        </View>
      ) : (
        // Para imágenes, mostrar la imagen
        <Image
          source={{ uri: item.uri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <VStack className="w-full gap-4">
      {/* Título y contador */}
      {showTitle && (
        <HStack className="justify-between items-center">
          <Text className="text-base font-semibold">
            {title} {media.length > 0 && `(${media.length}/${maxCount})`}
          </Text>
          {required && media.length < minCount && (
            <Text className="text-xs text-red-600">
              * Mínimo {minCount} requerido{minCount > 1 ? 's' : ''}
            </Text>
          )}
        </HStack>
      )}

      {/* Error */}
      {error && (
        <View className="bg-red-50 p-3 rounded-md">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      {/* Carrusel principal */}
      {media.length > 0 ? (
        <VStack className="gap-4">
          <FlatList
            ref={carouselRef}
            data={media}
            renderItem={renderCarouselItem}
            keyExtractor={(_, index) => `carousel-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CAROUSEL_ITEM_WIDTH + 32}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={{ paddingRight: 16 }}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                carouselRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / (CAROUSEL_ITEM_WIDTH + 32)
              );
              setCurrentIndex(index);
            }}
            getItemLayout={(_, index) => ({
              length: CAROUSEL_ITEM_WIDTH + 32,
              offset: (CAROUSEL_ITEM_WIDTH + 32) * index,
              index,
            })}
          />

          {/* Miniaturas */}
          <FlatList
            data={media}
            renderItem={renderThumbnail}
            keyExtractor={(_, index) => `thumbnail-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
          />
        </VStack>
      ) : (
        <View className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 items-center justify-center">
          <ImageIcon size={48} color="#9CA3AF" className="pb-4" />
          <Text className="text-gray-600 text-center pb-2">
            {emptyMessage}
          </Text>
          <Text className="text-gray-500 text-sm text-center">
            {emptyDescription}
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <HStack className="pt-2 gap-4">
        <Button
          onPress={showMediaOptions}
          className="flex-1"
          disabled={isLoading || media.length >= maxCount}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <ButtonIcon as={ImageIcon} className="pr-2" />
              <ButtonText>
                {media.length === 0 ? "Add Files" : "Add More"}
              </ButtonText>
            </>
          )}
        </Button>

        {media.length > 0 && (
          <Button
            variant="outline"
            onPress={async () => {
              const confirmed = await showConfirm('Delete All', 'Are you sure you want to delete all files?', 'Delete', 'Cancel');
              if (!confirmed) return;
              onMediaChange([]);
              setCurrentIndex(0);
            }}
            disabled={isLoading}
          >
            <ButtonIcon as={Trash2} />
          </Button>
        )}
      </HStack>

      {/* Modal de preview */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Botón cerrar */}
          <TouchableOpacity
            onPress={() => setPreviewVisible(false)}
            className="absolute top-12 right-4 z-10 bg-white/20 p-3 rounded-full"
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Imagen/Video en preview */}
          <View className="flex-1 items-center justify-center">
            {media[previewIndex] && (
              <>
                {media[previewIndex].type === "video" ? (
                      <PreviewVideoPlayer uri={media[previewIndex].uri} shouldPlay={previewVisible} />
                ) : (
                  <Image
                    source={{ uri: media[previewIndex].uri }}
                    className="w-full h-full p-4"
                    resizeMode="contain"
                  />
                )}
              </>
            )}
          </View>

          {/* Navegación */}
          <View className="absolute bottom-12 left-0 right-0 items-center">
            <HStack space="md" className="bg-black/50 px-4 py-2 rounded-full">
              <TouchableOpacity
                onPress={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
                disabled={media.length <= 1}
              >
                <Text className="text-white font-semibold text-lg">←</Text>
              </TouchableOpacity>
              <Text className="text-white">
                {previewIndex + 1} / {media.length}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
                disabled={media.length <= 1}
              >
                <Text className="text-white font-semibold text-lg">→</Text>
              </TouchableOpacity>
            </HStack>
          </View>
        </View>
      </Modal>

      {/* Ayuda */}
      {showHelpText && helpText && (
        <Text className="text-xs text-gray-500 text-center">
          {helpText}
        </Text>
      )}
    </VStack>
  );
};
