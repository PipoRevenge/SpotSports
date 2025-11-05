import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { MapSearchResultListProps } from "../types/map-types";

/**
 * Componente genérico para lista de resultados de búsqueda
 * 
 * Características:
 * - FlatList con separadores
 * - Estados de loading, error y empty
 * - Header y footer personalizables
 * - Renderizado optimizado
 * - Render prop para items personalizados
 * 
 * @example
 * ```tsx
 * <MapSearchResultList
 *   results={searchResults}
 *   onItemPress={(spot) => navigate(`/spot/${spot.id}`)}
 *   selectedItemId={selectedSpotId}
 *   isLoading={isSearching}
 *   error={searchError}
 *   emptyMessage="No se encontraron spots"
 *   renderItem={(result) => (
 *     <MapSearchResultItem
 *       item={result.item}
 *       distance={result.location.distance}
 *       onPress={onItemPress}
 *       isSelected={selectedItemId === result.item.id}
 *       renderContent={(spot, distance) => <SpotCard spot={spot} distance={distance} />}
 *     />
 *   )}
 *   listHeaderComponent={
 *     <Text className="p-4 font-bold">Resultados cerca de ti</Text>
 *   }
 * />
 * ```
 */
export const MapSearchResultList = <T,>({
  results,
  onItemPress,
  selectedItemId,
  isLoading = false,
  error = null,
  emptyMessage = "No se encontraron resultados",
  renderItem,
  listHeaderComponent,
  listFooterComponent,
}: MapSearchResultListProps<T>): React.ReactElement => {
  /**
   * Renderiza un item de la lista
   */
  const renderListItem = ({ item }: { item: typeof results[0] }) => {
    return <View className="px-4 py-2">{renderItem(item)}</View>;
  };

  /**
   * Separador entre items
   */
  const renderSeparator = () => <View className="h-2" />;

  /**
   * Extrae la key de un item
   */
  const keyExtractor = (_item: typeof results[0], index: number) => {
    return `result-${index}`;
  };

  /**
   * Renderiza el estado de loading
   */
  if (isLoading) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Buscando...</Text>
      </VStack>
    );
  }

  /**
   * Renderiza el estado de error
   */
  if (error) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-red-600 text-center font-semibold">
          ⚠️ Error
        </Text>
        <Text className="mt-2 text-gray-600 text-center">{error}</Text>
      </VStack>
    );
  }

  /**
   * Renderiza el estado vacío
   */
  if (results.length === 0) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-400 text-6xl mb-4">🔍</Text>
        <Text className="text-gray-600 text-center">{emptyMessage}</Text>
      </VStack>
    );
  }

  /**
   * Renderiza la lista de resultados
   */
  return (
    <FlatList
      data={results}
      renderItem={renderListItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={
        listHeaderComponent ? () => <>{listHeaderComponent}</> : undefined
      }
      ListFooterComponent={
        listFooterComponent ? () => <>{listFooterComponent}</> : undefined
      }
      contentContainerStyle={{
        paddingVertical: 8,
      }}
      showsVerticalScrollIndicator={false}
      // Optimizaciones de performance
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
};
