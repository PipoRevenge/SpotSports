import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Button, Platform, View } from 'react-native';

export interface DatePickerComponentProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  showTime?: boolean; // new prop to allow time selection
  placeholder?: string;
}

const DatePickerComponent: React.FC<DatePickerComponentProps> = ({
  value,
  onChange,
  disabled = false,
  showTime = false,
  placeholder = 'Select Date & Time',
}) => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const onChangeHandler = (event: any, selectedDate?: Date) => {
    // On Android the event has type 'dismissed' when cancelled
    setShow(false);
    if (selectedDate) {
      // If we requested both date and time, and we were on date mode, open time picker next
      if (showTime && mode === 'date') {
        // set the date selected, then immediately show time picker
        onChange(selectedDate);
        setMode('time');
        setShow(true);
        return;
      }

      // For time mode or single mode, apply selection
      onChange(selectedDate);
    }
  };

  const showPicker = (initialMode: 'date' | 'time' = 'date') => {
    if (!disabled) {
      setMode(initialMode);
      setShow(true);
    }
  };

  return (
    <View>
      <Button
        title={value ? value.toLocaleString() : placeholder}
        onPress={() => showPicker('date')}
        disabled={disabled}
      />
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeHandler}
        />
      )}
    </View>
  );
};

export default DatePickerComponent;