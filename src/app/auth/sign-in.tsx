import { Button, ButtonText } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { SignInForm } from '@/src/features/auth/components/sign-in-form';
import { useSignIn } from '@/src/features/auth/hooks/use-sign-in';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';

export default function SignIn() {
  const router = useRouter();
  const { signIn, isLoading, error } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignInSubmit = async (email: string, password: string) => {
    try {
      setIsSubmitting(true);
      const result = await signIn(email, password);
      
      if (!result.success) {
        Alert.alert(
          'Error de Inicio de Sesión',
          result.error || 'Email o contraseña incorrectos. Por favor, verifica tus credenciales.',
          [{ text: 'OK' }]
        );
      }
      // Si es success, el contexto maneja la navegación automáticamente
    } catch (signInError) {
      console.error('Sign in error:', signInError);
      Alert.alert(
        'Error',
        error || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpPress = () => {
    router.push('/auth/sign-up');
  };

  return (
    <VStack style={{ flex: 1, padding: 16 }}>
      <SignInForm 
        onSubmit={onSignInSubmit}
        onSignUpPress={handleSignUpPress}
        isLoading={isLoading || isSubmitting}
      />

      <VStack className='align-middle items-center gap-6 p-4'>
        <Text>Don&apos;t have an account?</Text>
        <Button
          variant={"outline"}
          onPress={handleSignUpPress}
        >
          <ButtonText
          variant={"link"}>Create Account</ButtonText>
        </Button>

        <Button 
          onPress={() => router.back()}
          variant={"outline"}
        >
          <ButtonText variant={"link"}>Go Back</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
