import { Box } from "@/src/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText
} from "@/src/components/ui/form-control";
import { HStack } from "@/src/components/ui/hstack";
import { CloseIcon } from "@/src/components/ui/icon";
import { Input, InputField } from "@/src/components/ui/input";
import { Text } from "@/src/components/ui/text";
import { Textarea, TextareaInput } from "@/src/components/ui/textarea";
import { VStack } from "@/src/components/ui/vstack";
import React, { useState } from "react";
import { CreateSportData } from "../types/sport-types";

interface CreateSportFormProps {
  onSubmit: (data: CreateSportData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export const CreateSportForm: React.FC<CreateSportFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  error = null
}) => {
  const [formData, setFormData] = useState<CreateSportData>({
    name: "",
    description: "",
    category: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /**
   * Actualiza un campo del formulario
   */
  const updateField = (field: keyof CreateSportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Valida el formulario
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name?.trim()) {
      errors.name = "El nombre del deporte es requerido";
    } else if (formData.name.trim().length < 2) {
      errors.name = "El nombre debe tener al menos 2 caracteres";
    } else if (formData.name.trim().length > 50) {
      errors.name = "El nombre no puede tener más de 50 caracteres";
    }

    if (!formData.description?.trim()) {
      errors.description = "La descripción del deporte es requerida";
    } else if (formData.description.trim().length < 5) {
      errors.description = "La descripción debe tener al menos 5 caracteres";
    } else if (formData.description.trim().length > 200) {
      errors.description = "La descripción no puede tener más de 200 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(), // Ahora es requerido
        category: formData.category?.trim() || undefined,
      });
    } catch {
      // El error se maneja en el componente padre
    }
  };

  return (
    <Box className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <HStack className="items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">
          Crear Nuevo Deporte
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={onCancel}
          disabled={isLoading}
          className="p-2"
        >
          <ButtonIcon as={CloseIcon} className="text-gray-500" />
        </Button>
      </HStack>

      <VStack space="lg">
        {/* Error general */}
        {error && (
          <Box className="bg-red-50 border border-red-200 p-3 rounded-md">
            <Text className="text-red-700 text-center text-sm">{error}</Text>
          </Box>
        )}

        {/* Nombre del deporte */}
        <FormControl isInvalid={!!formErrors.name} isRequired>
          <FormControlLabel>
            <FormControlLabelText className="text-gray-700 font-medium">
              Nombre del Deporte
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="mt-1">
            <InputField
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Ej: Padel, Rugby, Crossfit..."
              maxLength={50}
              editable={!isLoading}
              className="text-gray-900"
            />
          </Input>
          {formErrors.name && (
            <FormControlError>
              <FormControlErrorText className="text-sm">
                {formErrors.name}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Descripción */}
        <FormControl isInvalid={!!formErrors.description} isRequired>
          <FormControlLabel>
            <FormControlLabelText className="text-gray-700 font-medium">
              Descripción
            </FormControlLabelText>
          </FormControlLabel>
          <Textarea className="mt-1">
            <TextareaInput
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="Describe brevemente el deporte, sus características principales..."
              maxLength={200}
              numberOfLines={3}
              editable={!isLoading}
              className="text-gray-900"
            />
          </Textarea>
          {formErrors.description && (
            <FormControlError>
              <FormControlErrorText className="text-sm">
                {formErrors.description}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Categoría */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText className="text-gray-700 font-medium">
              Categoría
              <Text className="text-gray-500 font-normal"> (Opcional)</Text>
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="mt-1">
            <InputField
              value={formData.category}
              onChangeText={(value) => updateField('category', value)}
              placeholder="Ej: Acuático, Aéreo, Terrestre, Combate..."
              maxLength={30}
              editable={!isLoading}
              className="text-gray-900"
            />
          </Input>
        </FormControl>

        {/* Botones */}
        <HStack className="mt-6" space="md">
          <Button 
            variant="outline" 
            className="flex-1"
            onPress={onCancel}
            disabled={isLoading}
          >
            <ButtonText className="text-gray-700">Cancelar</ButtonText>
          </Button>
          <Button 
            className="flex-1 bg-blue-600"
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <ButtonText className="text-white font-medium">
              {isLoading ? "Creando..." : "Crear Deporte"}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};