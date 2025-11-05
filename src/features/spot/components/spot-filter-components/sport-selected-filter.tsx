import { Button, ButtonText } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from "@/src/components/ui/select";
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/src/components/ui/slider";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SportSimple } from "@/src/features/sport/types/sport-types";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react-native";
import React, { useState } from "react";
import { DIFFICULTY_OPTIONS, RATING_CONFIG, SportFilterCriteria } from "./types";

interface SportSelectedFilterProps {
  selectedSports: SportSimple[];
  sportCriteria: SportFilterCriteria[];
  onSportRemove: (sportId: string) => void;
  onCriteriaChange: (sportId: string, criteria: Partial<SportFilterCriteria>) => void;
}

/**
 * Componente para mostrar deportes seleccionados como desplegables
 * Cada deporte puede expandirse para configurar dificultad y calificación
 */
export const SportSelectedFilter: React.FC<SportSelectedFilterProps> = ({
  selectedSports,
  sportCriteria,
  onSportRemove,
  onCriteriaChange,
}) => {
  console.log("[SportSelectedFilter] RENDER START");
  console.log("[SportSelectedFilter] selectedSports:", JSON.stringify(selectedSports));
  console.log("[SportSelectedFilter] sportCriteria:", JSON.stringify(sportCriteria));
  
  const [expandedSportIds, setExpandedSportIds] = useState<Set<string>>(new Set());

  if (selectedSports.length === 0) {
    console.log("[SportSelectedFilter] No sports selected, returning null");
    return null;
  }

  const toggleExpanded = (sportId: string) => {
    console.log("[SportSelectedFilter] toggleExpanded called for sportId:", sportId);
    setExpandedSportIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sportId)) {
        newSet.delete(sportId);
      } else {
        newSet.add(sportId);
      }
      console.log("[SportSelectedFilter] new expandedSportIds:", Array.from(newSet));
      return newSet;
    });
  };

  const getCriteriaForSport = (sportId: string): SportFilterCriteria => {
    const criteria = sportCriteria.find((c) => c.sportId === sportId) || {
      sportId,
      difficulty: undefined,
      minRating: RATING_CONFIG.DEFAULT,
    };
    console.log(`[SportSelectedFilter] getCriteriaForSport(${sportId}):`, JSON.stringify(criteria));
    return criteria;
  };

  return (
    <VStack space="sm">
      <Text className="font-semibold text-typography-900">
        Deportes seleccionados
      </Text>

      {selectedSports.map((sport) => {
        console.log(`[SportSelectedFilter] Rendering sport:`, JSON.stringify(sport));
        
        const criteria = getCriteriaForSport(sport.id);
        const isExpanded = expandedSportIds.has(sport.id);
        const hasFilters = Boolean(criteria.difficulty || (criteria.minRating && criteria.minRating > 0));
        
        console.log(`[SportSelectedFilter] sport.id=${sport.id}, isExpanded=${isExpanded}, hasFilters=${hasFilters}`);
        console.log(`[SportSelectedFilter] criteria.difficulty=${criteria.difficulty}, criteria.minRating=${criteria.minRating}`);

        return (
          <VStack key={sport.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header del deporte (siempre visible) */}
            <Pressable
              onPress={() => toggleExpanded(sport.id)}
              className="bg-primary-50 active:bg-primary-100"
            >
              <HStack className="p-3 justify-between items-center">
                <HStack className="flex-1 items-center gap-2">
                  <Text className="font-semibold text-primary-700 flex-1">
                    {(() => {
                      console.log(`[SportSelectedFilter] Rendering sport.name for ${sport.id}:`, sport.name);
                      console.log(`[SportSelectedFilter] sport.name type:`, typeof sport.name);
                      console.log(`[SportSelectedFilter] Full sport object:`, JSON.stringify(sport));
                      return sport.name;
                    })()}
                  </Text>
                  
                  {/* Indicador de filtros aplicados */}
                  {hasFilters ? (
                    <VStack className="bg-primary-600 px-2 py-0.5 rounded-full">
                      <Text className="text-xs text-white font-medium">
                        Filtrado
                      </Text>
                    </VStack>
                  ) : null}
                </HStack>

                <HStack className="items-center gap-2">
                  {/* Botón eliminar */}
                  <Pressable
                    onPress={(e) => {
                      console.log(`[SportSelectedFilter] Removing sport: ${sport.id}`);
                      e.stopPropagation();
                      onSportRemove(sport.id);
                    }}
                    className="p-1"
                  >
                    <XIcon size={20} color="#dc2626" />
                  </Pressable>

                  {/* Icono expandir/contraer */}
                  {isExpanded ? (
                    <ChevronUpIcon size={20} color="#1e40af" />
                  ) : (
                    <ChevronDownIcon size={20} color="#1e40af" />
                  )}
                </HStack>
              </HStack>
            </Pressable>

            {/* Contenido desplegable con criterios */}
            {isExpanded && (
              <VStack className="p-3 bg-white" space="md">
                <Text className="text-xs text-gray-500">DEBUG: Rendering expanded content for {sport.name}</Text>
                
                {/* Selector de dificultad */}
                <VStack space="xs">
                  <Text className="text-sm font-medium text-typography-700">
                    Dificultad
                  </Text>
                  <Select
                    selectedValue={criteria.difficulty || ""}
                    onValueChange={(value) => {
                      console.log(`[SportSelectedFilter] Difficulty changed for ${sport.id}: ${value}`);
                      onCriteriaChange(sport.id, {
                        difficulty: value === "" ? undefined : (value as "easy" | "intermediate" | "hard"),
                      });
                    }}
                  >
                    <SelectTrigger variant="outline" size="md">
                      <SelectInput placeholder="Seleccionar dificultad" />
                      <SelectIcon className="mr-3" as={ChevronDownIcon} />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            label={option.label}
                            value={option.value}
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </VStack>

                {/* Slider de calificación mínima */}
                <VStack space="xs">
                  <HStack className="justify-between items-center">
                    <Text className="text-sm font-medium text-typography-700">
                      Calificación mínima
                    </Text>
                    <HStack className="items-center gap-1">
                      <Text className="text-primary-600 font-semibold">
                        {criteria.minRating?.toFixed(1) || "0.0"}
                      </Text>
                      <Text className="text-yellow-500">⭐</Text>
                    </HStack>
                  </HStack>

                  <Slider
                    value={criteria.minRating || RATING_CONFIG.DEFAULT}
                    onChange={(value) => {
                      console.log(`[SportSelectedFilter] Rating changed for ${sport.id}: ${value}`);
                      onCriteriaChange(sport.id, { minRating: value });
                    }}
                    minValue={RATING_CONFIG.MIN}
                    maxValue={RATING_CONFIG.MAX}
                    step={RATING_CONFIG.STEP}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>

                  <HStack className="justify-between">
                    <Text className="text-xs text-typography-500">
                      {RATING_CONFIG.MIN.toFixed(1)}
                    </Text>
                    <Text className="text-xs text-typography-500">
                      {RATING_CONFIG.MAX.toFixed(1)}
                    </Text>
                  </HStack>
                </VStack>

                {/* Botón para limpiar filtros de este deporte */}
                {hasFilters ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      console.log(`[SportSelectedFilter] Clearing filters for sport: ${sport.id}`);
                      onCriteriaChange(sport.id, {
                        difficulty: undefined,
                        minRating: RATING_CONFIG.DEFAULT,
                      });
                    }}
                  >
                    <ButtonText>Limpiar filtros del deporte</ButtonText>
                  </Button>
                ) : null}
              </VStack>
            )}
          </VStack>
        );
      })}
    </VStack>
  );
};
