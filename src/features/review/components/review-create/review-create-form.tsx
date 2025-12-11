import {
  MediaItem,
  MediaPickerCarousel,
} from "@/src/components/commons/media-picker/media-picker-carousel";
import { RatingStars } from "@/src/components/commons/rating/rating-stars";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/src/components/ui/alert-dialog";
import { Box } from "@/src/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/src/components/ui/form-control";
import { HStack } from "@/src/components/ui/hstack";
import { Text } from "@/src/components/ui/text";
import { Textarea, TextareaInput } from "@/src/components/ui/textarea";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from '@/src/context/app-alert-context';
import { Plus, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import {
  CreateReviewData,
  ReviewFormData,
  ReviewFormErrors,
  ReviewSportFormData,
  SimpleSport,
} from "../../types/review-types";
import {
  REVIEW_ERROR_MESSAGES,
  REVIEW_LOADING_STATES,
  REVIEW_PLACEHOLDERS,
  REVIEW_VALIDATION_LIMITS,
} from "../../utils/review-constants";
import { validateReviewForm } from "../../utils/review-validation";
import { AddSportModal, SportSearchSlotProps } from "./add-sport-modal";
import { SportRatingItem } from "./sport-rating-item";
import { SpotSportsSelector } from "./spot-sports-selector";

interface CreateReviewFormProps {
  spotId: string;
  spotSports?: SimpleSport[];
  availableSportIds?: string[]; // IDs de deportes ya disponibles en el spot
  onSubmit: (data: CreateReviewData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  initialData?: ReviewFormData; // Datos iniciales para edición
  isEditMode?: boolean; // Modo edición
  /**
   * Slot for sport search component - must be provided by the app layer
   * This follows the architecture pattern of feature independence
   */
  sportSearchSlot?: React.ComponentType<SportSearchSlotProps>;
}

/**
 * Formulario para crear una nueva review
 * Permite calificar el spot, añadir deportes, contenido y multimedia
 */
export const CreateReviewForm: React.FC<CreateReviewFormProps> = ({
  spotId,
  spotSports = [],
  availableSportIds = [],
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  initialData,
  isEditMode = false,
  sportSearchSlot,
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState<ReviewFormData>(
    initialData || {
      content: "",
      rating: 0,
      reviewSports: [],
      media: [],
    }
  );

  // Actualizar formData cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const [formErrors, setFormErrors] = useState<ReviewFormErrors>({});
    const { showError } = useAppAlert();
  const [showSpotSportsSelector, setShowSpotSportsSelector] = useState(false);
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  /**
   * Actualiza el rating general
   */
  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (formErrors.rating) {
      setFormErrors((prev) => ({ ...prev, rating: undefined }));
    }
  };

  /**
   * Actualiza el contenido
   */
  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
    if (formErrors.content) {
      setFormErrors((prev) => ({ ...prev, content: undefined }));
    }
  };

  /**
   * Actualiza los medios
   */
  const handleMediaChange = (media: MediaItem[]) => {
    setFormData((prev) => ({ ...prev, media }));
    if (formErrors.media) {
      setFormErrors((prev) => ({ ...prev, media: undefined }));
    }
  };

  /**
   * Añade un deporte a la review
   */
  const handleAddSport = (sport: ReviewSportFormData) => {
    // Verificar que no esté duplicado
    if (formData.reviewSports.some((s) => s.sportId === sport.sportId)) {
      showError(REVIEW_ERROR_MESSAGES.DUPLICATE_SPORT, 'Error');
      return;
    }

    // Verificar límite
    if (formData.reviewSports.length >= REVIEW_VALIDATION_LIMITS.MAX_SPORTS_COUNT) {
      showError(REVIEW_ERROR_MESSAGES.TOO_MANY_SPORTS, 'Error');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      reviewSports: [...prev.reviewSports, sport],
    }));

    if (formErrors.reviewSports) {
      setFormErrors((prev) => ({ ...prev, reviewSports: undefined }));
    }
  };

  /**
   * Actualiza un deporte en la review
   */
  const handleUpdateSport = (index: number, sport: ReviewSportFormData) => {
    setFormData((prev) => ({
      ...prev,
      reviewSports: prev.reviewSports.map((s, i) => (i === index ? sport : s)),
    }));
  };

  /**
   * Elimina un deporte de la review
   */
  const handleRemoveSport = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      reviewSports: prev.reviewSports.filter((_, i) => i !== index),
    }));
  };

  /**
   * Valida y envía el formulario
   */
  const handleSubmit = async () => {
    // Validar formulario
    const validation = validateReviewForm(formData);

    if (!validation.isValid) {
      const firstField = Object.keys(validation.errors)[0];
      const firstMessage = firstField ? `${firstField}: ${validation.errors[firstField]}` : 'Revisa los campos obligatorios';
      setFormErrors(validation.errors as ReviewFormErrors);
      showError(firstMessage, 'Error de validación');
      return;
    }

    // Si es modo edición, mostrar confirmación
    if (isEditMode) {
      setShowConfirmDialog(true);
      return;
    }

    // Si no es edición, enviar directamente
    await submitReview();
  };

  /**
   * Envía la review al backend
   */
  const submitReview = async () => {
    setShowConfirmDialog(false);

    try {
      // Convertir media a URLs (URIs locales que se subirán al repositorio)
      const mediaUrls = formData.media.map((m) => m.uri);

      const reviewData: CreateReviewData = {
        spotId,
        content: formData.content.trim(),
        rating: formData.rating,
        reviewSports: formData.reviewSports,
        media: mediaUrls, // Siempre pasar array (vacío o con URIs)
      };

      await onSubmit(reviewData);
    } catch (err) {
      // El error se maneja en el componente padre
      console.error("[CreateReviewForm] Error submitting review:", err);
    }
  };

  const excludedSportIds = formData.reviewSports.map((s) => s.sportId);

  return (
    <Box className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack className="p-4 gap-6">
          {/* Header */}
          <HStack className="items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Review" : "Write a Review"}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={onCancel}
              disabled={isLoading}
            >
              <ButtonIcon as={X} className="text-gray-500" />
            </Button>
          </HStack>

          {/* Error general */}
          {error && (
            <Box className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <Text className="text-red-700 text-center">{error}</Text>
            </Box>
          )}

          {/* Rating general del spot */}
          <FormControl isInvalid={!!formErrors.rating} isRequired className="w-full h-10">
            <FormControlLabel>
              <FormControlLabelText className="text-base font-semibold text-gray-900">
                Overall Spot Rating
              </FormControlLabelText>
            </FormControlLabel>
            <RatingStars
              rating={formData.rating}
              onRatingChange={handleRatingChange}
              size="lg"
              editable={!isLoading}
              allowHalf
            />
            {formErrors.rating && (
              <FormControlError>
                <FormControlErrorText>{formErrors.rating}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {/* Contenido de la review */}
          <FormControl isInvalid={!!formErrors.content} isRequired>
            <FormControlLabel>
              <FormControlLabelText className="text-base font-semibold text-gray-900">
                Your Review
              </FormControlLabelText>
            </FormControlLabel>
            <Textarea className="pt-2">
              <TextareaInput
                value={formData.content}
                onChangeText={handleContentChange}
                placeholder={REVIEW_PLACEHOLDERS.CONTENT}
                maxLength={REVIEW_VALIDATION_LIMITS.CONTENT_MAX_LENGTH}
                numberOfLines={5}
                editable={!isLoading}
                className="text-gray-900"
              />
            </Textarea>
            <HStack className="justify-between items-center pt-1">
              {formErrors.content ? (
                <FormControlError>
                  <FormControlErrorText>
                    {formErrors.content}
                  </FormControlErrorText>
                </FormControlError>
              ) : (
                <Text className="text-xs text-gray-500">
                  Min. {REVIEW_VALIDATION_LIMITS.CONTENT_MIN_LENGTH} characters
                </Text>
              )}
              <Text className="text-xs text-gray-500">
                {formData.content.length} / {REVIEW_VALIDATION_LIMITS.CONTENT_MAX_LENGTH}
              </Text>
            </HStack>
          </FormControl>

          {/* Media */}
          <FormControl isInvalid={!!formErrors.media}>
            <FormControlLabel>
              <FormControlLabelText className="text-base font-semibold text-gray-900">
                Photos & Videos
                <Text className="text-gray-500 font-normal text-sm"> (Optional)</Text>
              </FormControlLabelText>
            </FormControlLabel>
            <MediaPickerCarousel
              media={formData.media}
              onMediaChange={handleMediaChange}
              error={formErrors.media}
              maxCount={20}
              minCount={0}
              required={false}
              showTitle={false}
            />
          </FormControl>

          {/* Deportes calificados */}
          <FormControl isInvalid={!!formErrors.reviewSports} isRequired>
            <FormControlLabel>
              <FormControlLabelText className="text-base font-semibold text-gray-900">
                Sports Ratings
              </FormControlLabelText>
            </FormControlLabel>

            <VStack className="pt-2 gap-4">
              {/* Lista de deportes */}
              {formData.reviewSports.length > 0 ? (
                formData.reviewSports.map((sport, index) => (
                  <SportRatingItem
                    key={sport.sportId}
                    sport={sport}
                    onUpdate={(updated) => handleUpdateSport(index, updated)}
                    onRemove={() => handleRemoveSport(index)}
                    isLoading={isLoading}
                  />
                ))
              ) : (
                <Box className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-6">
                  <Text className="text-center text-gray-500">
                    No sports added yet. Add at least one sport to your review.
                  </Text>
                </Box>
              )}

              {/* Botón añadir deporte */}
              <Button
                variant="outline"
                onPress={() => setShowSpotSportsSelector(true)}
                disabled={
                  isLoading ||
                  formData.reviewSports.length >= REVIEW_VALIDATION_LIMITS.MAX_SPORTS_COUNT
                }
                className="border-blue-500"
              >
                <ButtonIcon as={Plus} className="text-blue-600 pr-2" />
                <ButtonText className="text-blue-600 font-medium">
                  Add Sport ({formData.reviewSports.length} /{" "}
                  {REVIEW_VALIDATION_LIMITS.MAX_SPORTS_COUNT})
                </ButtonText>
              </Button>

              {formErrors.reviewSports && (
                <FormControlError>
                  <FormControlErrorText>
                    {formErrors.reviewSports}
                  </FormControlErrorText>
                </FormControlError>
              )}
            </VStack>
          </FormControl>

          {/* Botones de acción */}
          <VStack className="pt-6 pb-8 gap-4">
            <Button
              className="bg-blue-600"
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <ButtonText className="text-white font-semibold">
                {isLoading 
                  ? REVIEW_LOADING_STATES.CREATING 
                  : isEditMode 
                    ? "Update Review" 
                    : "Publish Review"}
              </ButtonText>
            </Button>
            <Button variant="outline" onPress={onCancel} disabled={isLoading}>
              <ButtonText className="text-gray-700">Cancel</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Confirmation Dialog */}
      <AlertDialog isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-xl font-bold">Confirm Changes</Text>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-700">
              Are you sure you want to update your review? This will replace your previous review.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack className="gap-3">
              <Button
                variant="outline"
                onPress={() => setShowConfirmDialog(false)}
                disabled={isLoading}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                className="bg-blue-600"
                onPress={submitReview}
                disabled={isLoading}
              >
                <ButtonText className="text-white">Confirm</ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal selector de deportes del spot */}
      <SpotSportsSelector
        visible={showSpotSportsSelector}
        onClose={() => setShowSpotSportsSelector(false)}
        onSelectSport={handleAddSport}
        spotSports={spotSports}
        excludeSportIds={excludedSportIds}
        onOpenCustomSportModal={() => setShowAddSportModal(true)}
      />

      {/* Modal añadir deporte personalizado */}
      <AddSportModal
        visible={showAddSportModal}
        onClose={() => setShowAddSportModal(false)}
        onAddSport={handleAddSport}
        excludeSportIds={excludedSportIds}
        spotSports={spotSports}
        availableSportIds={availableSportIds}
        sportSearchSlot={sportSearchSlot}
      />
    </Box>
  );
};
