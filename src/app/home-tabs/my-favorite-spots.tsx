import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";

export default function MyFavoriteSpotsScreen() {
  return (
    <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Favorite Spots</Text>
      <Text>Your saved spots will appear here!</Text>
    </VStack>
  );
}
