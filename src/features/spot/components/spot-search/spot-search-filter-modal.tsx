import { Button, ButtonText } from "@/src/components/ui/button";
import { Heading } from "@/src/components/ui/heading";
import { HStack } from "@/src/components/ui/hstack";
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/src/components/ui/modal";
import { VStack } from "@/src/components/ui/vstack";
import { SimpleSport as SportSimple } from "@/src/entities/sport/model/sport";
import { SportSearch } from "@/src/features/sport";
import { SportFilterCriteria, SpotSearchFilters } from '@/src/features/spot/types/spot-search-types';
import React, { useState } from "react";
import { ScrollView } from "react-native";
import {
    DistanceFilter,
    RatingFilter,
    SportFilter,
    SportSelectedFilter,
    VerifiedFilter,
} from "../spot-filter-components";

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

  // Actualizar localFilters cuando cambien los filters externos
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
      sportCriteria: localFilters.sportCriteria.filter(c => c.sportId !== sportId),
    });
  };

  const handleCriteriaChange = (sportId: string, criteria: Partial<SportFilterCriteria>) => {
    const existingCriteriaIndex = localFilters.sportCriteria.findIndex(c => c.sportId === sportId);
    
    if (existingCriteriaIndex >= 0) {
      // Actualizar criterio existente
      const updatedCriteria = [...localFilters.sportCriteria];
      updatedCriteria[existingCriteriaIndex] = {
        ...updatedCriteria[existingCriteriaIndex],
        ...criteria,
      };
      setLocalFilters({
        ...localFilters,
        sportCriteria: updatedCriteria,
      });
    } else {
      // Agregar nuevo criterio
      setLocalFilters({
        ...localFilters,
        sportCriteria: [
          ...localFilters.sportCriteria,
          { sportId, ...criteria },
        ],
      });
    }
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
              <SportFilter
                selectedSports={localFilters.sports}
                onSportSelect={handleSportSelect}
                onSportRemove={handleRemoveSport}
                sportSearchSlot={SportSearch}
              />

              {/* Deportes seleccionados con criterios */}
              <SportSelectedFilter
                selectedSports={localFilters.sports}
                sportCriteria={localFilters.sportCriteria}
                onSportRemove={handleRemoveSport}
                onCriteriaChange={handleCriteriaChange}
              />

              {/* Filtro de distancia */}
              <DistanceFilter
                maxDistance={localFilters.maxDistance}
                onDistanceChange={(value) =>
                  setLocalFilters({ ...localFilters, maxDistance: value })
                }
              />

              {/* Filtro de rating */}
              <RatingFilter
                minRating={localFilters.minRating}
                onRatingChange={(value) =>
                  setLocalFilters({ ...localFilters, minRating: value })
                }
              />

              {/* Filtro de verificación */}
              <VerifiedFilter
                onlyVerified={localFilters.onlyVerified}
                onToggle={() =>
                  setLocalFilters({
                    ...localFilters,
                    onlyVerified: !localFilters.onlyVerified,
                  })
                }
              />
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
