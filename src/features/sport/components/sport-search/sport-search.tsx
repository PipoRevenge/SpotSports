import { Box } from "@/src/components/ui/box";
import { HStack } from "@/src/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/src/components/ui/input";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useSearchSports } from "../../hooks/use-search-sports";
import { SportCategory, SportSimple } from "../../types/sport-types";
import { LOADING_STATES, SPORT_PLACEHOLDERS, SPORT_SEARCH_CONFIG } from "../../utils/sport-constants";
import { filterSportsExcluding, formatResultsCount, limitResults } from "../../utils/sport-helpers";
import { CategoryFilter } from "./category-filter";

interface SportSearchProps {
  onSportSelect: (sport: SportSimple) => void;
  excludeIds?: string[];
  placeholder?: string;
  showAllOnEmpty?: boolean;
  maxResults?: number;
  showCategoryFilter?: boolean;
}

/**
 * Componente de búsqueda de deportes
 * Solo maneja la UI y delega la lógica de negocio al hook useSearchSports
 */
export const SportSearch: React.FC<SportSearchProps> = ({
  onSportSelect,
  excludeIds = [],
  placeholder = SPORT_PLACEHOLDERS.SEARCH,
  showAllOnEmpty = true,
  maxResults = SPORT_SEARCH_CONFIG.MAX_SEARCH_RESULTS,
  showCategoryFilter = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    sports,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
    filters,
    searchWithFilters,
    clearSearch
  } = useSearchSports();

  // Estado local para la categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState(filters.category);

  // Determinar qué deportes mostrar basado en si hay filtros activos
  const hasActiveFilters = searchQuery.trim() || selectedCategory;
  const resultsToShow = hasActiveFilters
    ? searchResults 
    : (showAllOnEmpty ? sports : []);

  // Filtrar deportes excluidos y limitar resultados usando helpers
  const filteredResults = limitResults(
    filterSportsExcluding(resultsToShow, excludeIds), 
    maxResults
  );

  /**
   * Efecto para buscar deportes con debounce cuando cambia el texto
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentFilters = {
        query: searchQuery.trim() || undefined,
        category: selectedCategory
      };
      
      // Solo buscar si hay algún filtro
      if (currentFilters.query || currentFilters.category) {
        searchWithFilters(currentFilters);
      } else {
        clearSearch();
      }
    }, SPORT_SEARCH_CONFIG.DEFAULT_SEARCH_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, searchWithFilters, clearSearch]);

  /**
   * Maneja el cambio en el input de búsqueda
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  /**
   * Maneja el cambio de categoría
   */
  const handleCategoryChange = (category?: SportCategory) => {
    setSelectedCategory(category);
  };

  /**
   * Maneja la selección de un deporte
   */
  const handleSportSelect = (sport: SportSimple) => {
    console.log("[SportSearch] handleSportSelect called with sport:", JSON.stringify(sport));
    console.log("[SportSearch] sport type:", typeof sport);
    console.log("[SportSearch] sport.id:", sport?.id);
    console.log("[SportSearch] sport.name:", sport?.name);
    onSportSelect(sport);
    // No limpiar la búsqueda para que los resultados permanezcan visibles
  };

  /**
   * Limpia la búsqueda
   */
  const handleClear = () => {
    setSearchQuery("");
    clearSearch();
  };

  const isSearching = searchQuery.trim() ? searchLoading : loading;
  const searchErrorToShow = searchQuery.trim() ? searchError : error;
  
  // Mostrar resultados si hay deportes, está buscando, o hay error
  const showResults = filteredResults.length > 0 || isSearching || !!searchErrorToShow;

  return (
    <VStack space="md" className="w-full">
      {/* Input de búsqueda */}
      <Input variant="outline" size="md">
        <InputSlot className="pl-3">
          <InputIcon as={Search} className="text-gray-500" />
        </InputSlot>
        <InputField
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={placeholder}
        />
        {searchQuery && (
          <InputSlot className="pr-3">
            <Pressable onPress={handleClear}>
              <InputIcon as={X} className="text-gray-500" />
            </Pressable>
          </InputSlot>
        )}
      </Input>

      {/* Filtro de categorías */}
      {showCategoryFilter && (
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {/* Resultados de búsqueda */}
        {showResults && (
        <Box className="bg-white border border-gray-400 rounded-lg shadow-lg">
          {isSearching ? (
            <Box className="p-4">
              <Text className="text-center text-gray-600">{LOADING_STATES.SEARCHING}</Text>
            </Box>
          ) : searchErrorToShow ? (
            <Box className="p-4 bg-red-50 rounded-lg">
              <Text className="text-center text-red-600">{searchErrorToShow}</Text>
            </Box>
          ) : filteredResults.length > 0 ? (
            <VStack space="xs">
              <Box className="p-3 bg-gray-50 border-b border-gray-400 rounded-t-lg">
                <Text className="text-xs text-gray-600 font-medium">
                  {formatResultsCount(filteredResults.length)}
                </Text>
              </Box>
              <ScrollView style={{ maxHeight: 300 }}>
                <VStack>
                  {filteredResults.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSportSelect(item)}
                      className="p-4 border-b border-gray-400 active:bg-gray-50"
                    >
                      <HStack className="items-center justify-between">
                        <Text className="text-gray-900 flex-1">{item.name}</Text>
                        <Text className="text-sm text-blue-600 font-medium">Agregar</Text>
                      </HStack>
                    </Pressable>
                  ))}
                </VStack>
              </ScrollView>
            </VStack>
          ) : (
            <Box className="p-4">
              <Text className="text-center text-gray-600">
                {searchQuery.trim() 
                  ? `No se encontraron deportes para "${searchQuery}"` 
                  : "No hay deportes disponibles"
                }
              </Text>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  );
};