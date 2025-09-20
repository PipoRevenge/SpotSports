import DatePickerComponent from "@/src/components/commons/date/date-picker-component";
import { FormContainer } from "@/src/components/commons/forms/form-container";
import { useImagePicker } from "@/src/components/commons/media-picker/image-picker";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/src/components/ui/avatar";
import {
    FormControl,
    FormControlLabel,
    FormControlLabelText,
} from "@/src/components/ui/form-control";
import { Input, InputField } from "@/src/components/ui/input";
import { VStack } from "@/src/components/ui/vstack";
import { User } from "@/src/types/user";
import {
    Button,
    ButtonText
} from "@components/ui/button";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

interface ProfileEditFormProps {
  user: User;
  onSubmit?: (userData: Partial<User>) => void;
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

  const { pickImage } = useImagePicker();

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result.uri) {
      setPhoto(result.uri);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        fullName,
        photoURL: photo || undefined,
        birthDate: birthDate?.toISOString(),
        bio,
        phoneNumber,
      });
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
                {user.username || "Usuario"}
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
      <FormControl size={"md"}>
        <FormControlLabel>
          <FormControlLabelText>Full Name</FormControlLabelText>
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

      {/* Bio */}
      <FormControl size={"md"}>
        <FormControlLabel>
          <FormControlLabelText>Bio</FormControlLabelText>
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
      <FormControl size={"md"}>
        <FormControlLabel>
          <FormControlLabelText>Birth Date</FormControlLabelText>
        </FormControlLabel>
        <DatePickerComponent value={birthDate} onChange={setBirthDate} />
      </FormControl>

      {/* Phone Number */}
      <FormControl size={"md"}>
        <FormControlLabel>
          <FormControlLabelText>Phone Number</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            type="text"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1 234 567 890"
          />
        </Input>
      </FormControl>

      {/* Action Buttons */}
      <VStack space="md" className="mt-6">
        <Button
          action="primary"
          variant="solid"
          size="lg"
          onPress={handleSubmit}
        >
          <ButtonText>Save Changes</ButtonText>
        </Button>

        <Button
          action="secondary"
          variant="outline"
          size="lg"
          onPress={onCancel}
        >
          <ButtonText>Cancel</ButtonText>
        </Button>
      </VStack>
    </FormContainer>
  );
};

export default ProfileEditForm;