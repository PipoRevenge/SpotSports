import { Button, ButtonText } from "@/src/components/ui/button";
import { VStack } from "@/src/components/ui/vstack";

import { router } from "expo-router";

export default function MyFeedScreen() {

  return (
    <VStack style={{ flex: 1, padding: 16, gap: 12 }}>

      <Button variant="outline" onPress={() => { router.push('../spot/create-spot'); }}>
        <ButtonText>Crear Spot</ButtonText>
      </Button>

      <Button variant="outline" onPress={() => { router.push('/users'); }}>
        <ButtonText>Ver todos los usuarios</ButtonText>
      </Button>


    </VStack>
  );
}
