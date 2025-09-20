import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { SpotCard } from '@/src/features/spots/components/spot-card';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView } from 'react-native';


const mockSpots = [
  {
    id: 1,
    name: "Basketball Court",
    number: 5,
    imageUrl: require("@/assets/test_data/profile_picture.png")
  },
  {
    id: 2,
    name: "Soccer Field",
    number: 4.5,
    imageUrl: require("@/assets/test_data/profile_picture.png")
  },
  {
    id: 3,
    name: "Tennis Court 444444444444444444444444444444444444444444444444444444444444",
    number: 2.7,
    imageUrl: require("@/assets/test_data/profile_picture.png")
  }
];

export const SpotCardView = () => {
  const router = useRouter();

  const handleSpotPress = (spotId: number) => {
    // Navegar a la pantalla de detalles del spot
    Alert.alert(
      "Spot seleccionado",
      `ID del spot: ${spotId}`,
      [{ text: "OK", onPress: () => {} }]
    );
  };

  return (
    <View className="flex-1 bg-background p-4">
      <ScrollView>
        <VStack space={5}>
          {mockSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              name={spot.name}
              number={spot.number}
              imageUrl={spot.imageUrl}
              onPress={() => handleSpotPress(spot.id)}
            />
          ))}
        </VStack>
      </ScrollView>
    </View>
  );
};

export default SpotCardView;
