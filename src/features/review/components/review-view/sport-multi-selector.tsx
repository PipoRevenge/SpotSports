import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { ChevronDown, X } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, View } from "react-native";

/**
 * Props del componente SportMultiSelector
 */
export interface SportMultiSelectorProps {
  /**
   * Lista de deportes disponibles
   */
  availableSports: { id: string; name: string }[];
  
  /**
   * IDs de deportes seleccionados
   */
  selectedSportIds: string[];
  
  /**
   * Callback cuando cambian los deportes seleccionados
   */
  onSelectionChange: (sportIds: string[]) => void;
  
  /**
   * Placeholder cuando no hay selección
   * @default "Filtrar por deporte"
   */
  placeholder?: string;
  
  /**
   * Mostrar badge con cantidad seleccionada
   * @default true
   */
  showCount?: boolean;
}

/**
 * Componente selector multi-deporte para filtros
 * Permite seleccionar múltiples deportes (OR logic)
 * 
 * @example
 * ```tsx
 * <SportMultiSelector
 *   availableSports={[{ id: "1", name: "Basketball" }]}
 *   selectedSportIds={["1"]}
 *   onSelectionChange={(ids) => setSelectedIds(ids)}
 * />
 * ```
 */
export const SportMultiSelector: React.FC<SportMultiSelectorProps> = ({
  availableSports,
  selectedSportIds,
  onSelectionChange,
  placeholder = "Filtrar por deporte",
  showCount = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Toggle selección de un deporte
   */
  const toggleSport = (sportId: string) => {
    if (selectedSportIds.includes(sportId)) {
      onSelectionChange(selectedSportIds.filter(id => id !== sportId));
    } else {
      onSelectionChange([...selectedSportIds, sportId]);
    }
  };

  /**
   * Limpiar todos los filtros
   */
  const clearAll = () => {
    onSelectionChange([]);
    setIsModalOpen(false);
  };

  /**
   * Obtener texto del selector
   */
  const getSelectorText = () => {
    if (selectedSportIds.length === 0) {
      return placeholder;
    }
    
    if (selectedSportIds.length === 1) {
      const sport = availableSports.find(s => s.id === selectedSportIds[0]);
      return sport?.name || placeholder;
    }
    
    return `${selectedSportIds.length} deportes`;
  };

  return (
    <>
      {/* Selector button */}
      <Pressable
        onPress={() => setIsModalOpen(true)}
        className="flex-row items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white min-w-[160px]"
      >
        <HStack className="flex-1 items-center gap-2">
          <Text className="text-sm font-medium text-gray-700 flex-1">
            {getSelectorText()}
          </Text>
          {showCount && selectedSportIds.length > 0 && (
            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-xs text-white font-bold">
                {selectedSportIds.length}
              </Text>
            </View>
          )}
        </HStack>
        <ChevronDown size={16} color="#6b7280" />
      </Pressable>

      {/* Modal de selección */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="border-b border-gray-200 px-4 py-4">
            <HStack className="justify-between items-center pb-4">
              <Text className="text-xl font-bold text-gray-900">
                Filtrar por deportes
              </Text>
              <Pressable
                onPress={() => setIsModalOpen(false)}
                className="p-2"
              >
                <X size={24} color="#6b7280" />
              </Pressable>
            </HStack>
            
            {selectedSportIds.length > 0 && (
              <HStack className="items-center gap-2">
                <Text className="text-sm text-gray-600">
                  {selectedSportIds.length} seleccionado{selectedSportIds.length > 1 ? 's' : ''}
                </Text>
                <Pressable onPress={clearAll}>
                  <Text className="text-sm font-semibold text-blue-600">
                    Limpiar todo
                  </Text>
                </Pressable>
              </HStack>
            )}
          </View>

          {/* Lista de deportes */}
          <ScrollView className="flex-1 px-4 py-2">
            <VStack className="gap-2">
              {availableSports.map((sport) => {
                const isSelected = selectedSportIds.includes(sport.id);
                
                return (
                  <Pressable
                    key={sport.id}
                    onPress={() => toggleSport(sport.id)}
                    className={`px-4 py-3 rounded-lg border ${
                      isSelected
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <HStack className="justify-between items-center">
                      <Text
                        className={`text-base font-medium ${
                          isSelected ? "text-blue-700" : "text-gray-900"
                        }`}
                      >
                        {sport.name}
                      </Text>
                      {isSelected && (
                        <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
                          <Text className="text-white text-xs font-bold">✓</Text>
                        </View>
                      )}
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          </ScrollView>

          {/* Footer */}
          <View className="border-t border-gray-200 px-4 py-4">
            <Pressable
              onPress={() => setIsModalOpen(false)}
              className="bg-blue-600 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold text-base">
                Aplicar filtros
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};
