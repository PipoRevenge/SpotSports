import { Button, ButtonText } from "@/src/components/ui/button";
import { VStack } from "@/src/components/ui/vstack";

import { router } from "expo-router";

import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyFeedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <VStack style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Accesos rápidos
        </Text>

        <Button
          variant="outline"
          onPress={() => {
            router.push("../spot/create-spot");
          }}
        >
          <ButtonText>Crear Spot</ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={() => {
            router.push("/users");
          }}
        >
          <ButtonText>Ver todos los usuarios</ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={() => {
            router.push("/chat");
          }}
        >
          <ButtonText>Ver chats</ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={() => {
            router.push("/notifications");
          }}
        >
          <ButtonText>Ver notificaciones</ButtonText>
        </Button>

        <Button
          variant="outline"
          onPress={() => {
            router.push("../test/tests");
          }}
          style={{ marginTop: 10 }}
        >
          <ButtonText>Ir a la página de tests</ButtonText>
        </Button>

        <Text style={{ color: "#6b7280", fontSize: 12 }}>
          Los flujos de prueba ahora viven en la página de tests.
        </Text>
      </VStack>
    </SafeAreaView>
  );
}
