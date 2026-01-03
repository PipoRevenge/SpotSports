/**
 * SortDropdown Component
 * 
 * Reusable dropdown for sorting options
 */

import { ChevronDown } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SortOption<T = string> {
  value: T;
  label: string;
  icon?: string;
}

interface SortDropdownProps<T = string> {
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function SortDropdown<T extends string = string>({ 
  options, 
  value, 
  onChange,
  label = 'Sort by'
}: SortDropdownProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2"
      >
        <Text className="flex-1 text-sm text-gray-700">
          {selectedOption?.label || label}
        </Text>
        <ChevronDown size={16} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          className="bg-black/50 justify-end"
        >
          <View className="bg-white rounded-t-2xl p-4">
            <Text className="text-lg font-semibold mb-4">{label}</Text>
            
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`py-3 px-4 rounded-lg mb-2 ${
                  option.value === value ? 'bg-primary-100' : 'bg-gray-50'
                }`}
              >
                <Text
                  className={`text-sm ${
                    option.value === value ? 'text-primary-600 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="mt-4 py-3 bg-gray-100 rounded-lg"
            >
              <Text className="text-center text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
