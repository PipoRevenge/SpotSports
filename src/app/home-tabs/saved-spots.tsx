import { spotRepository } from "@/src/api/repositories";
import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/entities/spot/model/spot";
import { useUser } from "@/src/entities/user/context/user-context";
import { SpotCategory } from "@/src/entities/user/model/spot-collection";
import { SpotListCard } from "@/src/features/spot";
import { SPOT_CATEGORIES, useSpotCollection } from "@/src/features/spot-collection";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

export default function SavedSpotsScreen() {
  const { user } = useUser();
  const { savedSpots, loadSavedSpots } = useSpotCollection();
  const [selectedTab, setSelectedTab] = useState<SpotCategory>('Favorites');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar detalles de los spots cuando cambien los savedSpots
   */
  useEffect(() => {
    const loadSpotDetails = async () => {
      if (savedSpots.length === 0) {
        setSpots([]);
        setLoading(false);
        return;
      }

      try {
        // Obtener detalles de cada spot
        const spotIds = savedSpots.map(ss => ss.spotId);
        const spotsPromises = spotIds.map(id => spotRepository.getSpotById(id));
        const spotsData = await Promise.all(spotsPromises);
        
        // Filtrar spots que no existan (por si fueron eliminados)
        const validSpots = spotsData.filter(spot => spot !== null) as Spot[];
        
        setSpots(validSpots);
      } catch (err) {
        console.error("Error loading spot details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSpotDetails();
  }, [savedSpots]);

  /**
   * Efecto para cargar spots cuando cambia el tab seleccionado
   */
  useEffect(() => {
    if (!user?.id) return;

    const loadCategorySpots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await loadSavedSpots(selectedTab);
      } catch (err) {
        console.error("Error loading spots:", err);
        setError("Error al cargar spots");
        setLoading(false);
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-4 text-gray-600">Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-600 text-lg font-semibold">Error</Text>
          <Text className="mt-2 text-gray-600 text-center">{error}</Text>
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
          <Text className="text-gray-600 mt-1">
            {spots.length} {spots.length === 1 ? 'spot' : 'spots'}
          </Text>
        </View>

        {/* Tabs */}
        <HStack className="bg-white border-b border-gray-200">
          {SPOT_CATEGORIES.map(renderTabButton)}
        </HStack>

        {/* Lista de spots */}
        {spots.length === 0 ? (
          <View className="flex-1 justify-center items-center p-6">
            <Icon 
              as={SPOT_CATEGORIES.find(t => t.type === selectedTab)?.icon} 
              size={60} 
              color="#d1d5db" 
              className="mb-4"
            />
            <Text className="text-gray-600 text-center font-semibold text-lg">
              No tienes spots en {SPOT_CATEGORIES.find(t => t.type === selectedTab)?.label}
            </Text>
            <Text className="text-gray-500 text-center text-sm mt-2">
              Explora y guarda spots para verlos aquí
            </Text>
          </View>
        ) : (
          <FlatList
            data={spots}
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
