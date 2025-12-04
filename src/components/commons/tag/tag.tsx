import { Badge, BadgeText } from '@/src/components/ui/badge';
import { Text } from '@/src/components/ui/text';
import { getContrastingTextColor } from '@/src/utils/color-utils';
import React from 'react';
import { Pressable, View } from 'react-native';

interface TagProps {
  label: string;
  color?: string; // hex color
  isSelected?: boolean; // for styles that change when selected
  onPress?: () => void;
  style?: any;
  className?: string;
  testID?: string;
}

export const Tag: React.FC<TagProps> = ({ label, color, isSelected, onPress, style, className, testID }) => {
  const bg = color || '#E5E7EB';
  const textColor = getContrastingTextColor(bg);

  // Safeguard: if Badge or BadgeText are not defined (unexpected), render a simple fallback
  if (!Badge || !BadgeText) {
    console.warn('[Tag] Badge or BadgeText missing; rendering fallback View');
    return (
      <Pressable onPress={onPress} testID={testID} style={{ opacity: onPress ? 1 : 1 }}>
        <View style={[{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }, style]}>
          <Text style={{ color: textColor }}>{label}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} testID={testID} style={{ opacity: onPress ? 1 : 1 }}>
      <Badge style={[{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }, style]} className={className}>
        <BadgeText style={{ color: textColor }}>{label}</BadgeText>
      </Badge>
    </Pressable>
  );
};

export default Tag;
