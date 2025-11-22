import { Box } from "@/src/components/ui/box";
import { Button, ButtonText } from "@/src/components/ui/button";
import { ScrollView } from "@/src/components/ui/scroll-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from '@/src/context/app-alert-context';
import { SportSearch } from "@/src/features/sport/components/sport-search/sport-search";
import { SportSimple } from "@/src/features/sport/types/sport-types";
import React, { useState } from "react";
import { Modal } from "react-native";
import {
  ReviewSportFormData,
  SimpleSport,
} from "../../types/review-types";

interface AddSportModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSport: (sport: ReviewSportFormData) => void;
  excludeSportIds: string[];
  spotSports?: SimpleSport[];
  availableSportIds?: string[]; // IDs de deportes ya disponibles en el spot
}

/**
 * Modal para buscar y añadir un deporte a la review
 */
export const AddSportModal: React.FC<AddSportModalProps> = ({
  visible,
  onClose,
  onAddSport,
  excludeSportIds,
  spotSports = [],
  availableSportIds = [],
}) => {
  const [selectedSport, setSelectedSport] = useState<SportSimple | null>(null);
  
  // Combinar IDs a excluir: los ya en la review Y los ya disponibles en el spot
  const allExcludedIds = [...excludeSportIds, ...availableSportIds];

  const handleSportSelect = (sport: SportSimple) => {
    console.log("[AddSportModal] Selected sport:", sport);
    setSelectedSport(sport);
  };

  const { showError } = useAppAlert();

  const handleAdd = () => {
    if (!selectedSport) {
      showError('Please select a sport', 'Error');
      return;
    }

    // Crear el deporte con valores por defecto
    const newSport: ReviewSportFormData = {
      sportId: selectedSport.id,
      name: selectedSport.name,
      sportRating: 0,
      difficulty: 1.25, // Beginner por defecto (centro del rango 0-2.5)
    };

    onAddSport(newSport);
    setSelectedSport(null);
    onClose();
  };

  const handleCancel = () => {
    setSelectedSport(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >

      <Box className="flex-1 bg-black/50 justify-end">
        <Box className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <ScrollView>
          <VStack className="gap-6">
            {/* Header */}
            <VStack className="gap-2">
              <Text className="text-xl font-bold text-gray-900">
                Add Sport to Review
              </Text>
              <Text className="text-sm text-gray-600">
                Search and select a sport you want to rate
              </Text>
            </VStack>

            {/* Buscador de deportes */}
            <SportSearch
              onSportSelect={handleSportSelect}
              excludeIds={allExcludedIds}
              placeholder="Search for a sport..."
              showAllOnEmpty={true}
              maxResults={20}
              showCategoryFilter={true}
            />

            {/* Deporte seleccionado */}
            {selectedSport && (
              <Box className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <Text className="text-sm text-blue-900 font-medium">
                  Selected: {selectedSport.name}
                </Text>
              </Box>
            )}

            {/* Botones */}
            <VStack className="pt-4 gap-4">
              <Button
                className="bg-blue-600"
                onPress={handleAdd}
                disabled={!selectedSport}
              >
                <ButtonText className="text-white font-medium">
                  Add Sport
                </ButtonText>
              </Button>
              <Button variant="outline" onPress={handleCancel}>
                <ButtonText className="text-gray-700">Cancel</ButtonText>
              </Button>
            </VStack>
          </VStack>
          </ScrollView>
        </Box>
      </Box>

    </Modal>
  );
};
