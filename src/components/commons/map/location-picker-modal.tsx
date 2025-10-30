import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@/src/components/ui/modal';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useUserLocation } from '@/src/hooks/use-user-location';
import { Locate } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MapView, { MapPressEvent, Region } from 'react-native-maps';
import CustomMapView from './map-view';
import SelectionMarker from './selection-marker';
import UserLocationMarker from './user-location-marker';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: { latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Modal que muestra un mapa para seleccionar una ubicación
 * Usa la ubicación del usuario como región inicial
 */
export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
  title = 'Seleccionar Ubicación',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  const mapRef = useRef<MapView>(null);
  const { location: userLocation, isLoading, error, requestLocation } = useUserLocation();
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);

  // Solicitar ubicación cuando se abre el modal
  useEffect(() => {
    if (isOpen && !userLocation && !initialLocation) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Actualizar ubicación seleccionada cuando se obtiene la del usuario
  useEffect(() => {
    if (userLocation && !selectedLocation && !initialLocation) {
      setSelectedLocation(userLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  /**
   * Maneja el clic en el mapa para seleccionar una ubicación
   */
  const handleMapPress = (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  /**
   * Confirma la ubicación seleccionada
   */
  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation);
      onClose();
    }
  };

  /**
   * Centra el mapa en la ubicación del usuario
   */
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500 // duración de la animación en ms
      );
    }
  };

  // Determinar región inicial
  const getInitialRegion = (): Region | undefined => {
    if (initialLocation) {
      return {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Ubicación por defecto (Madrid, España)
    return {
      latitude: 40.4168,
      longitude: -3.7038,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalBackdrop />
      <ModalContent className="max-h-[90%] max-w-[95%]">
        <ModalHeader>
          <Text className="text-xl font-bold">{title}</Text>
        </ModalHeader>

        <ModalBody>
          <VStack space="md" className="flex-1">
            {/* Instrucciones */}
            <Text className="text-sm text-gray-600">
              {isLoading
                ? 'Obteniendo tu ubicación...'
                : 'Toca en el mapa para seleccionar una ubicación'}
            </Text>

            {/* Error de permisos */}
            {error && (
              <View className="bg-yellow-50 p-3 rounded-md">
                <Text className="text-yellow-800 text-sm">{error}</Text>
                <Text className="text-yellow-700 text-xs mt-1">
                  Se usará una ubicación por defecto
                </Text>
              </View>
            )}

            {/* Mapa */}
            {isLoading && !selectedLocation && !initialLocation ? (
              <View className="h-96 items-center justify-center bg-gray-100 rounded-lg">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-4 text-gray-600">Cargando mapa...</Text>
              </View>
            ) : (
              <View className="h-96 rounded-lg overflow-hidden">
                <CustomMapView
                  ref={mapRef}
                  initialRegion={getInitialRegion()}
                  onPress={handleMapPress}
                  containerStyle={{ height: '100%', width: '100%' }}
                >
                  {/* Ubicación del usuario */}
                  {userLocation && (
                    <UserLocationMarker
                      latitude={userLocation.latitude}
                      longitude={userLocation.longitude}
                      size={24}
                    />
                  )}

                  {/* Ubicación seleccionada */}
                  {selectedLocation && (
                    <SelectionMarker
                      latitude={selectedLocation.latitude}
                      longitude={selectedLocation.longitude}
                      color="#FF3B30"
                      size={32}
                    />
                  )}
                </CustomMapView>
              </View>
            )}

            {/* Botón flotante para centrar en ubicación del usuario (fuera del mapa) */}
            {userLocation && !isLoading && (
              <View className="flex-row justify-end mt-2 mb-2">
                <Pressable
                  style={styles.locationButton}
                  onPress={centerOnUserLocation}
                >
                  <Locate size={20} color="#007AFF" />
                  <Text className="text-xs text-blue-600 ml-1 font-medium">
                    Mi ubicación
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Información de ubicaciones */}
            <VStack space="sm">
              {/* Ubicación del usuario */}
              {userLocation && (
                <View className="bg-blue-50 p-3 rounded-md">
                  <HStack className="items-center justify-between">
                    <VStack>
                      <Text className="text-sm text-blue-900 font-semibold">
                        Tu ubicación:
                      </Text>
                      <Text className="text-xs text-blue-700 mt-1">
                        Lat: {userLocation.latitude.toFixed(6)}, Lng: {userLocation.longitude.toFixed(6)}
                      </Text>
                    </VStack>
                    <View className="bg-blue-100 rounded-full p-2">
                      <Locate size={16} color="#1D4ED8" />
                    </View>
                  </HStack>
                </View>
              )}

              {/* Coordenadas seleccionadas */}
              {selectedLocation && (
                <View className="bg-red-50 p-3 rounded-md">
                  <Text className="text-sm text-red-900 font-semibold">
                    Ubicación seleccionada:
                  </Text>
                  <Text className="text-xs text-red-700 mt-1">
                    Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack space="md" className="w-full">
            <Button variant="outline" className="flex-1" onPress={onClose}>
              <ButtonText>{cancelText}</ButtonText>
            </Button>
            <Button
              className="flex-1"
              onPress={handleConfirm}
              disabled={!selectedLocation}
            >
              <ButtonText>{confirmText}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
