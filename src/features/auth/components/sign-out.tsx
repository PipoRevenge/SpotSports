import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/src/components/ui/alert-dialog';
import { Button, ButtonText } from '@/src/components/ui/button';
import { Heading } from '@/src/components/ui/heading';
import { HStack } from '@/src/components/ui/hstack';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { LogOut, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useSignOut } from '../hooks/use-sign-out';

interface SignOutProps {
  triggerText?: string;
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  isOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
  onSignOutComplete?: () => void;
}

export const SignOut: React.FC<SignOutProps> = ({ 
  triggerText = "Cerrar Sesión",
  variant = "outline",
  size = "md",
  isOpen: isOpenProp,
  onClose: onCloseProp,
  showTrigger = true
}) => {
  const [internalShowDialog, setInternalShowDialog] = useState(false);
  const { signOut, isSigningOut } = useSignOut();
  
  // Si se pasa isOpen como prop, usar ese valor, sino usar el estado interno
  const showAlertDialog = isOpenProp !== undefined ? isOpenProp : internalShowDialog;

  const handleSignOut = async () => {
    await signOut();
    if (onCloseProp) {
      onCloseProp();
    } else {
      setInternalShowDialog(false);
    }
    if (onSignOutComplete) {
      onSignOutComplete();
    }
  };

  const handleCancel = () => {
    if (onCloseProp) {
      onCloseProp();
    } else {
      setInternalShowDialog(false);
    }
  };

  return (
    <>
      {showTrigger && (
        <Button
          variant={variant}
          size={size}
          onPress={() => {
            if (onCloseProp) {
              // Si se está usando como componente controlado, no hacer nada aquí
              return;
            }
            setInternalShowDialog(true);
          }}
        >
          <HStack space="sm" className="items-center">
            <Icon as={LogOut} size="sm" />
            <ButtonText>{triggerText}</ButtonText>
          </HStack>
        </Button>
      )}
      
      <AlertDialog
        isOpen={showAlertDialog}
        onClose={handleCancel}
        size="md"
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <VStack space="sm">
              <HStack className="justify-between items-center">
                <Heading size="md">Confirmar Cierre de Sesión</Heading>
                <AlertDialogCloseButton>
                  <Icon as={X} size="md" />
                </AlertDialogCloseButton>
              </HStack>
            </VStack>
          </AlertDialogHeader>
          
          <AlertDialogBody>
            <VStack space="md">
              <Text size="sm" className="text-typography-600">
                ¿Estás seguro que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
              </Text>
            </VStack>
          </AlertDialogBody>
          
          <AlertDialogFooter>
            <HStack space="sm" className="w-full">
              <Button
                variant="outline"
                size="sm"
                onPress={handleCancel}
                className="flex-1"
                disabled={isSigningOut}
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
              
              <Button
                variant="solid"
                size="sm"
                onPress={handleSignOut}
                className="flex-1 bg-error-500"
                disabled={isSigningOut}
              >
                <HStack space="xs" className="items-center">
                  <Icon as={LogOut} size="xs" className="text-white" />
                  <ButtonText className="text-white">
                    {isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}
                  </ButtonText>
                </HStack>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
