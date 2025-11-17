import { SportRatingData, SportsRatingTable } from "@/src/components/commons/sports-rating-table/sports-rating-table";
import { SportSpotRating } from "@/src/entities/spot/model/spot";
import React from "react";
import { View } from "react-native";

interface SportRatingSpotTableProps {
  sports: SportSpotRating[];
}

/**
 * Componente wrapper que adapta SportSpotRating a SportsRatingTable
 */
export const SpotSportsTable: React.FC<SportRatingSpotTableProps> = ({
  sports,
}) => {
  // Convertir SportSpotRating a SportRatingData
  const sportData: SportRatingData[] = sports.map(sport => ({
    sportId: sport.sportId,
    sportName: sport.sportName,
    sportDescription: sport.sportDescription,
    rating: sport.rating,
    difficulty: sport.difficulty,
  }));

  return (
    <View className="w-full border border-gray-200 rounded-lg overflow-hidden">
      <SportsRatingTable
        sports={sportData}
        variant="full"
        showHeader={true}
        size="sm"
        labels={{
          sport: "Sport",
          difficulty: "Difficulty",
          rating: "Rating",
        }}
      />
    </View>
  );
};

export default SpotSportsTable;
