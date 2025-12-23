import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Button, Platform, View } from 'react-native';

export interface HourPickerProps {
  value?: string; // 'HH:mm'
  onChange: (value: string) => void;
  disabled?: boolean;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const HourPicker: React.FC<HourPickerProps> = ({ value, onChange, disabled = false }) => {
  const [show, setShow] = useState(false);

  const toDate = (time?: string) => {
    const d = new Date();
    if (!time) return d;
    const [hh, mm] = time.split(':').map(Number);
    d.setHours(hh ?? 0, mm ?? 0, 0, 0);
    return d;
  };

  const displayLabel = value ?? 'Select Time';

  const onChangeHandler = (_event: any, selectedDate?: Date) => {
    setShow(false);
    if (!selectedDate) return;
    const hh = selectedDate.getHours();
    const mm = selectedDate.getMinutes();
    onChange(`${pad(hh)}:${pad(mm)}`);
  };

  return (
    <View>
      <Button title={displayLabel} onPress={() => setShow(true)} disabled={disabled} />
      {show && (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeHandler}
        />
      )}
    </View>
  );
};

export default HourPicker;
