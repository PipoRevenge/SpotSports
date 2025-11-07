import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SportSearch } from "@/src/features/sport/components/sport-search/sport-search";
import { SportSimple } from "@/src/features/sport/types/sport-types";
import React from "react";

interface SportFilterProps {
  selectedSports: SportSimple[];
  onSportSelect: (sport: SportSimple) => void;
  onSportRemove: (sportId: string) => void;
}

/**
 * Componente de filtro por deportes
 * Permite seleccionar múltiples deportes con búsqueda y filtrado por categoría
 */
export const SportFilter: React.FC<SportFilterProps> = ({
  selectedSports,
  onSportSelect,
  onSportRemove,
}) => {
  console.log("[SportFilter] RENDER");
  console.log("[SportFilter] selectedSports:", JSON.stringify(selectedSports));
  
  return (
    <VStack space="sm">
      <Text className="font-semibold text-typography-900">Deportes</Text>
      <Text className="text-sm text-typography-500">
        Selecciona los deportes que te interesan o filtra por categoría
      </Text>

      {/* Buscador de deportes */}
      <SportSearch
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
    </VStack>
  );
};
