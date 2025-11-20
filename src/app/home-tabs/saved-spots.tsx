import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/entities/user/context/user-context";
import { SpotCategory } from "@/src/entities/user/model/spot-collection";
import { SpotListCard, useSpotsByIds } from '@/src/features/spot';

import { SPOT_CATEGORIES, useSpotCollection } from "@/src/features/spot-collection";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

export default function SavedSpotsScreen() {
  const { user } = useUser();
  const { savedSpots, loadSavedSpots, isLoading: isCollectionLoading } = useSpotCollection();
  const [selectedTab, setSelectedTab] = useState<SpotCategory>('Favorites');
  // Derived from the useSpotsByIds hook
  // Remove local loading state - use collection loading and hook loading instead
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar detalles de los spots cuando cambien los savedSpots
   */
  // Usar el hook useSpotsByIds para evitar llamadas directas a repositorios desde la app
  const spotIds = useMemo(() => savedSpots.map(ss => ss.spotId), [savedSpots]);
  const { spots: fetchedSpots, loading: spotsLoading } = useSpotsByIds(spotIds);

  // No local state required; use `fetchedSpots` directly

  /**
   * Efecto para cargar spots cuando cambia el tab seleccionado
   */
  useEffect(() => {
    if (!user?.id) return;

    const loadCategorySpots = async () => {
      setError(null);
      
      try {
        await loadSavedSpots(selectedTab);
      } catch (err) {
        console.error("Error loading spots:", err);
        setError("Error al cargar spots");
      }
    };

    loadCategorySpots();
  }, [selectedTab, user?.id, loadSavedSpots]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      await loadSavedSpots(selectedTab);
    } catch (err) {
      console.error("Error refreshing spots:", err);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, selectedTab, loadSavedSpots]);

  const handleSpotPress = (spotId: string) => {
    router.push(`/spot/${spotId}`);
  };

  const renderTabButton = (tab: typeof SPOT_CATEGORIES[0]) => {
    const isSelected = selectedTab === tab.type;
    
    return (
      <Pressable
        key={tab.type}
        onPress={() => setSelectedTab(tab.type)}
        className={`flex-1 py-3 items-center border-b-2 ${
          isSelected ? 'border-blue-500' : 'border-gray-200'
        }`}
      >
        <HStack className="items-center gap-2">
          <Icon 
            as={tab.icon} 
            size={18} 
            color={isSelected ? "#2563eb" : "#6b7280"}
          />
          <Text className={`font-medium ${
            isSelected ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {tab.label}
          </Text>
        </HStack>
      </Pressable>
    );
  };

  const isLoading = isCollectionLoading || spotsLoading;

  // We display a loading indicator inline in the tabs area instead of blocking full page

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-600 text-lg font-semibold">Error</Text>
          <Text className="pt-2 text-gray-600 text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <VStack className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold">Mis Colecciones</Text>
          <Text className="text-gray-600 pt-1">
            {fetchedSpots.length} {fetchedSpots.length === 1 ? 'spot' : 'spots'}
          </Text>
        </View>

        {/* Tabs */}
        <HStack className="bg-white border-b border-gray-200">
          {SPOT_CATEGORIES.map(renderTabButton)}
        </HStack>

        {/* Lista de spots */}
        {isLoading && !refreshing ? (
          <View className="flex-1 justify-center items-center p-6">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="pt-4 text-gray-600">Cargando spots...</Text>
          </View>
        ) : fetchedSpots.length === 0 ? (
          <View className="flex-1 justify-center items-center p-6">
            <Icon 
              as={SPOT_CATEGORIES.find(t => t.type === selectedTab)?.icon} 
              size={60} 
              color="#d1d5db" 
              className="pb-4"
            />
            <Text className="text-gray-600 text-center font-semibold text-lg">
              No tienes spots en {SPOT_CATEGORIES.find(t => t.type === selectedTab)?.label}
            </Text>
            <Text className="text-gray-500 text-center text-sm pt-2">
              Explora y guarda spots para verlos aquí
            </Text>
          </View>
        ) : (
          <FlatList
            data={fetchedSpots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SpotListCard
                spot={item}
                distance={0}
                showDistance={false}
                onPress={() => handleSpotPress(item.id)}
              />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0000ff"]}
              />
            }
          />
        )}
      </VStack>
    </SafeAreaView>
  );
}
