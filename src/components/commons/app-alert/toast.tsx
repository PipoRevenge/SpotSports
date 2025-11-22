import { Portal } from '@/src/components/ui/portal';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import React, { useEffect } from 'react';
import { View } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number; // milliseconds
}

export const AppAlertToast: React.FC<ToastProps> = ({ visible, message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <Portal>
      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
        <VStack className={`p-3 rounded-md ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          <Text className="text-white">{message}</Text>
        </VStack>
      </View>
    </Portal>
  );
};
