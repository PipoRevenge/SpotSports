import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";

export default function SearchSpotsScreen() {
  return (
    <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Search Spots</Text>
      <Text>Find your perfect spot to practice sports!</Text>
    </VStack>
  );
}
