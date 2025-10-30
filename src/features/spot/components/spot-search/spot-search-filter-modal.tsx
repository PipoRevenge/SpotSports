import { Button, ButtonText } from "@/src/components/ui/button";
import { Heading } from "@/src/components/ui/heading";
import { HStack } from "@/src/components/ui/hstack";
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/src/components/ui/modal";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/src/components/ui/slider";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SportSearch } from "@/src/features/sport/components/sport-search/sport-search";
import { SportSimple } from "@/src/features/sport/types/sport-types";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export interface SpotSearchFilters {
  sports: SportSimple[];
  maxDistance: number;
  minRating: number;
  onlyVerified: boolean;
}

interface SpotSearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SpotSearchFilters;
  onApplyFilters: (filters: SpotSearchFilters) => void;
  onResetFilters: () => void;
}

/**
 * Modal de filtros para búsqueda de spots
 * Permite filtrar por deportes, distancia, rating y verificación
 */
export const SpotSearchFilterModal: React.FC<SpotSearchFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<SpotSearchFilters>(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  const handleSportSelect = (sport: SportSimple) => {
    const isSelected = localFilters.sports.some(s => s.id === sport.id);
    
    if (isSelected) {
      setLocalFilters({
        ...localFilters,
        sports: localFilters.sports.filter(s => s.id !== sport.id),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        sports: [...localFilters.sports, sport],
      });
    }
  };

  const handleRemoveSport = (sportId: string) => {
    setLocalFilters({
      ...localFilters,
      sports: localFilters.sports.filter(s => s.id !== sportId),
    });
  };

  return (
    <Modal isOpen={visible} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[85%]">
        <ModalHeader>
          <Heading size="lg">Filtros de búsqueda</Heading>
        </ModalHeader>

        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xl">
              {/* Filtro de deportes */}
              <VStack space="sm">
                <Text className="font-semibold text-typography-900">
                  Deportes
                </Text>
                <Text className="text-sm text-typography-500">
                  Selecciona los deportes que te interesan
                </Text>
                
                {/* Deportes seleccionados */}
                {localFilters.sports.length > 0 && (
                  <VStack space="xs" className="mb-2">
                    {localFilters.sports.map((sport) => (
                      <HStack
                        key={sport.id}
                        className="bg-primary-100 rounded-lg p-2 justify-between items-center"
                      >
                        <Text className="text-primary-700">{sport.name}</Text>
                        <Button
                          size="xs"
                          variant="link"
                          onPress={() => handleRemoveSport(sport.id)}
                        >
                          <ButtonText className="text-primary-700">Quitar</ButtonText>
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                )}
                
                <SportSearch
                  onSportSelect={handleSportSelect}
                  excludeIds={localFilters.sports.map(s => s.id)}
                  placeholder="Buscar deportes..."
                  showAllOnEmpty={false}
                  maxResults={5}
                />
              </VStack>

              {/* Filtro de distancia */}
              <VStack space="sm">
                <HStack className="justify-between items-center">
                  <Text className="font-semibold text-typography-900">
                    Distancia máxima
                  </Text>
                  <Text className="text-primary-600 font-medium">
                    {localFilters.maxDistance} km
                  </Text>
                </HStack>
                
                <Slider
                  value={localFilters.maxDistance}
                  onChange={(value) =>
                    setLocalFilters({ ...localFilters, maxDistance: value })
                  }
                  minValue={1}
                  maxValue={50}
                  step={1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                
                <HStack className="justify-between">
                  <Text className="text-xs text-typography-500">1 km</Text>
                  <Text className="text-xs text-typography-500">50 km</Text>
                </HStack>
              </VStack>

              {/* Filtro de rating */}
              <VStack space="sm">
                <HStack className="justify-between items-center">
                  <Text className="font-semibold text-typography-900">
                    Rating mínimo
                  </Text>
                  <Text className="text-primary-600 font-medium">
                    {localFilters.minRating.toFixed(1)} ⭐
                  </Text>
                </HStack>
                
                <Slider
                  value={localFilters.minRating}
                  onChange={(value) =>
                    setLocalFilters({ ...localFilters, minRating: value })
                  }
                  minValue={0}
                  maxValue={5}
                  step={0.5}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                
                <HStack className="justify-between">
                  <Text className="text-xs text-typography-500">0</Text>
                  <Text className="text-xs text-typography-500">5</Text>
                </HStack>
              </VStack>

              {/* Filtro de verificación */}
              <VStack space="sm">
                <Text className="font-semibold text-typography-900">
                  Solo spots verificados
                </Text>
                <Button
                  size="sm"
                  variant={localFilters.onlyVerified ? "solid" : "outline"}
                  onPress={() =>
                    setLocalFilters({
                      ...localFilters,
                      onlyVerified: !localFilters.onlyVerified,
                    })
                  }
                >
                  <ButtonText>
                    {localFilters.onlyVerified ? "Activado" : "Desactivado"}
                  </ButtonText>
                </Button>
              </VStack>
            </VStack>
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <HStack space="md" className="w-full">
            <Button
              variant="outline"
              onPress={handleReset}
              className="flex-1"
            >
              <ButtonText>Limpiar</ButtonText>
            </Button>
            <Button
              onPress={handleApply}
              className="flex-1"
            >
              <ButtonText>Aplicar</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
