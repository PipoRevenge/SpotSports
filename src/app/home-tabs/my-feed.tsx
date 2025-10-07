import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";

export default function MyFeedScreen() {
  return (
    <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My Feed</Text>
      <Text>Latest updates from your favorite spots and sports!</Text>
    </VStack>
  );
}
