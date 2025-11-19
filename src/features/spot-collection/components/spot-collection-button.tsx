import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { Bookmark } from "lucide-react-native";
import React from "react";

interface SpotCollectionButtonProps {
  hasCategories: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Botón para abrir el selector de colecciones
 * Muestra visualmente si el spot está guardado en alguna categoría
 */
export const SpotCollectionButton: React.FC<SpotCollectionButtonProps> = ({
  hasCategories,
  onPress,
  disabled = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="p-2"
    >
      <Icon
        as={Bookmark}
        className={`w-6 h-6 ${
          hasCategories 
            ? "text-blue-500 fill-blue-500" 
            : "text-gray-400"
        }`}
      />
    </Pressable>
  );
};
