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
import { HStack } from "@/src/components/ui/hstack";
import { AlertCircleIcon, Icon } from "@/src/components/ui/icon";
import { Input, InputField } from "@/src/components/ui/input";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { Toast, ToastDescription, ToastTitle, useToast } from "@/src/components/ui/toast";
import { VStack } from "@/src/components/ui/vstack";
import {
  Button,
  ButtonText
} from "@components/ui/button";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

interface SignUpFormProps {
  onSubmit?: (email: string, password: string, nickname: string, photo?: string, fullName?: string, bio?: string) => void;
  onSignInPress?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, onSignInPress }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  // Error states
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [nicknameError, setNicknameError] = useState(false);
  const [birthDateError, setBirthDateError] = useState(false);

  const toast = useToast();
  const { pickImage } = useImagePicker();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateNickname = (nickname: string) => {
    return nickname.trim().length > 0 && !nickname.includes(" ");
  };

  const validateBirthDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    return age > 14 || (age === 14 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result.uri) {
      setPhoto(result.uri);
    }
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

    // Validate nickname
    if (!validateNickname(nickname)) {
      setNicknameError(true);
      isValid = false;
    } else {
      setNicknameError(false);
    }

    // Validate password
    if (password.length < 6) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      isValid = false;
    } else {
      setConfirmPasswordError(false);
    }

    // Validate birth date
    if (!validateBirthDate(birthDate)) {
      setBirthDateError(true);
      isValid = false;
    } else {
      setBirthDateError(false);
    }

    // If all validations pass
    if (isValid) {
      if (onSubmit) {
        onSubmit(email, password, nickname, photo || undefined, fullName, bio);
      }

      // Show success toast
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success">
              <VStack space="xs">
                <ToastTitle>¡Registro exitoso!</ToastTitle>
                <ToastDescription>Bienvenido a SpotSport</ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    }
  };

  return (
    <FormContainer title="Sign Up" dismissKeyboardOnTouch={true}>
      {/* Profile Photo Upload Section */}
      <VStack space="md" style={{ alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={handlePickImage} >
          {photo ? (
            <Avatar size="xl" className="mb-2">
              <AvatarImage source={{ uri: photo }} />
            </Avatar>
          ) : (
            <Avatar size="xl" >
              <AvatarFallbackText size={"xl"}>
                {  nickname || "Usuario"}
              </AvatarFallbackText>
            </Avatar>
          )}
        </TouchableOpacity>
        <Button
          action="primary"
          variant="solid"
          size="sm"
          onPress={handlePickImage}
        >
          <Icon as={Camera} className="color-white dark:color-black" />
          <ButtonText>Seleccionar Foto</ButtonText>
        </Button>
      </VStack>

      {/* Full Name (Optional) */}
      <FormControl size={"md"} isDisabled={false}>
        <FormControlLabel>
          <FormControlLabelText>Full Name (Optional)</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
          />
        </Input>
      </FormControl>

      {/* Nickname */}
      <FormControl isInvalid={nicknameError} size={"md"} isDisabled={false} isRequired={true}>
        <FormControlLabel>
          <FormControlLabelText>Nickname</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={nickname}
            onChangeText={setNickname}
            placeholder="username"
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>Must not contain spaces.</FormControlHelperText>
        </FormControlHelper>
        {nicknameError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>Nickname is required and cannot contain spaces.</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Bio (Optional) */}
      <FormControl size={"md"} isDisabled={false}>
        <FormControlLabel>
          <FormControlLabelText>Bio (Optional)</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={3}
          />
        </Input>
      </FormControl>

      {/* Birth Date */}
      <FormControl isInvalid={birthDateError} size={"md"} isDisabled={false} isRequired={true}>
        <FormControlLabel>
          <FormControlLabelText>Birth Date</FormControlLabelText>
        </FormControlLabel>
        <DatePickerComponent value={birthDate} onChange={setBirthDate} />
        {birthDateError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>You must be at least 14 years old.</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Email */}
      <FormControl isInvalid={emailError} size={"md"} isDisabled={false} isRequired={true}>
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
          <FormControlHelperText>Must be a valid email address.</FormControlHelperText>
        </FormControlHelper>
        {emailError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>Must be a valid email address.</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Password */}
      <FormControl isInvalid={passwordError} size={"md"} isDisabled={false} isRequired={true}>
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
          <FormControlHelperText>Must be at least 6 characters.</FormControlHelperText>
        </FormControlHelper>
        {passwordError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>At least 6 characters are required.</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Confirm Password */}
      <FormControl isInvalid={confirmPasswordError} size={"md"} isDisabled={false} isRequired={true}>
        <FormControlLabel>
          <FormControlLabelText>Confirm Password</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="confirm password"
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>Must match the password above.</FormControlHelperText>
        </FormControlHelper>
        {confirmPasswordError && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>Passwords do not match.</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Submit Button */}
      <Button
        action={"primary"}
        variant={"solid"}
        size={"lg"}
        isDisabled={false}
        onPress={handleSubmit}
      >
        <ButtonText>Sign Up</ButtonText>
      </Button>

      {/* Already have an account section */}
      <HStack space="sm"className="justify-center align-middle mt-4">
        <Text>Already have an account?</Text>
        <Pressable onPress={onSignInPress}>
          <Text className="text-primary-600 font-bold">
            Sign In
          </Text>
        </Pressable>
      </HStack>
    </FormContainer>
  );
};


export default SignUpForm;