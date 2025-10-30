import { Button, ButtonIcon } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { CloseIcon, MenuIcon, SearchIcon } from "@/src/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/src/components/ui/input";
import { Pressable } from "@/src/components/ui/pressable";
import React from "react";

interface SpotSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  filterActive?: boolean;
}

/**
 * Barra de búsqueda para spots
 * Incluye input de texto, botón de limpiar y botón de filtros
 */
export const SpotSearchBar: React.FC<SpotSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onFilterPress,
  placeholder = "Buscar spots...",
  showFilterButton = true,
  filterActive = false,
}) => {
  return (
    <HStack className="gap-2 items-center">
      {/* Input de búsqueda */}
      <Input
        variant="outline"
        size="md"
        className="flex-1"
      >
        <InputSlot className="pl-3">
          <InputIcon as={SearchIcon} />
        </InputSlot>
        
        <InputField
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {value.length > 0 && (
          <InputSlot className="pr-3">
            <Pressable onPress={onClear}>
              <InputIcon as={CloseIcon} />
            </Pressable>
          </InputSlot>
        )}
      </Input>

      {/* Botón de filtros */}
      {showFilterButton && (
        <Button
          onPress={onFilterPress}
          size="md"
          variant={filterActive ? "solid" : "outline"}
          action={filterActive ? "primary" : "secondary"}
        >
          <ButtonIcon as={MenuIcon} />
        </Button>
      )}
    </HStack>
  );
};
