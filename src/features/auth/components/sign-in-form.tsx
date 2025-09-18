import {
  Button,
  ButtonText
} from "@components/ui/button";

import { FormContainer } from "@/src/components/commons/forms/form-container";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/src/components/ui/form-control";
import { AlertCircleIcon } from "@/src/components/ui/icon";
import { Input, InputField } from "@/src/components/ui/input";
import { Toast, ToastDescription, ToastTitle, useToast } from "@/src/components/ui/toast";
import { VStack } from "@/src/components/ui/vstack";
import React, { useState } from "react";

interface SignInFormProps {
  onSubmit?: (email: string, password: string) => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const toast = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    // Reset error states
    let isValid = true;
    
    // Validate email
    if (!validateEmail(email)) {
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }
    
    // Validate password
    if (password.length < 6) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }
    
    // If all validations pass
    if (isValid) {
      if (onSubmit) {
        onSubmit(email, password);
      }
      
      // Show success toast
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success">
              <VStack space="xs">
                <ToastTitle>¡Éxito!</ToastTitle>
                <ToastDescription>Hola, has iniciado sesión correctamente</ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    }
  };

  return (
    <FormContainer title="Sign In" dismissKeyboardOnTouch={true}>
      <FormControl
        isInvalid={emailError}
        size={"md"}
        isDisabled={false}
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Email</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField 
            type="text" 
            value={email} 
            onChangeText={setEmail}
            placeholder="email" 
          />
        </Input>

        <FormControlHelper>
          <FormControlHelperText>
            Must be a valid email address.
          </FormControlHelperText>
        </FormControlHelper>

        {emailError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>
              Must be a valid email address.
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      <FormControl
        isInvalid={passwordError}
        size={"md"}
        isDisabled={false}
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Password</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField 
            type="password" 
            value={password}
            onChangeText={setPassword}
            placeholder="password" 
          />
        </Input>

        <FormControlHelper>
          <FormControlHelperText>
            Must be at least 6 characters.
          </FormControlHelperText>
        </FormControlHelper>

        {passwordError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>
              At least 6 characters are required.
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      <Button
        action={"primary"}
        variant={"solid"}
        size={"lg"}
        isDisabled={false}
        onPress={handleSubmit}
      >
        <ButtonText>Sign In</ButtonText>
      </Button>
    </FormContainer>
  );
};

export default SignInForm;
