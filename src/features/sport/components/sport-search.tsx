import { Box } from "@/src/components/ui/box";
import { HStack } from "@/src/components/ui/hstack";
import { CloseIcon, SearchIcon } from "@/src/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/src/components/ui/input";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useSearchSports } from "../hooks/use-search-sports";
import { SportSimple } from "../types/sport-types";

interface SportSearchProps {
  onSportSelect: (sport: SportSimple) => void;
  excludeIds?: string[];
  placeholder?: string;
  showAllOnEmpty?: boolean;
  maxResults?: number;
}

export const SportSearch: React.FC<SportSearchProps> = ({
  onSportSelect,
  excludeIds = [],
  placeholder = "Buscar deportes...",
  showAllOnEmpty = true,
  maxResults = 10
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    sports,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
    searchSports,
    clearSearch
  } = useSearchSports();

  // Determinar qué deportes mostrar
  const resultsToShow = searchQuery.trim() 
    ? searchResults 
    : (showAllOnEmpty ? sports : []);

  // Filtrar deportes excluidos y limitar resultados
  const filteredResults = resultsToShow
    .filter(sport => !excludeIds.includes(sport.id))
    .slice(0, maxResults);

  /**
   * Efecto para buscar deportes con debounce
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchSports(searchQuery);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchSports, clearSearch]);

  /**
   * Maneja el cambio en el input de búsqueda
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  /**
   * Maneja la selección de un deporte
   */
  const handleSportSelect = (sport: SportSimple) => {
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
          <InputIcon as={SearchIcon} className="text-gray-500" />
        </InputSlot>
        <InputField
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={placeholder}
        />
        {searchQuery && (
          <InputSlot className="pr-3">
            <Pressable onPress={handleClear}>
              <InputIcon as={CloseIcon} className="text-gray-500" />
            </Pressable>
          </InputSlot>
        )}
      </Input>

      {/* Resultados de búsqueda */}
      {showResults && (
        <Box className="bg-white border border-gray-400 rounded-lg shadow-lg">
          {isSearching ? (
            <Box className="p-4">
              <Text className="text-center text-gray-600">Buscando deportes...</Text>
            </Box>
          ) : searchErrorToShow ? (
            <Box className="p-4 bg-red-50 rounded-lg">
              <Text className="text-center text-red-600">{searchErrorToShow}</Text>
            </Box>
          ) : filteredResults.length > 0 ? (
            <VStack space="xs">
              <Box className="p-3 bg-gray-50 border-b border-gray-400 rounded-t-lg">
                <Text className="text-xs text-gray-600 font-medium">
                  {filteredResults.length} deporte{filteredResults.length !== 1 ? 's' : ''} encontrado{filteredResults.length !== 1 ? 's' : ''}
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