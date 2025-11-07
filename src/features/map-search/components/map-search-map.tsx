import CustomMapView from "@/src/components/commons/map/map-view";
import UserLocationMarker from "@/src/components/commons/map/user-location-marker";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import MapView, { Callout, Circle, Marker } from "react-native-maps";
import { DEFAULT_MAP_CONFIG, MapSearchMapProps } from "../types/map-types";
import {
  calculateRegionForDistance,
  calculateRegionForLocations,
} from "../utils/map-helpers";

/**
 * Componente de mapa genérico para mostrar resultados de búsqueda
 * 
 * Características:
 * - Muestra resultados como marcadores
 * - Círculo de distancia máxima
 * - Centrado automático en usuario o resultados
 * - Marcador personalizable
 * - Ubicación del usuario
 * 
 * @example
 * ```tsx
 * <MapSearchMap
 *   results={searchResults}
 *   userLocation={userLocation}
 *   selectedItemId={selectedId}
 *   onMarkerPress={(spot) => navigate(`/spot/${spot.id}`)}
 *   getItemId={(spot) => spot.id}
 *   getItemLocation={(spot) => spot.details.location}
 *   getItemTitle={(spot) => spot.details.name}
 *   getItemDescription={(spot) => `⭐ ${spot.details.overallRating.toFixed(1)}`}
 *   config={{
 *     marker: { color: "#ef4444", selectedColor: "#22c55e" },
 *     distanceCircle: { enabled: true, maxDistance: 10 },
 *   }}
 * />
 * ```
 */
export const MapSearchMap = <T,>({
  results,
  userLocation,
  selectedItemId,
  onMarkerPress,
  onRegionChangeComplete,
  initialRegion: providedInitialRegion,
  config: userConfig = {},
  getItemId,
  getItemLocation,
  getItemTitle,
  getItemDescription,
  renderCustomMarker,
}: MapSearchMapProps<T>): React.ReactElement => {
  const mapRef = useRef<MapView>(null);

  // Merge de configuración con defaults (memoizado para evitar re-renders)
  const config = useMemo(
    () => ({
      marker: { ...DEFAULT_MAP_CONFIG.marker, ...userConfig.marker },
      region: { ...DEFAULT_MAP_CONFIG.region, ...userConfig.region },
      distanceCircle: {
        ...DEFAULT_MAP_CONFIG.distanceCircle,
        ...userConfig.distanceCircle,
      },
      showUserLocation: userConfig.showUserLocation ?? DEFAULT_MAP_CONFIG.showUserLocation,
      showMyLocationButton:
        userConfig.showMyLocationButton ?? DEFAULT_MAP_CONFIG.showMyLocationButton,
      followsUserLocation:
        userConfig.followsUserLocation ?? DEFAULT_MAP_CONFIG.followsUserLocation,
      roundedCorners: userConfig.roundedCorners ?? DEFAULT_MAP_CONFIG.roundedCorners,
    }),
    [userConfig]
  );

  /**
   * Efecto para centrar el mapa cuando hay ubicación o resultados
   */
  useEffect(() => {
    if (!mapRef.current) return;

    // Si hay una región inicial proporcionada, no hacer auto-centrado
    if (providedInitialRegion) {
      console.log("[MapSearchMap] Using provided initial region, skipping auto-center");
      return;
    }

    // Prioridad 1: Centrar en ubicación del usuario con distancia
    if (
      userLocation &&
      config.region.autoCenter &&
      config.distanceCircle.enabled &&
      config.distanceCircle.maxDistance
    ) {
      const region = calculateRegionForDistance(
        userLocation,
        config.distanceCircle.maxDistance
      );
      mapRef.current.animateToRegion(region, 1000);
      return;
    }

    // Prioridad 2: Centrar en resultados
    if (
      config.region.autoCenterOnResults &&
      results.length > 0
    ) {
      const locations = results.map((r) => r.location);
      const region = calculateRegionForLocations(locations);
      if (region) {
        mapRef.current.animateToRegion(region, 1000);
      }
      return;
    }

    // Prioridad 3: Centrar en ubicación del usuario sin distancia
    if (userLocation && config.region.autoCenter) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: config.region.defaultZoom || 0.05,
          longitudeDelta: config.region.defaultZoom || 0.05,
        },
        1000
      );
    }
  }, [userLocation, results, config, providedInitialRegion]);

  /**
   * Maneja el press en un marcador
   */
  const handleMarkerPress = (item: T) => {
    if (onMarkerPress) {
      onMarkerPress(item);
    }
  };

  /**
   * Región inicial del mapa
   */
  const initialRegion =
    providedInitialRegion ||
    config.region.initialRegion ||
    (userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: config.region.defaultZoom || 0.05,
          longitudeDelta: config.region.defaultZoom || 0.05,
        }
      : {
          latitude: config.region.defaultLatitude || 40.4168,
          longitude: config.region.defaultLongitude || -3.7038,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

  return (
    <VStack className="flex-1">
      <CustomMapView
        ref={mapRef}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={config.showUserLocation}
        showsMyLocationButton={config.showMyLocationButton}
        followsUserLocation={config.followsUserLocation}
        loadingEnabled={true}
        containerStyle={{ flex: 1, borderRadius: 0, overflow: 'visible' }}
      >
        {/* Ubicación del usuario */}
        {userLocation && (
          <UserLocationMarker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            size={24}
          />
        )}

        {/* Círculo de distancia máxima */}
        {userLocation &&
          config.distanceCircle.enabled &&
          config.distanceCircle.maxDistance &&
          config.distanceCircle.maxDistance > 0 && (
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={config.distanceCircle.maxDistance * 1000} // km a metros
              strokeWidth={config.distanceCircle.strokeWidth}
              strokeColor={config.distanceCircle.strokeColor}
              fillColor={config.distanceCircle.fillColor}
            />
          )}

        {/* Marcadores de resultados */}
        {results.map((result) => {
          const item = result.item;
          const itemId = getItemId(item);
          const location = getItemLocation(item);
          const isSelected = selectedItemId === itemId;

          // Marcador personalizado
          if (renderCustomMarker) {
            return (
              <Marker
                key={itemId}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                onPress={() => handleMarkerPress(item)}
              >
                {renderCustomMarker(item, isSelected)}
              </Marker>
            );
          }

          // Marcador por defecto
          return (
            <Marker
              key={itemId}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => handleMarkerPress(item)}
              pinColor={
                isSelected ? config.marker.selectedColor : config.marker.color
              }
            >
              {/* Callout vacío para evitar que se muestre el callout por defecto */}
              <Callout tooltip>
                <View />
              </Callout>
            </Marker>
          );
        })}
      </CustomMapView>

      {/* Contador de resultados */}
      {results.length > 0 && (
        <VStack className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-md">
          <Text className="font-semibold text-typography-900">
            {results.length} {results.length === 1 ? "resultado" : "resultados"}
          </Text>
        </VStack>
      )}
    </VStack>
  );
};
