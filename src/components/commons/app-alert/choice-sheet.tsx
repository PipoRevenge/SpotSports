import { Button, ButtonText } from '@/src/components/ui/button';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/src/components/ui/modal';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import React from 'react';

interface ChoiceItem {
  key: string;
  label: string;
}

interface ChoiceSheetProps {
  visible: boolean;
  title?: string;
  message?: string;
  options: ChoiceItem[];
  onSelect: (key: string) => void;
  onClose: () => void;
}

export const AppAlertChoiceSheet: React.FC<ChoiceSheetProps> = ({ visible, title, message, options, onSelect, onClose }) => {
  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        {title && (
          <ModalHeader>
            <Text className="text-lg font-semibold">{title}</Text>
          </ModalHeader>
        )}
        <ModalBody>
          <VStack className="gap-2">
            {message && <Text className="text-sm text-gray-600">{message}</Text>}
            {options.map(opt => (
              <Button key={opt.key} onPress={() => { onSelect(opt.key); }}>
                <ButtonText>{opt.label}</ButtonText>
              </Button>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button action="negative" onPress={onClose}><ButtonText>Cancelar</ButtonText></Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
