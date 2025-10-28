import { Button, ButtonText } from "@/src/components/ui/button";
import { VStack } from "@/src/components/ui/vstack";

import { router } from "expo-router";

export default function MyFeedScreen() {
  return (
    <VStack style={{ flex: 1, padding: 16 }}>

      <Button variant="outline" onPress={() => { router.push('../spot/create-spot'); }}>
        <ButtonText>Crear Spot</ButtonText>
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

    </VStack>
  );
}
