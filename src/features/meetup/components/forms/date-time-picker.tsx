import DatePickerComponent from '@/src/components/commons/date/date-picker-component';
import React from 'react';
import { Text, View } from 'react-native';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, disabled = false }) => {
  return (
    <View>
      <Text className="mb-1 font-medium text-gray-700">Date & Time</Text>
      <DatePickerComponent value={value} onChange={onChange} disabled={disabled} showTime />
    </View>
  );
};
