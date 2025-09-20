import { RatingStarComponent } from "@/src/components/commons/rating/rating-star-component";
import { HStack } from "@/src/components/ui/hstack";
import { Image } from "@/src/components/ui/image";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Spot } from "@/src/types/spot";


interface SpotDataDetailsProps {
  spot: Spot;
}

export const SpotDataDetails: React.FC<SpotDataDetailsProps> = ({ spot }) => {

    return (
        <VStack className="w-full flex-1 px-6 pt-6">
            <Image source={{ uri: spot.imagesUrl[0] }} alt={spot.name} className="w-full h-64 object-cover rounded-lg" />
            <HStack className="w-full flex-row justify-between items-center mt-4">
            <Text size="2xl" className="font-bold mt-4">{spot.name}</Text>
                <RatingStarComponent rating={spot.rating} />
            </HStack>
            <Text className="pt-2" >{spot.description}</Text>
            
        </VStack>
    );
};
 