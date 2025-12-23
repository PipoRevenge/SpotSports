import { Input, InputField } from '@/src/components/ui/input';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange }) => {
  const [text, setText] = useState('');

  const addTag = () => {
    const t = text.trim();
    if (!t) return;
    if (!tags.includes(t)) onChange([...tags, t]);
    setText('');
  };

  const removeTag = (t: string) => {
    onChange(tags.filter((x) => x !== t));
  };

  return (
    <View>
      <Input>
        <InputField placeholder="Add tag and press enter or Add" value={text} onChangeText={setText} />
      </Input>
      <View className="flex-row gap-2 mt-2 items-center">
        <Pressable onPress={addTag} className="bg-primary-500 px-3 py-1 rounded">
          <Text className="text-white">Add</Text>
        </Pressable>
        <View className="flex-row flex-wrap gap-2">
          {tags.map((t) => (
            <Pressable key={t} onPress={() => removeTag(t)} className="bg-gray-200 px-2 py-1 rounded">
              <Text className="text-sm">#{t} ✕</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};
