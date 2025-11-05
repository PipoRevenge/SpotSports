import { Button, ButtonText } from "@/src/components/ui/button";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import React from "react";

interface VerifiedFilterProps {
  onlyVerified: boolean;
  onToggle: () => void;
}

/**
 * Componente de filtro por verificación
 * Toggle para mostrar solo spots verificados
 */
export const VerifiedFilter: React.FC<VerifiedFilterProps> = ({
  onlyVerified,
  onToggle,
}) => {
  return (
    <VStack space="sm">
      <Text className="font-semibold text-typography-900">
        Solo spots verificados
      </Text>
      <Text className="text-sm text-typography-500">
        Muestra únicamente spots que han sido verificados por el equipo
      </Text>
      <Button
        size="sm"
        variant={onlyVerified ? "solid" : "outline"}
        onPress={onToggle}
        className={onlyVerified ? "bg-primary-600" : ""}
      >
        <ButtonText>{onlyVerified ? "✓ Activado" : "Desactivado"}</ButtonText>
      </Button>
    </VStack>
  );
};
