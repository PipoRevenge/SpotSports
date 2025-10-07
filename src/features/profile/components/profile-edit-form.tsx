import DatePickerComponent from "@/src/components/commons/date/date-picker-component";
import { FormContainer } from "@/src/components/commons/forms/form-container";
import { useImagePicker } from "@/src/components/commons/media-picker/image-picker";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/src/components/ui/form-control";
import { Input, InputField } from "@/src/components/ui/input";
import { VStack } from "@/src/components/ui/vstack";
import { UserDetails } from "@/src/types/user";
import {
  Button,
  ButtonText
} from "@components/ui/button";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import {
  formatFullName,
  validateBio,
  validateBirthDate,
  validateFullName,
  validatePhoneNumber
} from "../utils/profile-validation";

interface ProfileEditFormProps {
  user: UserDetails;
  onSubmit?: (userData: Partial<UserDetails>) => Promise<void>;
  onCancel?: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  user, 
  onSubmit, 
  onCancel
}) => {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [photo, setPhoto] = useState<string | null>(user.photoURL || null);
  const [birthDate, setBirthDate] = useState<Date | null>(
    user.birthDate ? new Date(user.birthDate) : null
  );
  const [bio, setBio] = useState(user.bio || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  
  // Estados para validaciones locales
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { pickImage } = useImagePicker();

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result.uri) {
      setPhoto(result.uri);
    }
  };

  const validateField = (field: string, value: any) => {
    let validation;
    
    switch (field) {
      case 'fullName':
        validation = validateFullName(value);
        break;
      case 'bio':
        validation = validateBio(value);
        break;
      case 'phoneNumber':
        validation = validatePhoneNumber(value);
        break;
      case 'birthDate':
        validation = validateBirthDate(value?.toISOString());
        break;
      default:
        return;
    }

    if (!validation.isValid && validation.error) {
      setFieldErrors(prev => ({ ...prev, [field]: validation.error! }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    validateField('fullName', value);
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    validateField('bio', value);
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    validateField('phoneNumber', value);
  };

  const handleBirthDateChange = (value: Date | null) => {
    setBirthDate(value);
    if (value) {
      validateField('birthDate', value);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    setIsValidating(true);
    
    // Validar todos los campos
    const fullNameValidation = validateFullName(fullName);
    const bioValidation = validateBio(bio);
    const phoneValidation = validatePhoneNumber(phoneNumber);
    const birthDateValidation = validateBirthDate(birthDate?.toISOString());

    const errors: Record<string, string> = {};
    
    if (!fullNameValidation.isValid && fullNameValidation.error) {
      errors.fullName = fullNameValidation.error;
    }
    if (!bioValidation.isValid && bioValidation.error) {
      errors.bio = bioValidation.error;
    }
    if (!phoneValidation.isValid && phoneValidation.error) {
      errors.phoneNumber = phoneValidation.error;
    }
    if (!birthDateValidation.isValid && birthDateValidation.error) {
      errors.birthDate = birthDateValidation.error;
    }

    setFieldErrors(errors);
    setIsValidating(false);

    // Si hay errores, no continuar
    if (Object.keys(errors).length > 0) {
      Alert.alert(
        'Errores en el formulario',
        'Por favor corrige los errores antes de continuar',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        fullName: formatFullName(fullName),
        photoURL: photo || undefined,
        birthDate: birthDate?.toISOString(),
        bio: bio.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });
    } catch {
      // El error se maneja en el componente padre
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer title="Edit Profile" dismissKeyboardOnTouch={true}>
      {/* Profile Photo Upload Section */}
      <VStack space="md" style={{ alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={handlePickImage}>
          {photo ? (
            <Avatar size="xl" className="mb-2">
              <AvatarImage source={{ uri: photo }} />
            </Avatar>
          ) : (
            <Avatar size="xl">
              <AvatarFallbackText size={"xl"}>
                {user.userName || "Usuario"}
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
          <Camera className="w-4 h-4 text-white dark:text-black" />
          <ButtonText>Change Photo</ButtonText>
        </Button>
      </VStack>



      {/* Full Name */}
      <FormControl size={"md"} isInvalid={!!fieldErrors.fullName}>
        <FormControlLabel>
          <FormControlLabelText>Nombre Completo</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={fullName}
            onChangeText={handleFullNameChange}
            placeholder="Juan Pérez"
            editable={!isLoading}
          />
        </Input>
        {fieldErrors.fullName && (
          <FormControlError>
            <FormControlErrorText>{fieldErrors.fullName}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Bio */}
      <FormControl size={"md"} isInvalid={!!fieldErrors.bio}>
        <FormControlLabel>
          <FormControlLabelText>Biografía</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={bio}
            onChangeText={handleBioChange}
            placeholder="Cuéntanos sobre ti..."
            multiline
            numberOfLines={3}
            editable={!isLoading}
          />
        </Input>
        {fieldErrors.bio && (
          <FormControlError>
            <FormControlErrorText>{fieldErrors.bio}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Birth Date */}
      <FormControl size={"md"} isInvalid={!!fieldErrors.birthDate}>
        <FormControlLabel>
          <FormControlLabelText>Fecha de Nacimiento</FormControlLabelText>
        </FormControlLabel>
        <DatePickerComponent 
          value={birthDate} 
          onChange={handleBirthDateChange}
          disabled={isLoading}
        />
        {fieldErrors.birthDate && (
          <FormControlError>
            <FormControlErrorText>{fieldErrors.birthDate}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Phone Number */}
      <FormControl size={"md"} isInvalid={!!fieldErrors.phoneNumber}>
        <FormControlLabel>
          <FormControlLabelText>Número de Teléfono</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder="+1 234 567 890"
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </Input>
        {fieldErrors.phoneNumber && (
          <FormControlError>
            <FormControlErrorText>{fieldErrors.phoneNumber}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Action Buttons */}
      <VStack space="md" className="mt-6">
        <Button
          action="primary"
          variant="solid"
          size="lg"
          onPress={handleSubmit}
          disabled={isLoading || isValidating}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <ButtonText>Guardando...</ButtonText>
            </>
          ) : (
            <ButtonText>Guardar Cambios</ButtonText>
          )}
        </Button>

        <Button
          action="secondary"
          variant="outline"
          size="lg"
          onPress={onCancel}
          disabled={isLoading}
        >
          <ButtonText>Cancelar</ButtonText>
        </Button>
      </VStack>
    </FormContainer>
  );
};

export default ProfileEditForm;