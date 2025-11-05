import { HStack } from "@/src/components/ui/hstack";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import {
  formatDistance,
  MapSearchBar,
  MapSearchFilterModal,
  MapSearchMap,
  MapSearchResult,
  MapSearchResultItem,
  MapSearchResultList,
} from "@/src/features/map-search";
import {
  DistanceFilter,
  RatingFilter,
  SportFilter,
  SportFilterCriteria,
  SportSelectedFilter,
  useSpotMapSearch,
  VerifiedFilter
} from "@/src/features/spot";
import { useUserLocation } from "@/src/hooks/use-user-location";
import { router } from "expo-router";
import { List as ListIcon, Map as MapIcon, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, View } from "react-native";
import { Region } from "react-native-maps";

/**
 * Página de búsqueda de spots en mapa
 * Usa los componentes genéricos de map-search con lógica específica de spots
 */
export default function SearchMapScreen() {
  // Estado de ubicación del usuario
  const { location: userLocation } = useUserLocation(true);

  // Estado de vista (mapa o lista)
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Estado del modal de filtros
  const [showFilters, setShowFilters] = useState(false);

  // Estado del spot seleccionado
  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>();

  // Estado para el modal del spot (card inferior)
  const [selectedSpot, setSelectedSpot] = useState<Spot | undefined>();
  const [showSpotCard, setShowSpotCard] = useState(false);

  // Referencia para evitar búsquedas duplicadas
  const hasSearchedRef = useRef(false);

  // Estado para guardar la región visible del mapa
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);

  // Estado para controlar si debemos centrar en el usuario (solo la primera vez)
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(true);

  // Estado para la búsqueda en área visible (independiente del filtro de distancia)
  const [searchLocation, setSearchLocation] = useState<{
    latitude: number;
    longitude: number;
  } | undefined>(undefined);
  
  const [searchRadius, setSearchRadius] = useState<number | undefined>(undefined);

  /**
   * Hook de búsqueda de spots con mapeo de nombres de deportes
   */
  const {
    filteredSpots,
    loading: isSearching,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
    getSportName,
  } = useSpotMapSearch({
    userLocation: userLocation || undefined,
    searchLocation: searchLocation,
    searchRadius: searchRadius,
    autoSearch: true, // Buscar automáticamente cuando cambian los filtros
  });

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
   * Función para actualizar filtros
   * Actualiza los filtros del hook que automáticamente disparará una búsqueda
   * Al cambiar filtros, limpia la búsqueda en área visible
   */
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    console.log("[SearchMapScreen] Updating filters:", newFilters);
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Limpiar búsqueda en área visible al cambiar filtros
    setSearchLocation(undefined);
    setSearchRadius(undefined);
  }, [filters, setFilters]);

  /**
   * Efecto para ejecutar búsqueda inicial cuando se obtiene la ubicación del usuario
   * El hook ya tiene autoSearch activado, así que esto es solo para el log inicial
   */
  useEffect(() => {
    if (userLocation && !hasSearchedRef.current && filteredSpots.length === 0 && !isSearching) {
      console.log("[SearchMapScreen] User location available, initial search will be triggered by hook");
      hasSearchedRef.current = true;
    }
  }, [userLocation, filteredSpots.length, isSearching]);

  /**
   * Maneja el cambio de región del mapa
   */
  const handleRegionChange = useCallback((region: Region) => {
    console.log("[SearchMapScreen] Map region changed:", region);
    setMapRegion(region);
    
    // Después de la primera vez, no centramos más en el usuario automáticamente
    if (shouldCenterOnUser) {
      setShouldCenterOnUser(false);
    }
  }, [shouldCenterOnUser]);

  /**
   * Ejecuta la búsqueda en el área visible del mapa
   * Calcula el centro y radio de la región visible, independiente del filtro de distancia
   */
  const searchInVisibleArea = useCallback(() => {
    if (!mapRegion) {
      console.log("[SearchMapScreen] No map region available");
      return;
    }

    console.log("[SearchMapScreen] Searching in visible area");
    console.log("[SearchMapScreen] Current map region:", mapRegion);
    
    // Calcular el centro de la región visible (donde está mirando el usuario)
    const centerLocation = {
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    };
    
    // Calcular un radio aproximado basado en los deltas de la región
    // latitudeDelta ~ 111 km por grado de latitud
    // longitudeDelta varía con la latitud: ~ 111 * cos(latitude) km por grado
    const latDistance = mapRegion.latitudeDelta * 111;
    const lonDistance = mapRegion.longitudeDelta * 111 * Math.cos(mapRegion.latitude * Math.PI / 180);
    
    // Usar el radio que cubra la diagonal de la región visible + 20% de margen
    const diagonalDistance = Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
    const calculatedRadius = (diagonalDistance / 2) * 1.2; // Radio + 20% de margen
    
    console.log("[SearchMapScreen] Center location:", centerLocation);
    console.log("[SearchMapScreen] Calculated radius:", calculatedRadius, "km");
    console.log("[SearchMapScreen] Lat distance:", latDistance, "km");
    console.log("[SearchMapScreen] Lon distance:", lonDistance, "km");
    
    // Establecer la ubicación y radio de búsqueda
    // Esto disparará una nueva búsqueda automáticamente
    setSearchLocation(centerLocation);
    setSearchRadius(calculatedRadius);
  }, [mapRegion]);

  /**
   * Efecto para búsqueda automática cuando el usuario explora el mapa
   * Usa debounce para evitar búsquedas mientras el usuario está arrastrando
   */
  useEffect(() => {
    if (!mapRegion) return;

    // Debounce de 1 segundo después de que el usuario deje de mover el mapa
    const timeoutId = setTimeout(() => {
      console.log("[SearchMapScreen] Auto-searching after map exploration");
      searchInVisibleArea();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [mapRegion, searchInVisibleArea]); // Se ejecuta cada vez que cambia la región del mapa

  /**
   * Calcula la cantidad de filtros activos
   */
  const activeFiltersCount = [
    filters.maxDistance !== undefined, // Filtro de distancia activo
    filters.minRating && filters.minRating > 0,
    filters.sports && filters.sports.length > 0,
    filters.onlyVerified === true,
    filters.sportCriteria && filters.sportCriteria.length > 0,
  ].filter(Boolean).length;

  /**
   * Maneja el press en un marcador del mapa
   * Muestra el card inferior con la información del spot
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
              {spot.details.availableSports.slice(0, 3).map((sportId) => (
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

  /**
   * Renderiza el card del spot seleccionado (modal inferior)
   */
  const renderSpotCard = useCallback(() => {
    if (!selectedSpot) return null;

    const result = mapResults.find((r: MapSearchResult<Spot>) => r.item.id === selectedSpot.id);
    const distance = result?.location.distance;

    return (
      <Modal
        visible={showSpotCard}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseSpotCard}
      >
        <Pressable 
          className="flex-1 justify-end bg-black/50"
          onPress={handleCloseSpotCard}
        >
          <Pressable 
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView className="max-h-[70vh]">
              <VStack className="p-4 gap-4">
                {/* Header con botón cerrar */}
                <HStack className="justify-between items-center">
                  <Text className="text-lg font-bold text-typography-900 flex-1">
                    Información del Spot
                  </Text>
                  <Pressable
                    onPress={handleCloseSpotCard}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <X size={20} color="#6b7280" />
                  </Pressable>
                </HStack>

                {/* Imagen del spot */}
                {selectedSpot.details.media && selectedSpot.details.media.length > 0 ? (
                  <Image
                    source={{ uri: selectedSpot.details.media[0] }}
                    className="w-full h-48 rounded-xl bg-black"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-full h-48 rounded-xl bg-gray-200 items-center justify-center">
                    <Text className="text-gray-400 text-5xl">📍</Text>
                  </View>
                )}

                {/* Nombre del spot */}
                <VStack className="gap-2">
                  <Text className="text-2xl font-bold text-typography-900">
                    {selectedSpot.details.name}
                  </Text>

                  {/* Rating y Verificado */}
                  <HStack className="items-center gap-3">
                    <HStack className="items-center gap-1">
                      <Text className="text-base font-semibold text-typography-700">
                        {selectedSpot.details.overallRating.toFixed(1)}
                      </Text>
                      <Text className="text-yellow-500 text-base">⭐</Text>
                    </HStack>
                    
                    {selectedSpot.metadata.isVerified && (
                      <View className="flex-row items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-sm text-blue-600 font-semibold">✓</Text>
                        <Text className="text-sm text-blue-600 font-semibold">
                          Verificado
                        </Text>
                      </View>
                    )}
                  </HStack>

                  {/* Distancia */}
                  {distance !== undefined && (
                    <HStack className="items-center gap-1">
                      <Text className="text-gray-500">📍</Text>
                      <Text className="text-base text-gray-600">
                        {formatDistance(distance)}
                      </Text>
                    </HStack>
                  )}
                </VStack>

                {/* Deportes disponibles */}
                {selectedSpot.details.availableSports.length > 0 && (
                  <VStack className="gap-2">
                    <Text className="text-sm font-semibold text-typography-800">
                      Deportes disponibles:
                    </Text>
                    <HStack className="flex-wrap gap-2">
                      {selectedSpot.details.availableSports.map((sportId) => (
                        <View
                          key={sportId}
                          className="bg-blue-100 px-3 py-2 rounded-full"
                        >
                          <Text className="text-sm text-blue-700 font-medium">
                            {getSportName(sportId)}
                          </Text>
                        </View>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {/* Descripción si existe */}
                {selectedSpot.details.description && (
                  <VStack className="gap-2">
                    <Text className="text-sm font-semibold text-typography-800">
                      Descripción:
                    </Text>
                    <Text className="text-base text-gray-600">
                      {selectedSpot.details.description}
                    </Text>
                  </VStack>
                )}

                {/* Botón para ver detalles completos */}
                <Pressable
                  onPress={() => {
                    handleCloseSpotCard();
                    handleSpotPress(selectedSpot);
                  }}
                  className="bg-blue-600 py-4 rounded-xl items-center active:bg-blue-700"
                >
                  <Text className="text-white font-bold text-base">
                    Ver detalles completos →
                  </Text>
                </Pressable>
              </VStack>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }, [selectedSpot, showSpotCard, mapResults, handleCloseSpotCard, handleSpotPress, getSportName]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        {/* Header con barra de búsqueda */}
        <VStack className="bg-white border-b border-gray-200">
          <MapSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchPress={() => {
              console.log("[SearchMapScreen] Search button pressed - search will trigger automatically");
              // La búsqueda se dispara automáticamente por el cambio de searchQuery
            }}
            onFilterPress={() => setShowFilters(true)}
            placeholder="Buscar spots deportivos..."
            showFilterButton={true}
            filterCount={activeFiltersCount}
            disabled={isSearching}
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
            <MapSearchMap
              results={mapResults}
              userLocation={userLocation || undefined}
              selectedItemId={selectedSpotId}
              onMarkerPress={handleMarkerPress}
              onRegionChangeComplete={handleRegionChange}
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
                  enabled: filters.maxDistance !== undefined, // Solo mostrar si hay filtro de distancia
                  maxDistance: filters.maxDistance,
                },
                region: {
                  autoCenter: shouldCenterOnUser, // Solo centrar en usuario la primera vez
                  autoCenterOnResults: false,
                },
              }}
            />
            
            {/* Card modal del spot seleccionado */}
            {renderSpotCard()}
            
            {/* Indicador de búsqueda en área visible (automática) */}
            {searchLocation && searchRadius && (
              <View className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-md">
                <HStack className="items-center gap-2">
                  <View className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <VStack>
                    <Text className="text-xs font-semibold text-gray-700">
                      Buscando en esta área
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Radio: {searchRadius.toFixed(1)} km
                    </Text>
                  </VStack>
                </HStack>
              </View>
            )}
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
        <MapSearchFilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => {
            console.log("[SearchMapScreen] Filters applied - search will trigger automatically");
            setShowFilters(false);
            // La búsqueda se dispara automáticamente por el cambio de filtros
          }}
          onReset={() => {
            resetFilters();
            // También limpiar búsqueda en área visible
            setSearchLocation(undefined);
            setSearchRadius(undefined);
          }}
          title="Filtros de búsqueda"
        >
          {/* Filtro de distancia con toggle */}
          <VStack space="md">
            <HStack className="justify-between items-center">
              <VStack className="flex-1">
                <Text className="font-semibold text-typography-900">
                  Filtrar por distancia
                </Text>
                <Text className="text-sm text-gray-500">
                  {filters.maxDistance
                    ? `Mostrar spots dentro de ${filters.maxDistance} km`
                    : "Mostrar todos los spots en el área visible del mapa"}
                </Text>
              </VStack>
              <Pressable
                onPress={() =>
                  updateFilters({
                    maxDistance: filters.maxDistance ? undefined : 10, // DISTANCE_CONFIG.DEFAULT cuando esté disponible
                  })
                }
                className={`w-12 h-6 rounded-full ${
                  filters.maxDistance ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    filters.maxDistance ? "translate-x-6" : "translate-x-1"
                  } mt-0.5`}
                />
              </Pressable>
            </HStack>

            {/* Slider de distancia (solo si está activo) */}
            {filters.maxDistance && (
              <DistanceFilter
                maxDistance={filters.maxDistance}
                onDistanceChange={(distance) =>
                  updateFilters({ maxDistance: distance })
                }
              />
            )}
          </VStack>

          {/* Filtro de rating mínimo */}
          <RatingFilter
            minRating={filters.minRating || 0}
            onRatingChange={(rating) => updateFilters({ minRating: rating })}
          />

          {/* Filtro de deportes */}
          <SportFilter
            selectedSports={filters.sports || []}
            onSportSelect={(sport) => {
              console.log("[SearchMapScreen] SportFilter onSportSelect called");
              console.log("[SearchMapScreen] Selected sport:", JSON.stringify(sport));
              console.log("[SearchMapScreen] Sport type:", typeof sport);
              const currentSports = filters.sports || [];
              console.log("[SearchMapScreen] Current sports:", JSON.stringify(currentSports));
              const newSports = [...currentSports, sport];
              console.log("[SearchMapScreen] New sports array:", JSON.stringify(newSports));
              updateFilters({ sports: newSports });
            }}
            onSportRemove={(sportId) => {
              console.log(`[SearchMapScreen] SportFilter onSportRemove called for sportId: ${sportId}`);
              const currentSports = filters.sports || [];
              const newSports = currentSports.filter((s) => s.id !== sportId);
              updateFilters({
                sports: newSports,
                // Remover también los criterios del deporte eliminado
                sportCriteria: (filters.sportCriteria || []).filter(
                  (c) => c.sportId !== sportId
                ),
              });
            }}
          />

          {/* Deportes seleccionados con criterios desplegables */}
          {(() => {
            console.log("[SearchMapScreen] About to render SportSelectedFilter");
            console.log("[SearchMapScreen] filters.sports:", JSON.stringify(filters.sports));
            console.log("[SearchMapScreen] filters.sportCriteria:", JSON.stringify(filters.sportCriteria));
            
            const sportsArray = filters.sports || [];
            const criteriaArray = filters.sportCriteria || [];
            
            console.log("[SearchMapScreen] sportsArray type:", typeof sportsArray);
            console.log("[SearchMapScreen] sportsArray.length:", sportsArray.length);
            console.log("[SearchMapScreen] criteriaArray type:", typeof criteriaArray);
            
            return (
              <SportSelectedFilter
                selectedSports={sportsArray}
                sportCriteria={criteriaArray}
                onSportRemove={(sportId) => {
                  console.log(`[SearchMapScreen] onSportRemove called for sportId: ${sportId}`);
                  const currentSports = filters.sports || [];
                  const newSports = currentSports.filter((s) => s.id !== sportId);
                  console.log(`[SearchMapScreen] New sports after removal:`, JSON.stringify(newSports));
                  updateFilters({
                    sports: newSports,
                    // Remover también los criterios del deporte eliminado
                    sportCriteria: (filters.sportCriteria || []).filter(
                      (c) => c.sportId !== sportId
                    ),
                  });
                }}
                onCriteriaChange={(sportId, criteria) => {
                  console.log(`[SearchMapScreen] onCriteriaChange called for sportId: ${sportId}`);
                  console.log(`[SearchMapScreen] New criteria:`, JSON.stringify(criteria));
                  const currentCriteria = filters.sportCriteria || [];
                  const existingIndex = currentCriteria.findIndex(
                    (c) => c.sportId === sportId
                  );

                  let newCriteria: SportFilterCriteria[];
                  if (existingIndex >= 0) {
                    // Actualizar criterio existente
                    newCriteria = [...currentCriteria];
                    newCriteria[existingIndex] = {
                      ...newCriteria[existingIndex],
                      ...criteria,
                    };
                    console.log(`[SearchMapScreen] Updated existing criteria at index ${existingIndex}`);
                  } else {
                    // Agregar nuevo criterio
                    newCriteria = [
                      ...currentCriteria,
                      { sportId, ...criteria },
                    ];
                    console.log(`[SearchMapScreen] Added new criteria`);
                  }
                  console.log(`[SearchMapScreen] Final newCriteria:`, JSON.stringify(newCriteria));

                  updateFilters({ sportCriteria: newCriteria });
                }}
              />
            );
          })()}

          {/* Filtro de spots verificados */}
          <VerifiedFilter
            onlyVerified={filters.onlyVerified || false}
            onToggle={() =>
              updateFilters({ onlyVerified: !filters.onlyVerified })
            }
          />
        </MapSearchFilterModal>
      </VStack>
    </SafeAreaView>
  );
}
