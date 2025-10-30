import CustomMapView from "@/src/components/commons/map/map-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import React, { useEffect, useRef } from "react";
import MapView, { Circle, Marker, Region } from "react-native-maps";

interface SpotSearchMapProps {
  spots: Spot[];
  onSpotPress?: (spot: Spot) => void;
  selectedSpotId?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  initialRegion?: Region;
  maxDistance?: number; // Distancia máxima en km para mostrar el círculo
}

/**
 * Mapa de búsqueda de spots
 * Muestra los spots en un mapa con marcadores
 */
export const SpotSearchMap: React.FC<SpotSearchMapProps> = ({
  spots,
  onSpotPress,
  selectedSpotId,
  userLocation,
  initialRegion,
  maxDistance,
}) => {
  const mapRef = useRef<MapView>(null);

  // Centrar el mapa en la ubicación del usuario cuando esté disponible
  useEffect(() => {
    if (userLocation && mapRef.current) {
      // Calcular el zoom apropiado basado en la distancia máxima
      const latitudeDelta = maxDistance ? (maxDistance / 111) * 2.5 : 0.05;
      const longitudeDelta = maxDistance ? (maxDistance / 111) * 2.5 : 0.05;
      
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta,
          longitudeDelta,
        },
        1000
      );
    }
  }, [userLocation, maxDistance]);

  const handleMarkerPress = (spot: Spot) => {
    if (onSpotPress) {
      onSpotPress(spot);
    }

    // Centrar el mapa en el spot seleccionado
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: spot.details.location.latitude,
        longitude: spot.details.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const defaultRegion: Region = initialRegion || {
    latitude: userLocation?.latitude || 40.4168,
    longitude: userLocation?.longitude || -3.7038,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <VStack className="flex-1">
      <CustomMapView
        ref={mapRef}
        initialRegion={defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
        loadingEnabled={true}
        containerStyle={{ flex: 1 }}
      >
        {/* Círculo de distancia máxima */}
        {userLocation && maxDistance && maxDistance > 0 && (
          <Circle
            center={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            radius={maxDistance * 1000} // Convertir km a metros
            strokeWidth={2}
            strokeColor="rgba(59, 130, 246, 0.5)" // Azul semi-transparente
            fillColor="rgba(59, 130, 246, 0.1)" // Azul muy transparente
          />
        )}

        {/* Marcadores de spots */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.details.location.latitude,
              longitude: spot.details.location.longitude,
            }}
            title={spot.details.name}
            description={`⭐ ${spot.details.overallRating.toFixed(1)}`}
            onPress={() => handleMarkerPress(spot)}
            pinColor={selectedSpotId === spot.id ? "#22c55e" : "#ef4444"}
          />
        ))}
      </CustomMapView>

      {/* Indicador de cantidad de spots */}
      {spots.length > 0 && (
        <VStack className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-md">
          <Text className="font-semibold text-typography-900">
            {spots.length} spot{spots.length !== 1 ? "s" : ""} encontrado{spots.length !== 1 ? "s" : ""}
          </Text>
        </VStack>
      )}
    </VStack>
  );
};
