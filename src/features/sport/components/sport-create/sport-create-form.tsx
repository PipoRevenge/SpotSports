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
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { Textarea, TextareaInput } from "@/src/components/ui/textarea";
import { VStack } from "@/src/components/ui/vstack";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { CreateSportData } from "../../types/sport-types";
import { LOADING_STATES, SPORT_CATEGORIES_LIST, SPORT_PLACEHOLDERS, SPORT_VALIDATION_LIMITS } from "../../utils/sport-constants";
import { validateSportDescription, validateSportName } from "../../utils/sport-validations";

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

interface FormData {
  name: string;
  description: string;
  category: string; // Puede estar vacío
}

/**
 * Formulario para crear un nuevo deporte
 * Componente controlado que solo maneja la UI y validación de formulario
 */
export const CreateSportForm: React.FC<CreateSportFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  error = null
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "", // Sin categoría por defecto
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /**
   * Actualiza un campo del formulario y limpia su error
   */
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Valida el formulario usando las utilidades de validación
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validar nombre
    const nameError = validateSportName(formData.name);
    if (nameError) {
      errors.name = nameError;
    }

    // Validar descripción
    const descriptionError = validateSportDescription(formData.description);
    if (descriptionError) {
      errors.description = descriptionError;
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
      // Convertir datos del formulario al tipo esperado
      const sportData: CreateSportData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() ? formData.category.trim() as any : undefined,
      };
      
      await onSubmit(sportData);
    } catch {
      // El error se maneja en el componente padre
    }
  };

  return (
    <Box className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <HStack className="items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">
          Create New Sport
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

        {/* Sport name */}
        <FormControl isInvalid={!!formErrors.name} isRequired>
          <FormControlLabel>
            <FormControlLabelText className="text-gray-700 font-medium">
              Sport Name
            </FormControlLabelText>
          </FormControlLabel>
          <Input className="mt-1">
            <InputField
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder={SPORT_PLACEHOLDERS.NAME}
              maxLength={SPORT_VALIDATION_LIMITS.NAME_MAX_LENGTH}
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

        {/* Description */}
        <FormControl isInvalid={!!formErrors.description} isRequired>
          <FormControlLabel>
            <FormControlLabelText className="text-gray-700 font-medium">
              Description
            </FormControlLabelText>
          </FormControlLabel>
          <Textarea className="mt-1">
            <TextareaInput
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder={SPORT_PLACEHOLDERS.DESCRIPTION}
              maxLength={SPORT_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
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

        {/* Category */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText className="text-gray-700 font-medium">
              Category
              <Text className="text-gray-500 font-normal"> (Optional)</Text>
            </FormControlLabelText>
          </FormControlLabel>
          
          {/* Selector de categorías */}
          <Box className="mt-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack space="xs" className="py-2">
                {/* Option to remove category */}
                <Pressable
                  onPress={() => updateField('category', '')}
                  className={`px-3 py-2 rounded-full border ${
                    !formData.category
                      ? 'bg-gray-100 border-gray-400'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <Text
                    className={`text-sm ${
                      !formData.category
                        ? 'text-gray-700 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    No Category
                  </Text>
                </Pressable>
                
                {/* Available categories */}
                {SPORT_CATEGORIES_LIST.map((category) => {
                  const isSelected = formData.category === category.value;
                  
                  return (
                    <Pressable
                      key={category.value}
                      onPress={() => updateField('category', category.value)}
                      className={`px-3 py-2 rounded-full border ${
                        isSelected
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                      disabled={isLoading}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </HStack>
            </ScrollView>
          </Box>
        </FormControl>

        {/* Buttons */}
        <HStack className="mt-6" space="md">
          <Button 
            variant="outline" 
            className="flex-1"
            onPress={onCancel}
            disabled={isLoading}
          >
            <ButtonText className="text-gray-700">Cancel</ButtonText>
          </Button>
          <Button 
            className="flex-1 bg-blue-600"
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <ButtonText className="text-white font-medium">
              {isLoading ? LOADING_STATES.CREATING : "Create Sport"}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};