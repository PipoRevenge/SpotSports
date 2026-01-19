import { LoadingScreen } from "@/src/components/commons/loading-screen";
import { LocationPickerModal } from "@/src/components/commons/map/location-picker-modal";
import {
  MediaItem,
  MediaPickerCarousel,
} from "@/src/components/commons/media-picker/media-picker-carousel";
import { Button, ButtonText } from "@/src/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/src/components/ui/form-control";
import { HStack } from "@/src/components/ui/hstack";
import { Input, InputField } from "@/src/components/ui/input";
import { Text } from "@/src/components/ui/text";
import { Textarea, TextareaInput } from "@/src/components/ui/textarea";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from "@/src/context/app-alert-context";
import { GeoPoint } from "@/src/types/geopoint";
import { MapPin } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useCreateSpot } from "../../hooks/use-create-spot";
import {
  SpotCreateFormData,
  SpotCreateFormProps,
  SpotFormErrors,
} from "../../types/spot-types";
import { validateSpotCreateForm } from "../../utils/spot-validations";

export const SpotCreateForm: React.FC<SpotCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  initialLocation,
  sportsSlot: SportsSlot,
  onSubmitForm,
  externalLoading,
}) => {
  // Hook para crear spot
  const { createSpot, isLoading, error, clearError } = useCreateSpot();

  // Estado del formulario
  const [formData, setFormData] = useState<SpotCreateFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    availableSports: initialData?.availableSports || [],
    media: initialData?.media || [],
    location: initialLocation || initialData?.location || null,
    contactPhone: initialData?.contactPhone || "",
    contactEmail: initialData?.contactEmail || "",
    contactWebsite: initialData?.contactWebsite || "",
  });

  // Errores de validación
  const [formErrors, setFormErrors] = useState<SpotFormErrors>({});

  // Estado del modal de ubicación
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  /**
   * Actualiza un campo del formulario
   */
  const updateFormField = (field: keyof SpotCreateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error del campo
    if (formErrors[field as keyof SpotFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
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
    updateFormField("availableSports", selectedSports);
  };

  /**
   * Maneja el cambio de archivos multimedia
   */
  const handleMediaChange = (newMedia: MediaItem[]) => {
    updateFormField("media", newMedia);
  };

  /**
   * Maneja la selección de ubicación en el mapa
   */
  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
  }) => {
    updateFormField("location", location as GeoPoint);
  };

  /**
   * Abre el modal de selección de ubicación
   */
  const openLocationModal = () => {
    setIsLocationModalOpen(true);
  };

  /**
   * Cierra el modal de selección de ubicación
   */
  const closeLocationModal = () => {
    setIsLocationModalOpen(false);
  };

  /**
   * Maneja el envío del formulario
   */
  const { showSuccess, showError } = useAppAlert();
  const [uploadProgress, setUploadProgress] = useState<string | undefined>();

  const isEditMode = !!initialData;

  const handleSubmit = async () => {
    // Validar formulario
    const validation = validateSpotCreateForm(formData);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        showError(firstError, "Validation Error");
      }
      return;
    }

    try {
      // Mostrar progreso de subida de archivos si hay media
      if (formData.media && formData.media.length > 0) {
        setUploadProgress(`Uploading files (0/${formData.media.length})...`);
      }

      // If a custom submit handler is provided (edit mode), call it
      if (onSubmitForm) {
        await onSubmitForm(formData);
        setUploadProgress(undefined);
        showSuccess("The spot has been updated successfully", "Success!");
        return;
      }

      // Otherwise, create spot
      const spotId = await createSpot(formData);

      if (spotId) {
        setUploadProgress(undefined);
        showSuccess("The spot has been created successfully", "Success!");
        // call onSuccess afterwards
        onSuccess?.(spotId);
      } else {
        setUploadProgress(undefined);
        showError(
          error || "Could not create the spot. Please try again.",
          "Error"
        );
      }
    } catch (err) {
      setUploadProgress(undefined);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      showError(
        errorMessage,
        isEditMode ? "Error updating spot" : "Error creating spot"
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <VStack className="p-4" space="lg">
        {/* Título */}
        <Text className="text-2xl font-bold text-center">
          {isEditMode ? "Edit Spot" : "Create New Spot"}
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
            <FormControlLabelText>Spot Name</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.name}
              onChangeText={(value) => updateFormField("name", value)}
              placeholder="Ex: Municipal Soccer Field"
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
            <FormControlLabelText>Description</FormControlLabelText>
          </FormControlLabel>
          <Textarea>
            <TextareaInput
              value={formData.description}
              onChangeText={(value) => updateFormField("description", value)}
              placeholder="Describe the spot: facilities, status, schedules, etc."
              maxLength={500}
              numberOfLines={4}
            />
          </Textarea>
          {formErrors.description && (
            <FormControlError>
              <FormControlErrorText>
                {formErrors.description}
              </FormControlErrorText>
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
              <FormControlLabelText>Available Sports</FormControlLabelText>
            </FormControlLabel>
            <Text className="text-gray-600 text-sm pt-2">
              No sports selector provided.
            </Text>
            {formErrors.availableSports && (
              <FormControlError>
                <FormControlErrorText>
                  {formErrors.availableSports}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>
        )}

        {/* Multimedia - Fotos y Videos */}
        <FormControl isInvalid={!!formErrors.media} isRequired>
          <FormControlLabel>
            <FormControlLabelText>Spot Photos and Videos</FormControlLabelText>
          </FormControlLabel>
          <MediaPickerCarousel
            media={formData.media}
            onMediaChange={handleMediaChange}
            error={formErrors.media}
            maxCount={10}
            minCount={1}
            required
            showTitle={false}
            helpText="Maximum 10 files • Videos up to 60 seconds"
            showHelpText
          />
        </FormControl>

        {/* Ubicación */}
        <FormControl isInvalid={!!formErrors.location} isRequired>
          <FormControlLabel>
            <FormControlLabelText>Location</FormControlLabelText>
          </FormControlLabel>
          <Text className="text-sm text-gray-600 pb-2">
            Select the spot location on the map
          </Text>

          {/* Botón para abrir el modal de ubicación */}
          <TouchableOpacity
            onPress={openLocationModal}
            className="border border-gray-300 rounded-lg p-4 bg-white"
          >
            <HStack space="md" className="items-center">
              <MapPin
                size={24}
                color={formData.location ? "#007AFF" : "#9CA3AF"}
              />
              <VStack className="flex-1">
                {formData.location ? (
                  <>
                    <Text className="font-semibold text-gray-900">
                      Location selected
                    </Text>
                    <Text className="text-xs text-gray-600 pt-1">
                      Lat: {formData.location.latitude.toFixed(6)}, Lng:{" "}
                      {formData.location.longitude.toFixed(6)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-gray-500">
                    Tap to select location on the map
                  </Text>
                )}
              </VStack>
            </HStack>
          </TouchableOpacity>

          {formErrors.location && (
            <FormControlError>
              <FormControlErrorText>{formErrors.location}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Información de contacto */}
        <Text className="text-lg font-semibold">
          Contact Information (Optional)
        </Text>

        {/* Teléfono */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Phone</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.contactPhone}
              onChangeText={(value) => updateFormField("contactPhone", value)}
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
              onChangeText={(value) => updateFormField("contactEmail", value)}
              placeholder="contact@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Input>
          {formErrors.contactEmail && (
            <FormControlError>
              <FormControlErrorText>
                {formErrors.contactEmail}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Website */}
        <FormControl isInvalid={!!formErrors.contactWebsite}>
          <FormControlLabel>
            <FormControlLabelText>Website</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={formData.contactWebsite}
              onChangeText={(value) => updateFormField("contactWebsite", value)}
              placeholder="https://www.example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </Input>
          {formErrors.contactWebsite && (
            <FormControlError>
              <FormControlErrorText>
                {formErrors.contactWebsite}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Botones de acción */}
        <HStack className="pt-6" space="md">
          {onCancel && (
            <Button
              variant="outline"
              className="flex-1"
              onPress={onCancel}
              disabled={isLoading}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          )}
          <Button
            className="flex-1"
            onPress={handleSubmit}
            disabled={isLoading || !!externalLoading}
          >
            <ButtonText>
              {isLoading || externalLoading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save changes"
                : "Create Spot"}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>

      {/* Modal de selección de ubicación */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={closeLocationModal}
        onConfirm={handleLocationSelect}
        initialLocation={formData.location}
        title="Select Spot Location"
        confirmText="Confirm Location"
        cancelText="Cancel"
      />

      {/* Loading screen */}
      <LoadingScreen
        visible={isLoading}
        message={uploadProgress || "Creating spot..."}
        subMessage={
          formData.media && formData.media.length > 0
            ? "Please wait, this may take a few seconds"
            : undefined
        }
      />
    </ScrollView>
  );
};
