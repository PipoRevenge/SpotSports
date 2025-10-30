import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { CloseIcon, GlobeIcon, MenuIcon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Spinner } from "@/src/components/ui/spinner";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import {
  SpotCard,
  SpotListCard,
  SpotSearchBar,
  SpotSearchFilterModal,
  SpotSearchFilters,
  SpotSearchMap,
  useSpotSearch,
} from "@/src/features/spot";
import { useUserLocation } from "@/src/hooks/use-user-location";
import React, { useState } from "react";
import { FlatList, View } from "react-native";

type ViewMode = "map" | "list" | "grid";

export default function SearchSpotsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showNoSpotsMessage, setShowNoSpotsMessage] = useState(true);
  
  // Obtener ubicación del usuario automáticamente
  const { location: userLocation, error: locationError } = useUserLocation(true);

  // Hook de búsqueda de spots
  const {
    filteredSpots,
    loading,
    error,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
    searchSpots,
    calculateDistance,
  } = useSpotSearch({
    userLocation: userLocation || undefined,
  });

  const handleSearch = () => {
    setShowNoSpotsMessage(true);
    searchSpots();
  };

  const handleApplyFilters = (newFilters: SpotSearchFilters) => {
    setFilters(newFilters);
    setShowNoSpotsMessage(true);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const hasActiveFilters =
    filters.sports.length > 0 ||
    filters.minRating > 0 ||
    filters.onlyVerified ||
    filters.maxDistance !== 10;

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <VStack className="flex-1">
        {/* Barra de búsqueda */}
        <VStack className="px-4 pt-4 pb-2 bg-white border-b border-background-200">
          <HStack className="gap-2 items-center">
            <VStack className="flex-1">
              <SpotSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery("")}
                onFilterPress={() => setFilterModalVisible(true)}
                filterActive={hasActiveFilters}
                showFilterButton={false}
              />
            </VStack>
            <Button
              size="md"
              onPress={handleSearch}
              isDisabled={loading}
            >
              <ButtonText>Buscar</ButtonText>
            </Button>
            <Button
              size="md"
              variant="outline"
              onPress={() => setFilterModalVisible(true)}
              action={hasActiveFilters ? "primary" : "secondary"}
            >
              <ButtonIcon as={MenuIcon} />
            </Button>
          </HStack>

          {/* Botones de vista y resultados */}
          <HStack className="mt-3 justify-between items-center">
            <Text className="text-sm text-typography-600">
              {filteredSpots.length} spot{filteredSpots.length !== 1 ? "s" : ""} encontrado{filteredSpots.length !== 1 ? "s" : ""}
            </Text>

            <HStack className="gap-2">
              <Button
                size="sm"
                variant={viewMode === "map" ? "solid" : "outline"}
                onPress={() => setViewMode("map")}
              >
                <ButtonIcon as={GlobeIcon} />
                <ButtonText>Mapa</ButtonText>
              </Button>
              
              <Button
                size="sm"
                variant={viewMode === "list" ? "solid" : "outline"}
                onPress={() => setViewMode("list")}
              >
                <ButtonIcon as={MenuIcon} />
                <ButtonText>Lista</ButtonText>
              </Button>
            </HStack>
          </HStack>
        </VStack>

        {/* Contenido principal */}
        {loading ? (
          <VStack className="flex-1 items-center justify-center">
            <Spinner size="large" />
            <Text className="mt-4 text-typography-600">Buscando spots...</Text>
          </VStack>
        ) : error ? (
          <VStack className="flex-1 items-center justify-center px-4">
            <Text className="text-lg text-error-600 text-center mb-2">
              Error al cargar spots
            </Text>
            <Text className="text-typography-500 text-center">{error}</Text>
          </VStack>
        ) : (
          <>
            {/* Vista de mapa */}
            {viewMode === "map" && (
              <VStack className="flex-1">
                <SpotSearchMap
                  spots={filteredSpots}
                  userLocation={userLocation || undefined}
                  maxDistance={filters.maxDistance}
                  onSpotPress={(spot) => {
                    // TODO: Navegar a página de detalles
                    console.log("Spot seleccionado:", spot.details.name);
                  }}
                />
                {filteredSpots.length === 0 && showNoSpotsMessage && (
                  <VStack className="absolute bg-white rounded-lg p-4 shadow-lg" style={{ top: '50%', left: '50%', transform: [{ translateX: -120 }, { translateY: -60 }], width: 240 }}>
                    <Pressable
                      onPress={() => setShowNoSpotsMessage(false)}
                      className="absolute top-1 right-1 p-2 z-10 bg-background-100 rounded-full"
                    >
                      <CloseIcon className="text-typography-700 w-4 h-4" />
                    </Pressable>
                    <Text className="text-typography-900 font-semibold text-center mb-1 pr-6">
                      No hay spots en esta área
                    </Text>
                    <Text className="text-typography-500 text-center text-sm">
                      Ajusta los filtros o explora otra zona
                    </Text>
                  </VStack>
                )}
              </VStack>
            )}

            {/* Vista de lista */}
            {viewMode === "list" && (
              <>
                {filteredSpots.length === 0 ? (
                  <VStack className="flex-1 items-center justify-center px-4">
                    <Text className="text-lg text-typography-900 font-semibold mb-2">
                      No se encontraron spots
                    </Text>
                    <Text className="text-typography-500 text-center">
                      Intenta ajustar tus filtros de búsqueda
                    </Text>
                  </VStack>
                ) : (
                  <FlatList
                    data={filteredSpots}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <SpotListCard
                        spot={item}
                        distance={calculateDistance(item)}
                        onPress={() => {
                          // TODO: Navegar a página de detalles
                          console.log("Spot seleccionado:", item.details.name);
                        }}
                      />
                    )}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </>
            )}

            {/* Vista de grid */}
            {viewMode === "grid" && (
              <>
                {filteredSpots.length === 0 ? (
                  <VStack className="flex-1 items-center justify-center px-4">
                    <Text className="text-lg text-typography-900 font-semibold mb-2">
                      No se encontraron spots
                    </Text>
                    <Text className="text-typography-500 text-center">
                      Intenta ajustar tus filtros de búsqueda
                    </Text>
                  </VStack>
                ) : (
                  <FlatList
                    data={filteredSpots}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={{ width: "50%", padding: 8 }}>
                        <SpotCard
                          id={item.id}
                          name={item.details.name}
                          number={item.details.overallRating}
                          imageUrl={item.details.media[0] || "https://via.placeholder.com/150"}
                          onPress={() => {
                            // TODO: Navegar a página de detalles
                            console.log("Spot seleccionado:", item.details.name);
                          }}
                        />
                      </View>
                    )}
                    numColumns={2}
                    contentContainerStyle={{ padding: 8 }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Error de ubicación */}
        {locationError && (
          <VStack className="absolute bottom-4 left-4 right-4 bg-warning-100 border border-warning-300 rounded-lg p-3">
            <Text className="text-sm text-warning-700">
              ⚠️ No se pudo obtener tu ubicación. Los resultados no se ordenarán por distancia.
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Modal de filtros */}
      <SpotSearchFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </SafeAreaView>
  );
}

