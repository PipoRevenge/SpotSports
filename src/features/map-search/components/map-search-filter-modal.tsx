import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from "@/src/components/ui/modal";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { RotateCcw } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { MapSearchFilterModalProps } from "../types/map-types";

/**
 * Modal genérico para filtros de búsqueda en mapa
 * 
 * Usa el patrón "Slot" para permitir contenido personalizado.
 * Los filtros específicos se pasan como children.
 * 
 * @example
 * ```tsx
 * <MapSearchFilterModal
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   onApply={handleApplyFilters}
 *   onReset={handleResetFilters}
 *   title="Filtros de búsqueda"
 * >
 *   <FormControl>
 *     <FormControlLabel>
 *       <FormControlLabelText>Distancia máxima</FormControlLabelText>
 *     </FormControlLabel>
 *     <Slider />
 *   </FormControl>
 *   
 *   <FormControl>
 *     <FormControlLabel>
 *       <FormControlLabelText>Deportes</FormControlLabelText>
 *     </FormControlLabel>
 *     <CheckboxGroup />
 *   </FormControl>
 * </MapSearchFilterModal>
 * ```
 */
export const MapSearchFilterModal: React.FC<MapSearchFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  title = "Filtros",
  applyButtonText = "Aplicar",
  resetButtonText = "Limpiar",
  cancelButtonText = "Cancelar",
  children,
}) => {
  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <Modal isOpen={visible} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[90%]">
        {/* Header */}
        <ModalHeader className="border-b border-gray-200">
          <HStack className="w-full justify-between items-center">
            <Text className="text-xl font-semibold">{title}</Text>
            
            {/* Botón de reset en el header */}
            <Button
              variant="link"
              size="sm"
              onPress={handleReset}
              className="flex-row items-center gap-1"
            >
              <RotateCcw size={16} color="#3b82f6" />
              <ButtonText className="text-blue-600">{resetButtonText}</ButtonText>
            </Button>
          </HStack>
        </ModalHeader>

        {/* Body con scroll */}
        <ModalBody className="py-4">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <VStack space="lg">
              {/* Slot para filtros personalizados */}
              {children}
            </VStack>
          </ScrollView>
        </ModalBody>

        {/* Footer con botones */}
        <ModalFooter className="border-t border-gray-200">
          <HStack space="md" className="w-full">
            {/* Botón cancelar */}
            <Button
              variant="outline"
              onPress={onClose}
              className="flex-1"
            >
              <ButtonText>{cancelButtonText}</ButtonText>
            </Button>

            {/* Botón aplicar */}
            <Button
              onPress={handleApply}
              className="flex-1 bg-blue-600"
            >
              <ButtonText>{applyButtonText}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
