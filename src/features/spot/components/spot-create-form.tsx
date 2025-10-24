import PointPicker from "@/src/components/commons/map/point-picker";
import { Button, ButtonText } from "@/src/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText
} from "@/src/components/ui/form-control";
import { HStack } from "@/src/components/ui/hstack";
import { Input, InputField } from "@/src/components/ui/input";
import { Text } from "@/src/components/ui/text";
import { Textarea, TextareaInput } from "@/src/components/ui/textarea";
import { VStack } from "@/src/components/ui/vstack";
import { GeoPoint } from "@/src/types/geopoint";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useCreateSpot } from "../hooks/use-create-spot";
import {
  SpotCreateFormData,
  SpotCreateFormProps,
  SpotFormErrors
} from "../types/spot-types";
import { validateSpotCreateForm } from "../utils/spot-validations";

export const SpotCreateForm: React.FC<SpotCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  sportsSlot: SportsSlot
}) => {
  // Hook para crear spot
  const { createSpot, isLoading, error, clearError } = useCreateSpot();

  // Estado del formulario
  const [formData, setFormData] = useState<SpotCreateFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    availableSports: initialData?.availableSports || [],
    media: initialData?.media || [],
    location: initialData?.location || null,
    contactPhone: initialData?.contactPhone || "",
    contactEmail: initialData?.contactEmail || "",
    contactWebsite: initialData?.contactWebsite || "",
  });

  // Errores de validación
  const [formErrors, setFormErrors] = useState<SpotFormErrors>({});

  /**
   * Actualiza un campo del formulario
   */
  const updateFormField = (field: keyof SpotCreateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (formErrors[field as keyof SpotFormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Limpiar error general
    if (error) {
      clearError();
    }
  };

  /**
   * Maneja el cambio de deportes seleccionados desde el slot
   */
  const handleSportsChange = (selectedSports: string[]) => {
    updateFormField('availableSports', selectedSports);
  };

  /**
   * Maneja la selección de ubicación en el mapa
   */
  const handleLocationSelect = (location: { latitude: number; longitude: number }) => {
    updateFormField('location', location as GeoPoint);
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async () => {
    // Validar formulario
    const validation = validateSpotCreateForm(formData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // Crear spot
    const success = await createSpot(formData);
    
    if (success) {
      Alert.alert(
        "¡Éxito!",
        "El spot ha sido creado correctamente",
        [
          {
            text: "OK",
            onPress: () => onSuccess?.("mock-spot-id") // En una implementación real, el ID vendría del repositorio
          }
        ]
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="p-4" space="lg">
        {/* Título */}
        <Text className="text-2xl font-bold text-center">
          Crear Nuevo Spot
        </Text>

        {/* Error general */}
        {error && (
          <View className="bg-red-50 p-3 rounded-md">
            <Text className="text-red-700 text-center">{error}</Text>
          </View>
        )}

        {/* Nombre del spot */}
        <FormControl isInvalid={!!formErrors.name} isRequired>
          <FormControlLabel>
            <FormControlLabelText>Nombre del Spot</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.name}
              onChangeText={(value) => updateFormField('name', value)}
              placeholder="Ej: Cancha Municipal de Fútbol"
              maxLength={100}
            />
          </Input>
          {formErrors.name && (
            <FormControlError>
              <FormControlErrorText>{formErrors.name}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Descripción */}
        <FormControl isInvalid={!!formErrors.description} isRequired>
          <FormControlLabel>
            <FormControlLabelText>Descripción</FormControlLabelText>
          </FormControlLabel>
          <Textarea>
            <TextareaInput
              value={formData.description}
              onChangeText={(value) => updateFormField('description', value)}
              placeholder="Describe el spot: instalaciones, estado, horarios, etc."
              maxLength={500}
              numberOfLines={4}
            />
          </Textarea>
          {formErrors.description && (
            <FormControlError>
              <FormControlErrorText>{formErrors.description}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Deportes disponibles - Slot */}
        {SportsSlot ? (
          <SportsSlot
            selectedSports={formData.availableSports}
            onSportsChange={handleSportsChange}
            error={formErrors.availableSports}
          />
        ) : (
          <FormControl isInvalid={!!formErrors.availableSports} isRequired>
            <FormControlLabel>
              <FormControlLabelText>Deportes Disponibles</FormControlLabelText>
            </FormControlLabel>
            <Text className="text-gray-600 text-sm mt-2">
              No se ha proporcionado un selector de deportes.
            </Text>
            {formErrors.availableSports && (
              <FormControlError>
                <FormControlErrorText>{formErrors.availableSports}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        )}

        {/* Ubicación */}
        <FormControl isInvalid={!!formErrors.location} isRequired>
          <FormControlLabel>
            <FormControlLabelText>Ubicación</FormControlLabelText>
          </FormControlLabel>
          <Text className="text-sm text-gray-600 mb-2">
            Toca en el mapa para seleccionar la ubicación del spot
          </Text>
          <View className="h-64 rounded-lg overflow-hidden">
            <PointPicker
              onLocationSelect={handleLocationSelect}
              initialRegion={formData.location ? {
                latitude: formData.location.latitude,
                longitude: formData.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              } : undefined}
            />
          </View>
          {formErrors.location && (
            <FormControlError>
              <FormControlErrorText>{formErrors.location}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Información de contacto */}
        <Text className="text-lg font-semibold">Información de Contacto (Opcional)</Text>

        {/* Teléfono */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Teléfono</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.contactPhone}
              onChangeText={(value) => updateFormField('contactPhone', value)}
              placeholder="+34 123 456 789"
              keyboardType="phone-pad"
            />
          </Input>
        </FormControl>

        {/* Email */}
        <FormControl isInvalid={!!formErrors.contactEmail}>
          <FormControlLabel>
            <FormControlLabelText>Email</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.contactEmail}
              onChangeText={(value) => updateFormField('contactEmail', value)}
              placeholder="contacto@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Input>
          {formErrors.contactEmail && (
            <FormControlError>
              <FormControlErrorText>{formErrors.contactEmail}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Website */}
        <FormControl isInvalid={!!formErrors.contactWebsite}>
          <FormControlLabel>
            <FormControlLabelText>Sitio Web</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.contactWebsite}
              onChangeText={(value) => updateFormField('contactWebsite', value)}
              placeholder="https://www.ejemplo.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </Input>
          {formErrors.contactWebsite && (
            <FormControlError>
              <FormControlErrorText>{formErrors.contactWebsite}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Botones de acción */}
        <HStack className="mt-6" space="md">
          {onCancel && (
            <Button 
              variant="outline" 
              className="flex-1"
              onPress={onCancel}
              disabled={isLoading}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
          )}
          <Button 
            className="flex-1"
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <ButtonText>
              {isLoading ? "Creando..." : "Crear Spot"}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </ScrollView>
  );
};
