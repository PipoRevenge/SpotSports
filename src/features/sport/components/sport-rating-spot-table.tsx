import DifficultyRating from "@/src/components/commons/rating/rating-difficulty";
import { HStack } from "@/src/components/ui/hstack";
import { Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverHeader } from "@/src/components/ui/popover";
import {
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { SportDetail } from "@/src/types/spot";
import { RatingStarComponent } from "@components/commons/rating/rating-star-component";
import { Icon } from "@components/ui/icon";
import { Text } from "@components/ui/text";
import { InfoIcon } from "lucide-react-native";
import React, { useState } from "react";

import { Pressable, View } from "react-native";

interface SportRatingSpotTableProps {
  sports: SportDetail[];
}

export const SportRatingSpotTable: React.FC<SportRatingSpotTableProps> = ({
  sports,
}) => {
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  const togglePopover = (index: number) => {
    setOpenPopoverIndex(openPopoverIndex === index ? null : index);
  };

  return (
    <Table className="w-full">
      <TableHeader className="  ">
        <TableRow className="  ">
          <TableHead>Sport</TableHead>
          <TableHead>
            Difficulty
          </TableHead>
          <TableHead>
             Rating
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sports.map((sport, index) => (
          <TableRow key={index}>
            <TableData className="flex items-center ">
              <HStack className="h-full w-fit flex items-center justify-between  ">
                <Text className="font-semibold ">
                  {sport.name}
                </Text>
                <Popover
                  isOpen={openPopoverIndex === index}
                  onClose={() => setOpenPopoverIndex(null)}
                  trigger={(triggerProps) => (
                    <Pressable
                      className="w-1/5 h-full flex items-center justify-center"
                      {...triggerProps}
                      onPress={() => togglePopover(index)}
                    >
                      <Icon
                        as={InfoIcon}
                        className="text-blue-600 w-5 h-5"
                      />
                    </Pressable>
                  )}
                  placement="bottom"
                >
                  <PopoverContent className="w-56">
                    <PopoverArrow />
                    <PopoverHeader>
                      <Text className="text-base font-bold">{sport.name}</Text>
                    </PopoverHeader>
                    <PopoverBody>
                      <Text className="text-gray-600">{sport.description}</Text>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </HStack>
            </TableData>
            <TableData>
                <View className="flex justify-center ">
                  <DifficultyRating value={sport.difficultyLevel} />
                </View>
            </TableData>
            <TableData>
                  <View className="flex justify-center ">
                  {sport.rating !== undefined && (
                    <RatingStarComponent  rating={sport.rating} maxStars={5} />
                  )}
                  </View>

            </TableData>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SportRatingSpotTable;
