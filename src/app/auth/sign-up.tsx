import { Button, ButtonText } from '@/src/components/ui/button';
import { ScrollView } from '@/src/components/ui/scroll-view';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { SignUpForm } from '@/src/features/auth/components/sign-up-form';
import { useSignUp } from '@/src/features/auth/hooks/use-sign-up';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView } from 'react-native';

export default function SignUp() {
  const router = useRouter();
  const { signUp, isLoading, error } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    email: string, 
    password: string, 
    userName: string, 
    photo?: string,
    birthDate?: Date, 
    fullName?: string, 
    bio?: string
  ) => {
    try {
      setIsSubmitting(true);
      await signUp(email, password, userName, photo, birthDate, fullName, bio);
      
      // Navigation will be handled by UserContext after successful registration
    } catch (signUpError) {
      console.error('Error during sign up:', signUpError);
      Alert.alert(
        'Error de Registro',
        error || 'Ocurrió un error durante el registro. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" enabled>
    <ScrollView>
      <VStack className='flex-1 p-4 gap-2'>
        <SignUpForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading || isSubmitting}
        />
        <VStack className='align-middle items-center gap-2 '>
          <Text>Already have an account?</Text>
          <Button
            variant={"outline"}
            onPress={() => router.push('/auth/sign-in')}
          >
            <ButtonText
            variant={"link"}
            >Sign In</ButtonText>
          </Button>

          <Button
            variant={"outline"}
            onPress={() => router.back()}
          >
            <ButtonText
            variant={"link"}
            >Go Back</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
    </KeyboardAvoidingView>   
  );
}
