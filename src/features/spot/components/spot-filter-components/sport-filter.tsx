import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SimpleSport as SportSimple } from "@/src/entities/sport/model/sport";
import React from "react";

/**
 * Props for the SportSearch slot component
 */
export interface SportSearchSlotProps {
  onSportSelect: (sport: SportSimple) => void;
  excludeIds: string[];
  placeholder?: string;
  showAllOnEmpty?: boolean;
  maxResults?: number;
  showCategoryFilter?: boolean;
}

interface SportFilterProps {
  selectedSports: SportSimple[];
  onSportSelect: (sport: SportSimple) => void;
  onSportRemove: (sportId: string) => void;
  /**
   * Slot for sport search component - must be provided by the app layer
   * This follows the architecture pattern of feature independence
   */
  sportSearchSlot?: React.ComponentType<SportSearchSlotProps>;
}

/**
 * Componente de filtro por deportes
 * Permite seleccionar múltiples deportes con búsqueda y filtrado por categoría
 */
export const SportFilter: React.FC<SportFilterProps> = ({
  selectedSports,
  onSportSelect,
  onSportRemove,
  sportSearchSlot: SportSearchComponent,
}) => {
  console.log("[SportFilter] RENDER");
  console.log("[SportFilter] selectedSports:", JSON.stringify(selectedSports));
  
  return (
    <VStack space="sm">
      <Text className="font-semibold text-typography-900">Deportes</Text>
      <Text className="text-sm text-typography-500">
        Selecciona los deportes que te interesan o filtra por categoría
      </Text>

      {/* Buscador de deportes - slot injected from app layer */}
      {SportSearchComponent ? (
        <SportSearchComponent
          onSportSelect={(sport) => {
            console.log("[SportFilter] onSportSelect called with sport:", JSON.stringify(sport));
            onSportSelect(sport);
          }}
          excludeIds={selectedSports.map((s) => s.id)}
          placeholder="Buscar deportes..."
          showAllOnEmpty={false}
          maxResults={5}
          showCategoryFilter={true}
        />
      ) : (
        <Text className="text-sm text-gray-500">
          Sport search component not provided.
        </Text>
      )}
    </VStack>
  );
};
