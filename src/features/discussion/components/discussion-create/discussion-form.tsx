import { MediaItem, MediaPickerCarousel } from '@/src/components/commons/media-picker/media-picker-carousel';
import Tag from '@/src/components/commons/tag';
import { Button, ButtonText } from '@/src/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/src/components/ui/form-control';
import { HStack } from '@/src/components/ui/hstack';
import { Input, InputField } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { Textarea, TextareaInput } from '@/src/components/ui/textarea';
import { VStack } from '@/src/components/ui/vstack';
import { AVAILABLE_TAGS, DEFAULT_TAGS, getTagColor } from '@/src/features/discussion/constants/tags';
import { SimpleSport } from '@/src/entities/sport/model/sport';
import React, { useEffect, useState } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';

interface DiscussionFormProps {
  initialData?: any;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (payload: { title: string; description?: string; tags?: string[]; media?: MediaItem[] }) => Promise<any>;
  spotSports?: SimpleSport[];
  onCancel?: () => void;
}

export const DiscussionForm: React.FC<DiscussionFormProps> = ({ initialData, isSubmitting, error, onSubmit, onCancel, spotSports }) => {
  const [title, setTitle] = useState(initialData?.details?.title || '');
  const [description, setDescription] = useState(initialData?.details?.description || '');
  // const AVAILABLE_TAGS and DEFAULT_TAGS are imported from constants

  // const [tagsText, setTagsText] = useState((initialData?.details?.tags || []).join(', '));
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (initialData?.details?.tags && initialData.details.tags.length > 0) {
      const mapToName = (tag: string) => {
        // if tag is a sportId, convert to name
        const spotMatch = (spotSports || []).find(s => s.id === tag);
        return spotMatch ? spotMatch.name : tag;
      };
      return initialData.details.tags.map((t: string) => mapToName(t));
    }
    return DEFAULT_TAGS.map(t => t.label);
  });
  const [tagQuery, setTagQuery] = useState('');
  // No custom color picker; tag colors come from constants and spot sports are green
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>(() => {
    if (initialData?.details?.media && Array.isArray(initialData.details.media)) {
      return initialData.details.media.map((uri: string) => ({ uri, type: uri.match(/\.(mp4|mov|webm|avi)$/i) ? 'video' : 'image' }));
    }
    return [];
  });

  useEffect(() => {
    if (error) setFieldError(error);
  }, [error]);

  const handleSubmit = async () => {
    if (!title || title.trim().length < 3) {
      setFieldError('Title must be at least 3 characters');
      return;
    }

      // Build tags from selectedTags and typed tags (if any)
      const typedTags = tagQuery ? [tagQuery.trim()] : [];
      const tags = Array.from(new Set([...(selectedTags || []), ...typedTags].map(t => t.trim()).filter(Boolean)));

    await onSubmit({ title: title.trim(), description: description.trim(), tags, media });
  };

  // Combine available tags (global) with spot-specific tags (green) into suggestions
  const spotTags: SimpleSport[] = spotSports || [];
  const spotTagObjects = spotTags.map(s => ({ label: s.name, color: '#2ECC71' } as { label: string; color?: string }));

  const suggestionPool = [...AVAILABLE_TAGS, ...spotTagObjects];
  const filteredSuggestions = suggestionPool.filter(s => !selectedTags.includes(s.label) && (!tagQuery || s.label.toLowerCase().includes(tagQuery.toLowerCase())));

  const addTag = (t: string) => {
    const tag = t.trim();
    if (!tag) return;
    // If tag is a sport ID in spotlight sports, convert to name
    const spotMatchById = spotTags.find(s => s.id === tag);
    const normalized = spotMatchById ? spotMatchById.name : tag;
    if (selectedTags.includes(normalized)) return;
    setSelectedTags(prev => [...prev, normalized]);
    // nothing else: colors are driven by available constants and spot sports
    setTagQuery('');
    Keyboard.dismiss();
  };

  const removeTag = (t: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== t));
  };

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      removeTag(t);
      return;
    }
    addTag(t);
  };

  return (
    <VStack className="p-4 bg-white flex-1">
      <Text className="text-2xl font-bold text-center pb-4">{initialData ? 'Edit Discussion' : 'Create Discussion'}</Text>

      {fieldError && (
        <View className="bg-red-50 p-3 rounded-md mb-4">
          <Text className="text-red-700 text-center">{fieldError}</Text>
        </View>
      )}

      <FormControl isRequired isInvalid={!!fieldError}>
        <FormControlLabel>
          <FormControlLabelText>Title</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField value={title} onChangeText={setTitle} placeholder="Short, descriptive title" maxLength={120} />
        </Input>
      </FormControl>

      <FormControl className="pt-4">
        <FormControlLabel>
          <FormControlLabelText>Description</FormControlLabelText>
        </FormControlLabel>
        <Textarea>
          <TextareaInput value={description} onChangeText={setDescription} placeholder="Describe the topic for discussion" numberOfLines={6} maxLength={500} />
        </Textarea>
      </FormControl>

      <FormControl className="pt-4">
        <FormControlLabel>
          <FormControlLabelText>Tags (search or add)</FormControlLabelText>
        </FormControlLabel>
        <VStack className="gap-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2 py-2">
            <HStack className="gap-2">
              {selectedTags.map(tag => {
                // If tag is a sport ID passed accidentally, display its name
                const sportById = spotTags.find(s => s.id === tag);
                const sportByName = spotTags.find(s => s.name === tag);
                const displayLabel = sportById ? sportById.name : tag;
                const isSpotSport = !!sportById || !!sportByName;
                const color = getTagColor(displayLabel) || (isSpotSport ? '#2ECC71' : '#E5E7EB');
                return (
                  <Tag
                    key={tag}
                    label={displayLabel}
                    color={color}
                    onPress={() => toggleTag(displayLabel)}
                    style={{ borderRadius: 12 }}
                  />
                );
              })}
            </HStack>
          </ScrollView>

            <Input>
            <InputField
              value={tagQuery}
              onChangeText={(value) => setTagQuery(value)}
              placeholder="Search or add tags (e.g., Q&A, Guide)"
              onSubmitEditing={() => { if (tagQuery) addTag(tagQuery); }}
            />
          </Input>
          {/* Color palette removed: tags are either from constants or are spot-specific green tags */}

          {/* Suggestions list */}
          {filteredSuggestions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pt-2">
              <HStack className="gap-2">
                {filteredSuggestions.map(sObj => {
                  const isSpotSuggested = spotTags.some(s => s.name === sObj.label);
                  const color = getTagColor(sObj.label) || (isSpotSuggested ? '#2ECC71' : '#F3F4F6');
                    return (
                  <Tag key={sObj.label} label={sObj.label} color={color} onPress={() => toggleTag(sObj.label)} />
                );})}
              </HStack>
            </ScrollView>
          )}
        </VStack>
      </FormControl>

      {/* Media Picker */}
      <FormControl className="pt-4">
        <FormControlLabel>
          <FormControlLabelText>Media (optional)</FormControlLabelText>
        </FormControlLabel>
        <MediaPickerCarousel
          media={media}
          onMediaChange={(m) => setMedia(m)}
          maxCount={8}
          showTitle={false}
          helpText="Add photos or up to 60s videos"
          showHelpText
        />
      </FormControl>

      <HStack className="gap-2 pt-6">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} className="flex-1">
            <ButtonText>Cancel</ButtonText>
          </Button>
        )}
        <Button onPress={handleSubmit} className="flex-1" isDisabled={!!isSubmitting}>
          <ButtonText className="text-white font-semibold">{initialData ? 'Update' : 'Create'}</ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
};
