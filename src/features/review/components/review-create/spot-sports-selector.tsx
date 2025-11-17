import { Box } from "@/src/components/ui/box";
import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React from "react";
import { Modal, ScrollView } from "react-native";
import {
    ReviewSportFormData,
    SimpleSport,
} from "../../types/review-types";

interface SpotSportsSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectSport: (sport: ReviewSportFormData) => void;
  spotSports: SimpleSport[];
  excludeSportIds: string[];
  onOpenCustomSportModal: () => void;
}

/**
 * Modal para seleccionar deportes disponibles en el spot
 */
export const SpotSportsSelector: React.FC<SpotSportsSelectorProps> = ({
  visible,
  onClose,
  onSelectSport,
  spotSports,
  excludeSportIds,
  onOpenCustomSportModal,
}) => {
  const availableSports = spotSports.filter(
    (sport) => !excludeSportIds.includes(sport.id)
  );

  const handleSelectSport = (sport: SimpleSport) => {
    // Crear el deporte con valores por defecto
    const newSport: ReviewSportFormData = {
      sportId: sport.id,
      name: sport.name,
      sportRating: 0,
      difficulty: 1.25, // Valor numérico por defecto (Beginner range: 0-2.5)
    };

    onSelectSport(newSport);
    onClose();
  };

  const handleAddCustomSport = () => {
    onClose();
    // Pequeño delay para que la animación de cierre se vea bien
    setTimeout(() => {
      onOpenCustomSportModal();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Box className="flex-1 bg-black/50 justify-end">
        <Box className="bg-white rounded-t-3xl max-h-[80%]">
          <VStack className="gap-4">
            {/* Header */}
            <Box className="p-6 pb-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">
                Rate Sports at this Spot
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {availableSports.length > 0
                  ? `${availableSports.length} sport${availableSports.length > 1 ? 's' : ''} available`
                  : "All spot sports rated"}
              </Text>
            </Box>

            {/* Lista de deportes del spot */}
            <ScrollView className="max-h-96">
              <VStack className="px-6 gap-2">
                {availableSports.length > 0 ? (
                  availableSports.map((sport) => (
                    <Pressable
                      key={sport.id}
                      onPress={() => handleSelectSport(sport)}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 active:bg-blue-50 active:border-blue-500"
                    >
                      <HStack className="items-center justify-between">
                        <VStack className="flex-1 pr-3">
                          <Text className="text-lg font-semibold text-gray-900">
                            {sport.name}
                          </Text>
                          {sport.description && (
                            <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                              {sport.description}
                            </Text>
                          )}
                          {sport.category && (
                            <Text className="text-xs text-blue-600 mt-1 font-medium">
                              {sport.category}
                            </Text>
                          )}
                        </VStack>
                        <Box className="w-8 h-8 rounded-full border-2 border-blue-500 items-center justify-center bg-blue-50">
                          <Text className="text-blue-600 font-bold text-lg">+</Text>
                        </Box>
                      </HStack>
                    </Pressable>
                  ))
                ) : (
                  <Box className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <Text className="text-center text-yellow-800 font-medium">
                      {excludeSportIds.length > 0
                        ? "✓ You&apos;ve rated all available sports at this spot!"
                        : "No sports available at this spot"}
                    </Text>
                    <Text className="text-center text-yellow-700 text-sm mt-2">
                      You can still add sports not listed here
                    </Text>
                  </Box>
                )}
              </VStack>
            </ScrollView>

            {/* Botón para añadir deporte personalizado */}
            <Box className="p-6 pt-4 border-t border-gray-200">
              <VStack className="gap-3">
                <Text className="text-xs text-gray-500 text-center mb-1">
                  Can&apos;t find the sport you&apos;re looking for?
                </Text>
                <Button
                  variant="outline"
                  onPress={handleAddCustomSport}
                  className="border-blue-500 bg-blue-50"
                >
                  <ButtonText className="text-blue-600 font-semibold">
                    + Add Other Sport
                  </ButtonText>
                </Button>

                <Button variant="outline" onPress={onClose}>
                  <ButtonText className="text-gray-700">Close</ButtonText>
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Modal>
  );
};
