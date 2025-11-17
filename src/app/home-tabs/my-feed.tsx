import { RatingStars } from "@/src/components/commons/rating/rating-stars";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Text } from "@/src/components/ui/text";
import { View } from "@/src/components/ui/view";
import { VStack } from "@/src/components/ui/vstack";

import { router } from "expo-router";
import { useState } from "react";

export default function MyFeedScreen() {
  const [rating, setRating] = useState(3.5); // Rating inicial de 3.5 estrellas
  const [displayRating, setDisplayRating] = useState(4); // Rating solo para mostrar (no editable)

  return (
    <VStack style={{ flex: 1, padding: 16, gap: 12 }}>

      <Button variant="outline" onPress={() => { router.push('../spot/create-spot'); }}>
        <ButtonText>Crear Spot</ButtonText>
      </Button>

      <Button 
        variant="solid" 
        onPress={() => {
          router.push({
            pathname: '../spot/[spotId]',
            params: { spotId: 'RRX1RyWdp7AHCHXOvokh' }
          });
        }}
      >
        <ButtonText>Ver Spot: Albion Online</ButtonText>
      </Button>

      <Button variant="solid" onPress={async () => {
        try {

          alert('Deportes de prueba subidos exitosamente');
        } catch (error) {
          console.error('Error al subir los deportes de prueba:', error);
          alert('Hubo un error al subir los deportes de prueba');
        }
      }}>
        <ButtonText>Subir Deportes de Prueba</ButtonText>
      </Button>

      {/* Ejemplo de Rating Interactivo */}
      <View className="flex-1 border-b-2 border-dashed border-typography-200 p-4">
        <Text className="text-lg font-semibold mb-2">Rating Interactivo (selección de medio en medio):</Text>
        <RatingStars 
          value={rating}
          onChange={setRating}
          size={32}
          showValue={true}
        />
      </View>

      {/* Ejemplo de Rating Solo Lectura */}
      <View className="flex-1 border-b-2 border-dashed border-typography-200 p-4">
        <Text className="text-lg font-semibold mb-2">Rating Solo Lectura:</Text>
        <RatingStars 
          value={displayRating}
          size={28}
          disabled
          showValue={true}
        />
      </View>

    </VStack>
  );
}
