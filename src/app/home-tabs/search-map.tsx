import { HStack } from "@/src/components/ui/hstack";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import {
    formatDistance,
    MapAreaSearchIndicator,
    MapSearchBar,
    MapSearchMap,
    MapSearchResult,
    MapSearchResultItem,
    MapSearchResultList,
    SpotCardModal,
    useMapAreaSearch,
} from "@/src/features/map-search";
import {
    SpotSearchFilterModal,
    useSpotFilters,
    useSpotMapSearch,
} from "@/src/features/spot";
import { useUserLocation } from "@/src/hooks/use-user-location";
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
  const [selectedSpot, setSelectedSpot] = useState<Spot | undefined>();
  const [showSpotCard, setShowSpotCard] = useState(false);
  const hasSearchedRef = useRef(false);

  // ==================== HOOKS DE FEATURES ====================
  // Ubicación del usuario
  const { location: userLocation, isLoading: isLoadingLocation } = useUserLocation(true);

  // Gestión del área visible del mapa y búsqueda automática
  const {
    mapRegion,
    searchLocation,
    searchRadius,
    shouldCenterOnUser,
    setMapRegion,
    clearAreaSearch,
  } = useMapAreaSearch({
    autoSearch: !isLoadingLocation, // Solo buscar automáticamente cuando ya tengamos (o no) la ubicación
    debounceMs: 1000,
  });

  // Gestión de filtros de spots
  const { filters, updateFilters, resetFilters, activeFiltersCount } =
    useSpotFilters({
      onFiltersChange: () => {
        // Limpiar búsqueda en área visible al cambiar filtros
        clearAreaSearch();
      },
    });

  // Búsqueda de spots con mapeo de nombres de deportes
  const {
    filteredSpots,
    loading: isSearching,
    searchQuery,
    setSearchQuery,
    getSportName,
    searchSpots,
  } = useSpotMapSearch({
    userLocation: userLocation || undefined,
    searchLocation: searchLocation,
    searchRadius: searchRadius,
    autoSearch: true, // Búsqueda automática solo para cambios de ubicación/área
  });

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Maneja la búsqueda cuando el usuario presiona Enter
   */
  const handleSearch = useCallback(() => {
    searchSpots();
  }, [searchSpots]);

  /**
   * Función auxiliar para convertir los spots del hook al formato de MapSearchResult
   */
  const spotsToMapResults = useCallback(
    (spots: Spot[]): MapSearchResult<Spot>[] => {
      return spots.map((spot) => {
        // Calcular distancia si hay ubicación del usuario
        let distance: number | undefined = undefined;
        if (userLocation) {
          const R = 6371; // Radio de la Tierra en km
          const dLat = ((spot.details.location.latitude - userLocation.latitude) * Math.PI) / 180;
          const dLon = ((spot.details.location.longitude - userLocation.longitude) * Math.PI) / 180;
          
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLocation.latitude * Math.PI) / 180) *
              Math.cos((spot.details.location.latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c;
        }

        return {
          item: spot,
          location: {
            latitude: spot.details.location.latitude,
            longitude: spot.details.location.longitude,
            distance,
          },
        };
      });
    },
    [userLocation]
  );

  // Convertir spots a resultados de mapa
  const mapResults = spotsToMapResults(filteredSpots);

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
   */
  const handleMarkerPress = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    setSelectedSpotId(spot.id);
    setShowSpotCard(true);
  }, []);

  /**
   * Maneja el press en un spot desde la lista o el card
   * Navega a la página del spot
   */
  const handleSpotPress = useCallback((spot: Spot) => {
    router.push(`/spot/spot-page?spotId=${spot.id}`);
  }, []);

  /**
   * Cierra el card del spot
   */
  const handleCloseSpotCard = useCallback(() => {
    setShowSpotCard(false);
    setSelectedSpot(undefined);
    setSelectedSpotId(undefined);
  }, []);

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
              <HStack className="items-center gap-1 ml-2">
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
            <HStack className="flex-wrap gap-1 mt-1">
              {spot.details.availableSports.slice(0, 3).map((sportId: string) => (
                <View
                  key={sportId}
                  className="bg-blue-100 px-2 py-1 rounded-full"
                >
                  <Text className="text-xs text-blue-700">{getSportName(sportId)}</Text>
                </View>
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
              <View className="absolute top-4 left-1/2 -ml-32 z-10 bg-blue-500 rounded-lg px-4 py-3 shadow-lg">
                <HStack className="items-center gap-2">
                  <View className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <Text className="text-white font-semibold">
                    Obteniendo tu ubicación...
                  </Text>
                </HStack>
              </View>
            )}
            
            <MapSearchMap
              results={mapResults}
              userLocation={userLocation || undefined}
              selectedItemId={selectedSpotId}
              onMarkerPress={handleMarkerPress}
              onRegionChangeComplete={setMapRegion}
              initialRegion={mapRegion}
              getItemId={(spot) => spot.id}
              getItemLocation={(spot) => spot.details.location}
              getItemTitle={(spot) => spot.details.name}
              getItemDescription={(spot) =>
                `⭐ ${spot.details.overallRating.toFixed(1)}`
              }
              config={{
                marker: {
                  color: "#ef4444",
                  selectedColor: "#22c55e",
                },
                distanceCircle: {
                  enabled: filters.maxDistance !== undefined,
                  maxDistance: filters.maxDistance,
                },
                region: {
                  autoCenter: shouldCenterOnUser,
                  autoCenterOnResults: false,
                },
              }}
            />
            
            {/* Card modal del spot seleccionado */}
            <SpotCardModal
              spot={selectedSpot}
              visible={showSpotCard}
              distance={mapResults.find((r) => r.item.id === selectedSpot?.id)?.location.distance}
              onClose={handleCloseSpotCard}
              onPress={handleSpotPress}
              getSportName={getSportName}
            />
            
            {/* Indicador de búsqueda en área visible (automática) */}
            <MapAreaSearchIndicator
              searchLocation={searchLocation}
              searchRadius={searchRadius}
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
                  <Text className="text-sm text-gray-600">
                    {filteredSpots.length}{" "}
                    {filteredSpots.length === 1 ? "spot encontrado" : "spots encontrados"}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Modal de filtros */}
        <SpotSearchFilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onApplyFilters={(newFilters) => {
            updateFilters(newFilters);
            setShowFilters(false);
            // Usar setTimeout para asegurar que los filtros se actualicen antes de buscar
            setTimeout(() => {
              searchSpots();
            }, 0);
          }}
          onResetFilters={() => {
            resetFilters();
            clearAreaSearch();
          }}
        />
      </VStack>
    </SafeAreaView>
  );
}
