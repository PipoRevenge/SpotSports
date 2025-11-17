import {
  MapCircle,
  MapMarker,
  MapView,
  UserLocationMarker,
} from "@/src/components/commons/map";

import { VStack } from "@/src/components/ui/vstack";
import React, { useEffect, useMemo, useRef } from "react";
import MapViewRef from "react-native-maps";
import { DEFAULT_MAP_CONFIG, MapSearchMapProps, MapSearchResult } from "../types/map-types";
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
  onCalloutPress,
  onRegionChangeComplete,
  initialRegion: providedInitialRegion,
  config: userConfig = {},
  getItemId,
  getItemLocation,
  getItemTitle,
  getItemDescription,
  renderCustomMarker,
  renderCustomCallout,
  renderCompleteMarker,
}: MapSearchMapProps<T>): React.ReactElement => {
  const mapRef = useRef<MapViewRef>(null);

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
    }),
    [userConfig]
  );

  /**
   * Efecto para centrar el mapa cuando hay ubicación o resultados
   */
  useEffect(() => {
    if (!mapRef.current) return;

    if (providedInitialRegion) {
      return;
    }

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

    if (
      config.region.autoCenterOnResults &&
      results.length > 0
    ) {
      const locations = results.map((r: MapSearchResult<T>) => r.location);
      const region = calculateRegionForLocations(locations);
      if (region) {
        mapRef.current.animateToRegion(region, 1000);
      }
      return;
    }

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
      <MapView
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
            <MapCircle
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
        {results.map((result: MapSearchResult<T>) => {
          const item = result.item;
          const itemId = getItemId(item);
          const location = getItemLocation(item);
          const isSelected = selectedItemId === itemId;

          // Si se proporciona un renderCompleteMarker, usarlo directamente
          if (renderCompleteMarker) {
            return (
              <React.Fragment key={itemId}>
                {renderCompleteMarker(
                  item,
                  isSelected,
                  () => handleMarkerPress(item),
                  () => onCalloutPress && onCalloutPress(item)
                )}
              </React.Fragment>
            );
          }

          // Caso por defecto: usar MapMarker genérico
          return (
            <MapMarker
              key={itemId}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              data={item}
              isSelected={isSelected}
              color={config.marker.color}
              size={config.marker.size}
              onPress={() => handleMarkerPress(item)}
              renderMarkerContent={renderCustomMarker}
              renderCallout={renderCustomCallout}
              calloutConfig={{
                showDefault: false,
                tooltip: true,
              }}
            />
          );
        })}
      </MapView>

      
    </VStack>
  );
};
