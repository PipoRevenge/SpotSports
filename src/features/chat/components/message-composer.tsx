import { Button, ButtonText } from '@/src/components/ui/button';
import { Input, InputField } from '@/src/components/ui/input';
import { Pressable } from '@/src/components/ui/pressable';
import { View } from '@/src/components/ui/view';
import { Paperclip } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface MessageComposerProps {
  onSend: (text: string) => Promise<void> | void;
  isSending?: boolean;
  onAttachPress?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, isSending, onAttachPress }) => {
  const [text, setText] = useState('');

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || isSending) return;
    await onSend(value);
    setText('');
  }, [isSending, onSend, text]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View className="flex-row items-center px-3 py-2 border-t border-slate-200 bg-white">
        {onAttachPress ? (
          <Pressable onPress={onAttachPress} disabled={isSending} className="mr-2" accessibilityRole="button" accessibilityLabel="Adjuntar archivo">
            <Paperclip size={22} color="#0f172a" />
          </Pressable>
        ) : null}
        <Input variant="rounded" size="lg" className="flex-1 bg-slate-100">
          <InputField
            className="text-slate-900"
            placeholder="Escribe un mensaje"
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </Input>
        <View className="pl-2">
          <Button
            action="primary"
            variant="solid"
            size="md"
            disabled={isSending || !text.trim()}
            onPress={handleSend}
          >
            <ButtonText>{isSending ? '...' : 'Enviar'}</ButtonText>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
