import { RatingStar } from "@/src/components/commons/rating-start/rating-star";
import { HStack } from "@/src/components/ui/hstack";
import { Image } from "@/src/components/ui/image";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SpotDetails } from "@/src/types/spot";


interface SpotDataDetailsProps {
  spotDetails: SpotDetails;
}

export const SpotDataDetails: React.FC<SpotDataDetailsProps> = ({ spotDetails}) => {

    return (
        <VStack className="w-full flex-1 px-6 pt-6">
            <Image source={{ uri: spotDetails.images[0] }} alt={spotDetails.name} className="w-full h-64 object-cover rounded-lg" />
            <HStack className="w-full flex-row justify-between items-center mt-4">
            <Text size="2xl" className="font-bold mt-4">{spotDetails.name}</Text>
                <RatingStar rating={spotDetails.rating} />
            </HStack>
            <Text className="pt-2" >{spotDetails.description}</Text>

        </VStack>
    );
};
 