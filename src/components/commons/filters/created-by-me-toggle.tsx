/**
 * CreatedByMeToggle Component
 * 
 * Toggle to show only user's content
 */

import { User } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface CreatedByMeToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
  label?: string;
  contentType?: 'discussions' | 'reviews' | 'meetups';
}

const CONTENT_LABELS = {
  discussions: 'My Discussions',
  reviews: 'My Reviews',
  meetups: 'My Meetups',
};

export function CreatedByMeToggle({ 
  active, 
  onChange, 
  label,
  contentType = 'discussions'
}: CreatedByMeToggleProps) {
  const displayLabel = label || CONTENT_LABELS[contentType];

  return (
    <TouchableOpacity
      onPress={() => onChange(!active)}
      className={`flex-row items-center px-4 py-2 rounded-full border ${
        active 
          ? 'bg-primary-100 border-primary-500' 
          : 'bg-white border-gray-300'
      }`}
    >
      <User 
        size={16} 
        color={active ? '#3B82F6' : '#6B7280'} 
      />
      <Text
        className={`ml-2 text-sm font-medium ${
          active ? 'text-primary-600' : 'text-gray-700'
        }`}
      >
        {displayLabel}
      </Text>
    </TouchableOpacity>
  );
}
