
import { SafeAreaView } from "@components/ui/safe-area-view";
import { Text } from "@components/ui/text";
import React, { useState } from "react";
import { ScrollView } from "react-native";


export const SpotPage = () => {
    const [isTableVisible, setIsTableVisible] = useState(false);

    
    
    const toggleTableVisibility = () => {
        setIsTableVisible(!isTableVisible);
    };

    return (
        <SafeAreaView>
            <ScrollView className="w-full p-3">
               <Text className="text-2xl font-bold mb-4">Spot Details</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SpotPage;
