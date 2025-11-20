import React from "react";

import { Keyboard, TouchableWithoutFeedback } from "react-native";

import { Text } from "@components/ui/text";
import { VStack } from "@components/ui/vstack";

interface FormContainerProps {
  children: React.ReactNode;
  title: string;
  error?: string | null;
  dismissKeyboardOnTouch?: boolean;
}

/**
 * Contenedor estándar para formularios de autenticación
 * Proporciona estilos consistentes y comportamiento de teclado
 */
export const FormContainer = ({
  children,
  title,
  error,
  dismissKeyboardOnTouch = true,
}: FormContainerProps) => {
  const content = (

    
    <VStack className="w-full p-4  rounded-md border border-background-200 self-center"
      space="md">
      <Text className="text-xl font-bold text-center pb-4">{title}</Text>

      {error ? (
        <Text className="text-red-500 text-center pb-2">{error}</Text>
      ) : null}

      {children}
    </VStack>
  );

  if (dismissKeyboardOnTouch) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
};
