import { MediaCarousel } from "@/src/components/commons/media-carousel";
import { RatingStars } from "@/src/components/commons/rating/rating-stars";
import Tag from '@/src/components/commons/tag';
import { useMediaUrls } from "@/src/hooks";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { HStack } from "../../../../components/ui/hstack";
import { VStack } from "../../../../components/ui/vstack";
import type { Spot } from "../../../../entities/spot/model/spot";

interface SpotCardModalProps {
  spot: Spot | undefined;
  visible: boolean;
  distance?: number;
  onClose: () => void;
  onPress: (spot: Spot) => void;
  getSportName?: (sportId: string) => string;
  /**
   * Slot for collection selector component - injected from app layer
   * This follows the architecture pattern of feature independence
   */
  collectionSlot?: React.ReactNode;
}

/**
 * Modal que muestra un card del spot seleccionado en la parte inferior
 * 
 * Responsabilidades:
 * - Renderiza información detallada del spot en un modal inferior
 * - Maneja el cierre del modal
 * - Permite navegar a la página completa del spot
 */
export const SpotCardModal: React.FC<SpotCardModalProps> = ({
  spot,
  visible,
  distance,
  onClose,
  onPress,
  getSportName,
  collectionSlot,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Resolver URLs de media
  const { urls: mediaUrls, loading: mediaLoading } = useMediaUrls(spot?.details?.media);
  
  // Resetear estado cuando el modal se cierra
  React.useEffect(() => {
    if (!visible) {
      setIsNavigating(false);
    }
  }, [visible]);
  
  // No renderizar nada si no está visible
  if (!visible) {
    return null;
  }

  // Mostrar loading centrado si no hay spot aún
  if (!spot) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
          <View className="bg-white rounded-t-3xl shadow-2xl h-[500px] justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="pt-4 text-gray-600">Cargando detalles del spot...</Text>
          </View>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          onPress={(e) => {
            // Evitar que el press se propague al Pressable padre
            e.stopPropagation();
          }}
        >
          <View className="bg-white rounded-t-3xl shadow-2xl">
            {/* Header con botón de cerrar y colecciones */}
            <View className="p-4 border-b border-gray-200">
              <HStack className="justify-between items-center">
                <Text className="text-lg font-bold text-typography-900">
                  Detalles del Spot
                </Text>
                <HStack className="gap-2 items-center">
                  {/* Selector de colecciones - slot injected from app layer */}
                  {collectionSlot}
                  
                  {/* Botón cerrar */}
                  <Pressable
                    onPress={onClose}
                    className="bg-gray-100 p-2 rounded-full"
                  >
                    <X size={20} color="#374151" />
                  </Pressable>
                </HStack>
              </HStack>
            </View>

            {/* Contenido scrolleable */}
            <ScrollView className="max-h-[500px]">
              <VStack className="p-4 gap-4">
                {/* Imagen del spot */}
                {spot.details.media && spot.details.media.length > 0 ? (
                  <MediaCarousel
                    media={mediaUrls}
                    altText={spot.details.name}
                    height={192}
                    resizeMode="contain"
                    loading={mediaLoading}
                  />
                ) : (
                  <View className="w-full h-48 rounded-lg bg-gray-200 items-center justify-center">
                    <Text className="text-gray-400 text-6xl">📍</Text>
                  </View>
                )}

                {/* Información del spot */}
                <VStack className="gap-2">
                  {/* Nombre */}
                  <Text className="font-bold text-typography-900 text-xl">
                    {spot.details.name}
                  </Text>

                  {/* Rating y verificación */}
                  <HStack className="items-center gap-3 flex-wrap">
                    {/* Rating */}
                    {spot.details.overallRating !== undefined && (
                      <HStack className="items-center gap-1">
                        <RatingStars 
                          rating={spot.details.overallRating} 
                          size="sm" 
                          showValue={true} 
                          disabled 
                        />
                        {spot.activity?.reviewsCount !== undefined && (
                          <Text className="text-typography-500 text-sm pl-1">
                            ({spot.activity.reviewsCount})
                          </Text>
                        )}

                        {/* Discussions count */}
                        {spot.activity?.discussionsCount !== undefined && (
                          <Text className="text-typography-500 text-sm pl-2">
                            • {spot.activity.discussionsCount} discusiones
                          </Text>
                        )}
                      </HStack>
                    )}

                    {/* Verificación */}
                    {spot.metadata.isVerified && (
                      <HStack className="items-center gap-1 bg-green-100 px-2 py-1 rounded">
                        <Text className="text-green-500">✓</Text>
                        <Text className="text-green-600 text-xs font-medium">
                          Verificado
                        </Text>
                      </HStack>
                    )}
                  </HStack>

                  {/* Distancia */}
                  {distance !== undefined && (
                    <HStack className="items-center gap-1">
                      <Text className="text-typography-500 text-sm">📍</Text>
                      <Text className="text-typography-600 text-sm">
                        {distance < 1
                          ? `${Math.round(distance * 1000)} m`
                          : `${distance.toFixed(1)} km`}
                      </Text>
                    </HStack>
                  )}

                  {/* Descripción */}
                  {spot.details.description && (
                    <VStack className="gap-1">
                      <Text className="font-semibold text-typography-900">
                        Descripción
                      </Text>
                      <Text className="text-typography-600 text-sm leading-5">
                        {spot.details.description}
                      </Text>
                    </VStack>
                  )}

                  {/* Deportes disponibles */}
                  {spot.details.availableSports &&
                    spot.details.availableSports.length > 0 && (
                      <VStack className="gap-2">
                        <Text className="font-semibold text-typography-900">
                          Deportes disponibles
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {spot.details.availableSports.map((sportId: string) => (
                            <Tag key={sportId} label={getSportName ? getSportName(sportId) : sportId} color={'#E6F6FF'} />
                          ))}
                        </View>
                      </VStack>
                    )}

                  {/* Información de contacto */}
                  {spot.details.contactInfo &&
                    (spot.details.contactInfo.phone ||
                      spot.details.contactInfo.email ||
                      spot.details.contactInfo.website) && (
                      <VStack className="gap-2">
                        <Text className="font-semibold text-typography-900">
                          Información de contacto
                        </Text>
                        <VStack className="gap-1">
                          {spot.details.contactInfo.phone && (
                            <Text className="text-typography-600 text-sm">
                              📱 {spot.details.contactInfo.phone}
                            </Text>
                          )}
                          {spot.details.contactInfo.email && (
                            <Text className="text-typography-600 text-sm">
                              ✉️ {spot.details.contactInfo.email}
                            </Text>
                          )}
                          {spot.details.contactInfo.website && (
                            <Text className="text-typography-600 text-sm">
                              🌐 {spot.details.contactInfo.website}
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                    )}
                </VStack>

                {/* Botón para ver más detalles */}
                <Pressable
                  onPress={() => {
                    if (!isNavigating && spot) {
                      setIsNavigating(true);
                      // Close the modal first to avoid leaving it open on back navigation
                      onClose();
                      // Navigate to the full spot page
                      onPress(spot);
                    }
                  }}
                  disabled={isNavigating}
                  className={`py-3 rounded-lg items-center ${
                    isNavigating ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                >
                  {isNavigating ? (
                    <HStack className="items-center gap-2">
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-white font-semibold">
                        Abriendo...
                      </Text>
                    </HStack>
                  ) : (
                    <Text className="text-white font-semibold">
                      Ver detalles completos
                    </Text>
                  )}
                </Pressable>
              </VStack>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
