import { RatingDifficultySlider } from '@/src/components/commons/rating/rating-difficulty-slider';
import { Box } from '@/src/components/ui/box';
import { Button, ButtonIcon } from '@/src/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/src/components/ui/form-control';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { Textarea, TextareaInput } from '@/src/components/ui/textarea';
import { VStack } from '@/src/components/ui/vstack';
import { useAppAlert } from '@/src/context/app-alert-context';
import { numberToDifficulty } from '@/src/types/difficulty';
import { X } from 'lucide-react-native';
import React from 'react';
import {
  ReviewSportFormData,
} from '../../types/review-types';

interface SportRatingItemProps {
  sport: ReviewSportFormData;
  onUpdate: (sport: ReviewSportFormData) => void;
  onRemove: () => void;
  isLoading?: boolean;
}

/**
 * Componente para calificar un deporte individual
 * Muestra rating y dificultad
 */
export const SportRatingItem: React.FC<SportRatingItemProps> = ({
  sport,
  onUpdate,
  onRemove,
  isLoading = false,
}) => {
  const handleRatingChange = (rating: number) => {
    onUpdate({
      ...sport,
      sportRating: rating,
    });
  };

  const handleDifficultyChange = (difficultyValue: number) => {
    onUpdate({
      ...sport,
      difficulty: difficultyValue,
    });
  };

  const handleCommentChange = (comment: string) => {
    onUpdate({
      ...sport,
      comment: comment,
    });
  };

  const { showConfirm } = useAppAlert();

  const handleRemove = async () => {
    const confirmed = await showConfirm(
      'Eliminar deporte',
      `¿Estás seguro que quieres eliminar ${sport.name} de la lista?`,
      'Eliminar',
      'Cancelar'
    );
    if (!confirmed) return;
    onRemove();
  };

  return (
    <Box className="bg-white border border-gray-200 rounded-lg p-4">
      <VStack className="gap-4">
        {/* Header con nombre y botón eliminar */}
        <HStack className="justify-between items-center">
          <Text className="text-base font-semibold text-gray-900">
            {sport.name}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleRemove}
            disabled={isLoading}
            className="p-2"
          >
            <ButtonIcon as={X} className="text-gray-500" />
          </Button>
        </HStack>

        {/* Dificultad */}
        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText className="text-sm text-gray-700">
              Difficulty Level
            </FormControlLabelText>
          </FormControlLabel>

          <RatingDifficultySlider
            difficulty={numberToDifficulty(sport.difficulty)}
            onDifficultyChange={() => {
              // No necesitamos hacer nada aquí, usamos onValueChange
            }}
            onValueChange={handleDifficultyChange}
            editable={!isLoading}
            size="md"
          />
        </FormControl>

        {/* Comentario sobre el deporte */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText className="text-sm text-gray-700">
              Comment about this sport (optional)
            </FormControlLabelText>
          </FormControlLabel>
          <Textarea>
            <TextareaInput
              placeholder={`Share your experience with ${sport.name} at this spot...`}
              value={sport.comment || ''}
              onChangeText={handleCommentChange}
              editable={!isLoading}
              numberOfLines={3}
            />
          </Textarea>
        </FormControl>
      </VStack>
    </Box>
  );
};
