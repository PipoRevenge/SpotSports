/**
 * LoadingScreen Component
 * 
 * Reusable fullscreen loading overlay with optional message.
 * Used for async operations like creating spots, uploading files, etc.
 * 
 * @example
 * ```tsx
 * <LoadingScreen 
 *   visible={isLoading} 
 *   message="Creando spot..." 
 *   subMessage="Subiendo imágenes 2/5"
 * />
 * ```
 */

import { Heading } from '@/src/components/ui/heading';
import { Modal, ModalBackdrop, ModalContent } from '@/src/components/ui/modal';
import { Spinner } from '@/src/components/ui/spinner';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import React from 'react';

export interface LoadingScreenProps {
  /**
   * Controls visibility of the loading screen
   */
  visible: boolean;
  
  /**
   * Main loading message
   */
  message?: string;
  
  /**
   * Secondary message (e.g., progress details)
   */
  subMessage?: string;
  
  /**
   * Size of the spinner
   * @default 'large'
   */
  spinnerSize?: 'small' | 'large';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  visible,
  message = 'Loading...',
  subMessage,
  spinnerSize = 'large',
}) => {
  return (
    <Modal isOpen={visible} onClose={() => {}} size="md">
      <ModalBackdrop className="bg-background-950/80" />
      <ModalContent className="bg-white shadow-lg">
        <VStack space="lg" className="items-center p-6">
          <Spinner size={spinnerSize} color="$primary500" />
          
          {message && (
            <Heading size="lg" className="text-gray-900 text-center">
              {message}
            </Heading>
          )}
          
          {subMessage && (
            <Text size="md" className="text-gray-600 text-center">
              {subMessage}
            </Text>
          )}
        </VStack>
      </ModalContent>
    </Modal>
  );
};
