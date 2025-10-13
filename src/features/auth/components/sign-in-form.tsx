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

import React, { useState } from "react";
import { AuthFormErrors, SignInFormData } from "../types/auth";
import { validateSignInForm } from "../utils/validations";

interface SignInFormProps {
  onSubmit?: (email: string, password: string) => void;
  onSignUpPress?: () => void;
  isLoading?: boolean;
}

const VALIDATION_MESSAGES = {
  email: "Must be a valid email address.",
  password: "At least 6 characters are required.",
} as const;



export const SignInForm: React.FC<SignInFormProps> = ({ 
  onSubmit, 
  onSignUpPress, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});


  const updateFormField = (field: keyof SignInFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };



  const handleSubmit = () => {
    const validation = validateSignInForm(formData.email, formData.password);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (onSubmit) {
      onSubmit(formData.email, formData.password);
      // Toast de éxito se manejará desde el componente padre tras confirmación
    }
  };

  return (
    <FormContainer title="Sign In" dismissKeyboardOnTouch={true}>
      <FormControl
        isInvalid={errors.email}
        size={"md"}
        isDisabled={isLoading}
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Email</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField 
            type="text" 
            value={formData.email} 
            onChangeText={(value) => updateFormField('email', value)}
            placeholder="email"
            testID="sign-in-email-input"
          />
        </Input>

        <FormControlHelper>
          <FormControlHelperText>
            {VALIDATION_MESSAGES.email}
          </FormControlHelperText>
        </FormControlHelper>

        {errors.email && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>
              {VALIDATION_MESSAGES.email}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      <FormControl
        isInvalid={errors.password}
        size={"md"}
        isDisabled={isLoading}
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Password</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField 
            type="password" 
            value={formData.password}
            onChangeText={(value) => updateFormField('password', value)}
            placeholder="password"
            testID="sign-in-password-input"
          />
        </Input>

        <FormControlHelper>
          <FormControlHelperText>
            {VALIDATION_MESSAGES.password}
          </FormControlHelperText>
        </FormControlHelper>

        {errors.password && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>
              {VALIDATION_MESSAGES.password}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      <Button
        action={"primary"}
        variant={"solid"}
        size={"lg"}
        isDisabled={isLoading}
        onPress={handleSubmit}
        testID="sign-in-submit-button"
      >
        <ButtonText>Sign In</ButtonText>
      </Button>

    </FormContainer>
  );
};

export default SignInForm;
