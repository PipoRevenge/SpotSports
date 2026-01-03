/**
 * FilterChip Component
 * 
 * Small chip to display active filter with remove option
 */

import { X } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  color?: 'primary' | 'secondary' | 'accent';
}

const COLOR_CLASSES = {
  primary: 'bg-primary-100 border-primary-300',
  secondary: 'bg-blue-100 border-blue-300',
  accent: 'bg-purple-100 border-purple-300',
};

const TEXT_COLOR_CLASSES = {
  primary: 'text-primary-700',
  secondary: 'text-blue-700',
  accent: 'text-purple-700',
};

export function FilterChip({ label, onRemove, color = 'primary' }: FilterChipProps) {
  return (
    <View className={`flex-row items-center px-3 py-1.5 rounded-full border ${COLOR_CLASSES[color]}`}>
      <Text className={`text-xs font-medium ${TEXT_COLOR_CLASSES[color]}`}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        className="ml-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={14} color={color === 'primary' ? '#3B82F6' : color === 'secondary' ? '#2563EB' : '#9333EA'} />
      </TouchableOpacity>
    </View>
  );
}
