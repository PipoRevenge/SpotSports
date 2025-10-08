import { Button, ButtonText } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useNotification } from '@/src/context/notification-context';
import { AuthSelector } from '@/src/features/auth/components/auth-selector';
import { useRouter } from 'expo-router';
import React from 'react';

export default function Authentication() {
  const router = useRouter();
  const { showError } = useNotification();

  const handleSelectSignIn = () => {
    router.push('/auth/sign-in');
  };

  const handleSelectSignUp = () => {
    router.push('/auth/sign-up');
  };

  const testError = () => {
    showError(
      'Esta es una prueba del modal de error. El sistema funciona correctamente.',
      'Error de prueba'
    );
  };

  return (
    <VStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <VStack style={{ gap: 24, alignItems: 'center' }}>
        <Text size="2xl" className="font-bold text-center">
          Welcome to SpotSport
        </Text>

        <AuthSelector 
          onSelectSignIn={handleSelectSignIn}
          onSelectSignUp={handleSelectSignUp}
        />

        <Button onPress={testError} action="negative" size="sm">
          <ButtonText>Probar Error Modal</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
