import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Button, Platform, View } from 'react-native';

export interface DatePickerComponentProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

const DatePickerComponent: React.FC<DatePickerComponentProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const onChangeHandler = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const showDatepicker = () => {
    if (!disabled) {
      setMode('date');
      setShow(true);
    }
  };

  return (
    <View>
      <Button
        title={value ? value.toDateString() : 'Select Date'}
        onPress={showDatepicker}
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