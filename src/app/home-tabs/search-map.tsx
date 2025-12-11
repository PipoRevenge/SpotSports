import { MapMarker } from "@/src/components/commons/map";
import Tag from '@/src/components/commons/tag';
import { HStack } from "@/src/components/ui/hstack";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import {
  formatDistance,
  MapSearchBar,
  MapSearchMap,
  MapSearchResult,
  MapSearchResultItem,
  MapSearchResultList,
  SpotCardModal,
  SpotMarker,
  spotsToMapResults,
  useMapSpotSearch,
} from "@/src/features/map-search";
import {
  SpotSearchFilterModal,
  useSelectedSpot,
} from "@/src/features/spot";
import { SpotCollectionSelector } from "@/src/features/spot-collection";
import { useUserLocation } from "@/src/hooks/use-user-location";
import { GeoPoint } from "@/src/types/geopoint";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { List as ListIcon, Map as MapIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, View } from "react-native";

/**
 * Página de búsqueda de spots en mapa
 * 
 * Responsabilidades:
 * - Orquestar los hooks de búsqueda, filtros y área de mapa
 * - Coordinar la UI entre vista de mapa y lista
 * - Gestionar la selección y navegación de spots
 * 
 * Las features son independientes:
 * - map-search: Búsqueda genérica en mapa (reutilizable)
 * - spot: Lógica específica de spots y filtros
 */
export default function SearchMapScreen() {
  // ==================== ESTADO LOCAL ====================
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>();
  const [showSpotCard, setShowSpotCard] = useState(false);
  const [createSpotLocation, setCreateSpotLocation] = useState<GeoPoint | null>(null);
  const hasSearchedRef = useRef(false);
  const shouldSearchAfterFiltersRef = useRef(false);
  const shouldRefreshAfterCreateRef = useRef(false);

  // ==================== HOOKS DE FEATURES ====================
  // Contexto de Spot Seleccionado para mantener sincronización global
  const { selectedSpot, selectSpot, refreshAll } = useSelectedSpot();
  
  // Ubicación del usuario
  const { location: userLocation, isLoading: isLoadingLocation } = useUserLocation(true);

  // Búsqueda de spots con gestión integrada de mapa
  const {
    filteredSpots,
    loading: isSearching,
    searchQuery,
    setSearchQuery,
    getSportName,
    searchSpots,
    sortBy,
    setSortBy,
    setFilters: setSearchFilters,
    filters: searchFilters,
    mapRegion,
    setMapRegion,
    shouldCenterOnUser,
  } = useMapSpotSearch({
    userLocation: userLocation || undefined,
    autoSearch: true,
  });

  // Calcular filtros activos para mostrar en UI
  const activeFiltersCount = 
    (searchFilters.maxDistance !== undefined ? 1 : 0) +
    (searchFilters.minRating && searchFilters.minRating > 0 ? 1 : 0) +
    (searchFilters.sports && searchFilters.sports.length > 0 ? 1 : 0) +
    (searchFilters.onlyVerified === true ? 1 : 0) +
    (searchFilters.sportCriteria && searchFilters.sportCriteria.length > 0 ? 1 : 0);

  // ==================== EFECTOS ====================

  /**
   * Refrescar spot seleccionado cuando la pantalla recibe foco
   * Útil para actualizar datos después de crear una review
   */
  useFocusEffect(
    useCallback(() => {
      // Solo refrescar si hay un spot seleccionado Y el modal está visible
      if (selectedSpotId && showSpotCard && selectedSpot) {
        refreshAll().catch(err => {
          console.log('[SearchMapScreen] Error refreshing spot on focus:', err);
        });
      }
    }, [selectedSpotId, showSpotCard, selectedSpot, refreshAll])
  );

  // Re-ejecutar la búsqueda cuando volvemos desde la creación de un spot
  useFocusEffect(
    useCallback(() => {
      if (shouldRefreshAfterCreateRef.current) {
        shouldRefreshAfterCreateRef.current = false;
        searchSpots();
      }
    }, [searchSpots])
  );

  /**
   * Maneja cambios en filtros - busca si se aplicaron filtros desde el modal
   */
  useEffect(() => {
    // Si el flag está activo, buscar con los nuevos filtros
    if (shouldSearchAfterFiltersRef.current) {
      shouldSearchAfterFiltersRef.current = false;
      searchSpots();
    }
  }, [searchFilters, searchSpots]);

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Maneja la búsqueda cuando el usuario presiona Enter
   */
  const handleSearch = useCallback(() => {
    searchSpots();
  }, [searchSpots]);

  // Convertir spots a resultados de mapa usando la función de map-helpers
  const mapResults = spotsToMapResults(filteredSpots, userLocation || undefined);

  /**
   * Efecto para ejecutar búsqueda inicial cuando se obtiene la ubicación del usuario
   */
  useEffect(() => {
    if (userLocation && !hasSearchedRef.current && filteredSpots.length === 0 && !isSearching) {
      hasSearchedRef.current = true;
    }
  }, [userLocation, filteredSpots.length, isSearching]);

  /**
   * Maneja el press en un marcador del mapa
   * Selecciona el spot y muestra el callout automáticamente
   */
  const handleMarkerPress = useCallback((spot: Spot) => {
    selectSpot(spot, false); // No cargar reviews para el modal
    setSelectedSpotId(spot.id);
  }, [selectSpot]);

  /**
   * Maneja el press en el callout
   * Muestra el card modal con toda la información
   */
  const handleCalloutPress = useCallback((spot: Spot) => {
    // Asegurar que el spot esté seleccionado en el contexto (sin cargar reviews)
    selectSpot(spot, false);
    // Mostrar el modal con los datos que ya tenemos
    setShowSpotCard(true);
  }, [selectSpot]);

  /**
   * Maneja el press en un spot desde la lista o el card
   * Navega a la página del spot
   */
  const handleSpotPress = useCallback((spot: Spot) => {
    // Navegar inmediatamente a la página del spot
    // La página se encargará de cargar los datos completos
    router.push({
      pathname: '/spot/[spotId]',
      params: { spotId: spot.id }
    });
  }, []);

  /**
   * Cierra el card del spot
   */
  const handleCloseSpotCard = useCallback(() => {
    setShowSpotCard(false);
    setSelectedSpotId(undefined);
    // No limpiar selectedSpot del contexto para mantener la sincronización
  }, []);

  /**
   * Maneja el press en el mapa para crear un nuevo spot
   */
  const handleMapPress = useCallback((coordinate: GeoPoint) => {
    // Cerrar el card si está abierto
    setShowSpotCard(false);
    setSelectedSpotId(undefined);
    // Establecer la ubicación para crear spot
    setCreateSpotLocation(coordinate);
  }, []);

  /**
   * Navega a la página de creación de spot con la ubicación seleccionada
   */
  const handleCreateSpotPress = useCallback(() => {
    if (createSpotLocation) {
      shouldRefreshAfterCreateRef.current = true;
      router.push({
        pathname: '/spot/create-spot',
        params: {
          latitude: createSpotLocation.latitude.toString(),
          longitude: createSpotLocation.longitude.toString(),
        },
      });
      // Limpiar el marcador después de navegar
      setCreateSpotLocation(null);
    }
  }, [createSpotLocation]);

  /**
   * Renderiza el contenido de un item de spot
   */
  const renderSpotContent = useCallback(
    (spot: Spot, distance?: number) => (
      <HStack className="gap-3 items-start">
        {/* Imagen del spot */}
        {spot.details.media && spot.details.media.length > 0 ? (
          <Image
            source={{ uri: spot.details.media[0] }}
            className="w-20 h-20 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-20 rounded-lg bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-2xl">
              📍
            </Text>
          </View>
        )}

        {/* Información del spot */}
        <VStack className="flex-1 gap-1">
          {/* Nombre */}
          <Text className="font-bold text-typography-900 text-base">
            {spot.details.name}
          </Text>

          {/* Rating */}
          <HStack className="items-center gap-1">
            <Text className="text-sm text-typography-700">
              {spot.details.overallRating.toFixed(1)}
            </Text>
            <Text className="text-yellow-500">⭐</Text>
            {spot.metadata.isVerified && (
              <HStack className="items-center gap-1 pl-2">
                <Text className="text-sm text-blue-600">✓</Text>
                <Text className="text-sm text-blue-600">Verificado</Text>
              </HStack>
            )}
          </HStack>

          {/* Distancia */}
          {distance !== undefined && (
            <HStack className="items-center gap-1">
              <Text className="text-sm text-gray-500">📍</Text>
              <Text className="text-sm text-gray-500">{formatDistance(distance)}</Text>
            </HStack>
          )}

          {/* Deportes disponibles (primeros 3) */}
          {spot.details.availableSports.length > 0 && (
            <HStack className="flex-wrap gap-1 pt-1">
              {spot.details.availableSports.slice(0, 3).map((sportId: string) => (
                <Tag key={sportId} label={getSportName(sportId)} color={'#E6F6FF'} />
              ))}
              {spot.details.availableSports.length > 3 && (
                <Text className="text-xs text-gray-500">
                  +{spot.details.availableSports.length - 3}
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      </HStack>
    ),
    [getSportName]
  );

  /**
   * Renderiza un item de resultado
   */
  const renderResultItem = useCallback(
    (result: MapSearchResult<Spot>) => (
      <MapSearchResultItem
        item={result.item}
        distance={result.location.distance}
        onPress={handleSpotPress}
        isSelected={selectedSpotId === result.item.id}
        renderContent={renderSpotContent}
      />
    ),
    [selectedSpotId, handleSpotPress, renderSpotContent]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        {/* Header con barra de búsqueda */}
        <VStack className="bg-white border-b border-gray-200">
          <MapSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchPress={handleSearch}
            onFilterPress={() => setShowFilters(true)}
            placeholder="Buscar spots deportivos..."
            showFilterButton={true}
            filterCount={activeFiltersCount}
            disabled={isSearching || isLoadingLocation}
          />

          {/* Toggle de vista */}
          <HStack className="px-4 pb-3 gap-2">
            <Pressable
              onPress={() => setViewMode("map")}
              className={`flex-1 py-2 rounded-lg border ${
                viewMode === "map"
                  ? "bg-blue-50 border-blue-500"
                  : "bg-white border-gray-300"
              }`}
            >
              <HStack className="items-center justify-center gap-2">
                <MapIcon
                  size={18}
                  color={viewMode === "map" ? "#3b82f6" : "#6b7280"}
                />
                <Text
                  className={
                    viewMode === "map" ? "text-blue-600 font-semibold" : "text-gray-600"
                  }
                >
                  Mapa
                </Text>
              </HStack>
            </Pressable>

            <Pressable
              onPress={() => setViewMode("list")}
              className={`flex-1 py-2 rounded-lg border ${
                viewMode === "list"
                  ? "bg-blue-50 border-blue-500"
                  : "bg-white border-gray-300"
              }`}
            >
              <HStack className="items-center justify-center gap-2">
                <ListIcon
                  size={18}
                  color={viewMode === "list" ? "#3b82f6" : "#6b7280"}
                />
                <Text
                  className={
                    viewMode === "list" ? "text-blue-600 font-semibold" : "text-gray-600"
                  }
                >
                  Lista
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        </VStack>

        {/* Contenido: Mapa o Lista */}
        {viewMode === "map" ? (
          <View className="w-full h-full pb-24">
            {/* Indicador de carga de ubicación */}
            {isLoadingLocation && (
              <View className="absolute top-4 left-0 right-0 z-10 items-center">
                <View className="bg-blue-500 rounded-lg px-4 py-3 shadow-lg">
                  <HStack className="items-center gap-2">
                    <View className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    <Text className="text-white font-semibold">
                      Obteniendo tu ubicación...
                    </Text>
                  </HStack>
                </View>
              </View>
            )}
            
            <MapSearchMap
              results={mapResults}
              userLocation={userLocation || undefined}
              selectedItemId={selectedSpotId}
              onMarkerPress={handleMarkerPress}
              onCalloutPress={handleCalloutPress}
              onMapPress={handleMapPress}
              onRegionChangeComplete={setMapRegion}
              initialRegion={mapRegion}
              getItemId={(spot) => spot.id}
              getItemLocation={(spot) => spot.details.location}
              getItemTitle={(spot) => spot.details.name}
              getItemDescription={(spot) =>
                `⭐ ${spot.details.overallRating.toFixed(1)}`
              }
              // Renderiza el marcador completo con callout incluido
              renderCompleteMarker={(spot, isSelected, onPress, onCalloutPress) => (
                <SpotMarker
                  key={spot.id}
                  spot={spot}
                  isSelected={isSelected}
                  onPress={onPress}
                  onCalloutPress={onCalloutPress}
                  getSportName={getSportName}
                />
              )}
              config={{
                marker: {
                  color: "#ef4444",
                  selectedColor: "#22c55e",
                },
                distanceCircle: {
                  enabled: searchFilters.maxDistance !== undefined,
                  maxDistance: searchFilters.maxDistance,
                },
                region: {
                  autoCenter: shouldCenterOnUser,
                  autoCenterOnResults: false,
                },
              }}
            >
              {/* Marcador de creación de spot */}
              {createSpotLocation && (
                <MapMarker
                  coordinate={{
                    latitude: createSpotLocation.latitude,
                    longitude: createSpotLocation.longitude,
                  }}
                  data={null}
                  color="#22c55e"
                  size={40}
                  onPress={handleCreateSpotPress}
                  calloutConfig={{
                    showDefault: true,
                    tooltip: false,
                  }}
                  renderCallout={() => (
                    <Pressable
                      onPress={handleCreateSpotPress}
                      className="bg-white rounded-lg p-3 shadow-lg min-w-[150px]"
                    >
                      <VStack className="gap-1 items-center">
                        <Text className="text-base font-bold text-green-600">
                          ➕ Crear Spot
                        </Text>
                        <Text className="text-xs text-gray-600 text-center">
                          Toca para crear un spot aquí
                        </Text>
                      </VStack>
                    </Pressable>
                  )}
                />
              )}
            </MapSearchMap>
            
            {/* Card modal del spot seleccionado */}
            <SpotCardModal
              spot={selectedSpot || undefined}
              visible={showSpotCard}
              distance={mapResults.find((r) => r.item.id === selectedSpot?.id)?.location.distance}
              onClose={handleCloseSpotCard}
              onPress={handleSpotPress}
              getSportName={getSportName}
              collectionSlot={selectedSpot ? <SpotCollectionSelector spotId={selectedSpot.id} /> : undefined}
            />
          </View>
        ) : (
          <MapSearchResultList
            results={mapResults}
            onItemPress={handleSpotPress}
            selectedItemId={selectedSpotId}
            isLoading={isSearching}
            error={null}
            emptyMessage="No se encontraron spots deportivos"
            renderItem={renderResultItem}
            listHeaderComponent={
              filteredSpots.length > 0 && !isSearching ? (
                <View className="px-4 py-2 bg-gray-50">
                  <HStack className="justify-between items-center">
                    <Text className="text-sm text-gray-600">
                      {filteredSpots.length}{" "}
                      {filteredSpots.length === 1 ? "spot encontrado" : "spots encontrados"}
                    </Text>
                    
                    {/* Selector de ordenamiento */}
                    <HStack className="gap-2">
                      <Pressable
                        onPress={() => setSortBy('distance')}
                        className={`px-3 py-1.5 rounded-lg ${
                          sortBy === 'distance' ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      >
                        <Text className={`text-xs font-medium ${
                          sortBy === 'distance' ? 'text-white' : 'text-gray-700'
                        }`}>
                          Cercanía
                        </Text>
                      </Pressable>
                      
                      <Pressable
                        onPress={() => setSortBy('rating')}
                        className={`px-3 py-1.5 rounded-lg ${
                          sortBy === 'rating' ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      >
                        <Text className={`text-xs font-medium ${
                          sortBy === 'rating' ? 'text-white' : 'text-gray-700'
                        }`}>
                          Rating
                        </Text>
                      </Pressable>
                    </HStack>
                  </HStack>
                </View>
              ) : null
            }
          />
        )}

        {/* Modal de filtros */}
        <SpotSearchFilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          filters={searchFilters}
          onApplyFilters={(newFilters) => {
            shouldSearchAfterFiltersRef.current = true;
            setSearchFilters(newFilters);
            setShowFilters(false);
          }}
          onResetFilters={() => {
            setSearchFilters({
              sports: [],
              sportCriteria: [],
              maxDistance: undefined,
              minRating: 0,
              onlyVerified: false,
            });
          }}
        />
      </VStack>
    </SafeAreaView>
  );
}
