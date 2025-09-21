import SportRatingSpotTable from "@/src/features/sport/components/sport-rating-spot-table";
import { SpotDataDetails } from "@/src/features/spots/components/spot-data-details";
import { exampleSpot } from "@/src/types/spot";
import { Button, ButtonText } from "@components/ui/button";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export const SpotPage = () => {
    const [isTableVisible, setIsTableVisible] = useState(false);

    const toggleTableVisibility = () => {
        setIsTableVisible(!isTableVisible);
    };

    return (
        <SafeAreaView>
            <ScrollView className="w-full p-3">
                <SpotDataDetails spot={exampleSpot} />
                
                <Button className="w-max m-4" onPress={toggleTableVisibility}>
                   <ButtonText> {isTableVisible ? "Ocultar Tabla de Deportes" : "Mostrar Tabla de Deportes"}
                   </ButtonText>
                </Button>

                {isTableVisible && (
                    <SportRatingSpotTable sports={exampleSpot.sportsReviewed} />
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

export default SpotPage;
