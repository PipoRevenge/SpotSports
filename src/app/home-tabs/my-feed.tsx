import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SignOut } from "@/src/features/auth/components/sing-out";

export default function MyFeedScreen() {
  return (
    <VStack style={{ flex: 1, padding: 16 }}>
      {/* Header with Sign Out button */}
      <HStack className="justify-between items-center mb-6">
        <VStack>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My Feed</Text>
          <Text className="text-typography-600">Latest updates from your favorite spots and sports!</Text>
        </VStack>
        <SignOut 
          triggerText="Salir"
          variant="outline" 
          size="sm" 
        />
      </HStack>

      {/* Feed content placeholder */}
      <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-typography-500">No hay actualizaciones aún</Text>
        <Text className="text-typography-400 text-center mt-2">
          Cuando sigas spots y deportes, sus actualizaciones aparecerán aquí
        </Text>
      </VStack>
    </VStack>
  );
}
