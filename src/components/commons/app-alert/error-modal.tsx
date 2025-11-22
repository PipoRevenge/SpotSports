
import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import { Button, ButtonText } from '../../ui/button';
import { Heading } from '../../ui/heading';
import { HStack } from '../../ui/hstack';
import { CloseIcon, Icon } from '../../ui/icon';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '../../ui/modal';
import { Text } from '../../ui/text';
import { VStack } from '../../ui/vstack';

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const AppAlertErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title = 'Error',
  message,
  onClose,
}) => {
  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <HStack space="sm" >
            <Icon as={AlertCircle} size="xl"  />
            <Heading size="lg" >
              {title}
            </Heading>
          </HStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <VStack space="md">
            <Text size="md" >
              {message}
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            size="md"
            action="negative"
            onPress={onClose}
            
          >
            <ButtonText>Entendido</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

