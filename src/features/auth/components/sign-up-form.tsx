import DatePickerComponent from "@/src/components/commons/date/date-picker-component";
import { FormContainer } from "@/src/components/commons/forms/form-container";
import { useImagePicker } from "@/src/components/commons/media-picker/image-picker";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
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
import { AlertCircleIcon, Icon } from "@/src/components/ui/icon";
import { Input, InputField } from "@/src/components/ui/input";

import { VStack } from "@/src/components/ui/vstack";
import {
  Button,
  ButtonText
} from "@components/ui/button";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { AuthFormErrors, SignUpFormData } from "../types/auth";
import { validateSignUpForm } from "../utils/validation";

interface SignUpFormProps {
  onSubmit?: (
    email: string, 
    password: string, 
    userName: string, 
    photo?: string, 
    birthDate?: Date, 
    fullName?: string, 
    bio?: string
  ) => void;
  onSignInPress?: () => void;
  isLoading?: boolean;
}

const VALIDATION_MESSAGES = {
  email: "Must be a valid email address.",
  password: "At least 6 characters are required.",
  confirmPassword: "Passwords do not match.",
  username: "Nickname is required and cannot contain spaces.",
  birthDate: "You must be at least 14 years old.",
} as const;

const AVATAR_CONFIG = {
  size: "xl" as const,
  fallbackPrefix: "Usuario",
} as const;

export const SignUpForm: React.FC<SignUpFormProps> = ({ 
  onSubmit, 
  onSignInPress, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    photo: undefined,
    birthDate: undefined,
    fullName: "",
    bio: "",
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});

  const { pickImage } = useImagePicker();

  const updateFormField = <K extends keyof SignUpFormData>(
    field: K, 
    value: SignUpFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof AuthFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result.uri) {
      updateFormField('photo', result.uri);
    }
  };

  const handleSubmit = () => {
    const validation = validateSignUpForm(
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.username,
      formData.birthDate ?? null
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (onSubmit && formData.birthDate) {
      onSubmit(
        formData.email,
        formData.password,
        formData.username,
        formData.photo || undefined,
        formData.birthDate,
        formData.fullName,
        formData.bio
      );
    }
  };

  return (
    <FormContainer title="Sign Up" dismissKeyboardOnTouch={true}>
      {/* Profile Photo Upload Section */}
      <VStack space="md" style={{ alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={handlePickImage} testID="profile-photo-selector">
          {formData.photo ? (
            <Avatar size={AVATAR_CONFIG.size} className="mb-2">
              <AvatarImage source={{ uri: formData.photo }} />
            </Avatar>
          ) : (
            <Avatar size={AVATAR_CONFIG.size}>
              <AvatarFallbackText size={AVATAR_CONFIG.size}>
                {formData.username || AVATAR_CONFIG.fallbackPrefix}
              </AvatarFallbackText>
            </Avatar>
          )}
        </TouchableOpacity>
        <Button
          action="primary"
          variant="solid"
          size="sm"
          onPress={handlePickImage}
          isDisabled={isLoading}
          testID="select-photo-button"
        >
          <Icon as={Camera} className="color-white dark:color-black" />
          <ButtonText>Seleccionar Foto</ButtonText>
        </Button>
      </VStack>

      {/* Full Name (Optional) */}
      <FormControl size={"md"} isDisabled={isLoading}>
        <FormControlLabel>
          <FormControlLabelText>Full Name (Optional)</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={formData.fullName}
            onChangeText={(value) => updateFormField('fullName', value)}
            placeholder="John Doe"
            testID="sign-up-fullname-input"
          />
        </Input>
      </FormControl>

      {/* Nickname */}
      <FormControl 
        isInvalid={errors.username} 
        size={"md"} 
        isDisabled={isLoading} 
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Nickname</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={formData.username}
            onChangeText={(value) => updateFormField('username', value)}
            placeholder="userName"
            testID="sign-up-username-input"
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>Must not contain spaces.</FormControlHelperText>
        </FormControlHelper>
        {errors.username && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{VALIDATION_MESSAGES.username}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Bio (Optional) */}
      <FormControl size={"md"} isDisabled={isLoading}>
        <FormControlLabel>
          <FormControlLabelText>Bio (Optional)</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={formData.bio}
            onChangeText={(value) => updateFormField('bio', value)}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={3}
            testID="sign-up-bio-input"
          />
        </Input>
      </FormControl>

      {/* Birth Date */}
      <FormControl 
        isInvalid={errors.birthDate} 
        size={"md"} 
        isDisabled={isLoading} 
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Birth Date</FormControlLabelText>
        </FormControlLabel>
        <DatePickerComponent 
          value={formData.birthDate ?? null} 
          onChange={(date) => updateFormField('birthDate', date ?? undefined)}
        />
        {errors.birthDate && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{VALIDATION_MESSAGES.birthDate}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Email */}
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
            testID="sign-up-email-input"
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>{VALIDATION_MESSAGES.email}</FormControlHelperText>
        </FormControlHelper>
        {errors.email && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{VALIDATION_MESSAGES.email}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Password */}
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
            testID="sign-up-password-input"
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>{VALIDATION_MESSAGES.password}</FormControlHelperText>
        </FormControlHelper>
        {errors.password && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{VALIDATION_MESSAGES.password}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Confirm Password */}
      <FormControl 
        isInvalid={errors.confirmPassword} 
        size={"md"} 
        isDisabled={isLoading} 
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Confirm Password</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormField('confirmPassword', value)}
            placeholder="confirm password"
            testID="sign-up-confirm-password-input"
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>Must match the password above.</FormControlHelperText>
        </FormControlHelper>
        {errors.confirmPassword && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{VALIDATION_MESSAGES.confirmPassword}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Submit Button */}
      <Button
        action={"primary"}
        variant={"solid"}
        size={"lg"}
        isDisabled={isLoading}
        onPress={handleSubmit}
        testID="sign-up-submit-button"
      >
        <ButtonText>Sign Up</ButtonText>
      </Button>
    </FormContainer>
  );
};