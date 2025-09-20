import SportRatingSpotTable from "@/src/features/sport/components/sport-rating-spot-table";
import { SpotDataDetails } from "@/src/features/spots/components/spot-data-details";
import { exampleSpot } from "@/src/types/spot";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const SpotPage = () =>  {
    return (
        <SafeAreaView >
                <ScrollView className="w-full p-3">
                    <SpotDataDetails spot={exampleSpot} />
                    <SportRatingSpotTable sports={exampleSpot.sportsReviewed} />

                    
                </ScrollView>
                
        </SafeAreaView>
    );
}
export default SpotPage;
