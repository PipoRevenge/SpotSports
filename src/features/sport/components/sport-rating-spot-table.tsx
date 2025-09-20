import DifficultyRating from "@/src/components/commons/rating/rating-difficulty";
import { HStack } from "@/src/components/ui/hstack";
import {
    Table,
    TableBody,
    TableData,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { VStack } from "@/src/components/ui/vstack";
import { SportDetail } from "@/src/types/spot";
import { RatingStarComponent } from "@components/commons/rating/rating-star-component";
import { Text } from "@components/ui/text";

import { View } from "react-native";
interface SportRatingSpotTableProps {
  sports: SportDetail[];
}
export const SportRatingSpotTable: React.FC<SportRatingSpotTableProps> = ({
  sports,
}) => {
 
  return (
    <Table className="w-full">
      <TableHeader className="  ">
        <TableRow className="  ">
          <TableHead className="  border-2 border-black">Sport</TableHead>
          <TableHead className="  border-2 border-black">
            Difficulty / Rating
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sports.map((sport, index) => (
          <TableRow key={index}>
            <TableData className="flex items-center ">
              <HStack className="h-full w-fit flex items-center  justify-between border-2 border-black ">
                <Text className="font-semibold border-2 border-black">
                  {sport.name}
                </Text>
                
              </HStack>
            </TableData>
            <TableData>
              <VStack>
                <View className="flex justify-center">
                  <DifficultyRating value={sport.difficultyLevel} />
                </View>

                <View className="flex justify-center">
                  {sport.rating !== undefined && (
                    <RatingStarComponent rating={sport.rating} maxStars={5} />
                  )}
                </View>
              </VStack>
            </TableData>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
export default SportRatingSpotTable;
