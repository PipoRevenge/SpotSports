import { FormContainer } from '@/src/components/commons/forms/form-container';
import { useImagePicker } from '@/src/components/commons/media-picker/image-picker';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Button, ButtonText } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Icon } from '@/src/components/ui/icon';
import { Input, InputField } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { Textarea, TextareaInput } from '@/src/components/ui/textarea';
import { View } from '@/src/components/ui/view';
import { VStack } from '@/src/components/ui/vstack';
import { useUser } from '@/src/entities/user/context/user-context';
import { Camera } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { useUpdateProfile } from '../hooks/use-update-profile';
import { ProfileEditProps, ProfileUpdateData } from '../types/profile-types';
import { formatFullName, validateProfileData } from '../utils/profile-validation';

export const ProfileEditForm: React.FC<ProfileEditProps> = ({
  onSave,
  onCancel
}) => {
  const { user } = useUser();
  const { updateProfile, isUpdating, error, clearError } = useUpdateProfile();
  const { pickImage } = useImagePicker();

  // Estados del formulario
  const [formData, setFormData] = useState<ProfileUpdateData>({
    fullName: '',
    bio: '',
    phoneNumber: '',
    photoURL: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Inicializar el formulario con los datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.userDetails.fullName || '',
        bio: user.userDetails.bio || '',
        phoneNumber: user.userDetails.phoneNumber || '',
        photoURL: user.userDetails.photoURL || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error específico del campo
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Limpiar error general cuando el usuario empieza a escribir
    if (error) {
      clearError();
    }
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result.uri) {
      handleInputChange('photoURL', result.uri);
    }
  };

  const handleSave = async () => {
    // Crear datos editables (sin fecha de nacimiento)
    const editableData = {
      fullName: formData.fullName,
      bio: formData.bio,
      phoneNumber: formData.phoneNumber,
      photoURL: formData.photoURL
    };

    // Validar datos antes de enviar
    const validation = validateProfileData(editableData);
    if (!validation.isValid) {
      if (validation.fieldErrors) {
        setFormErrors(validation.fieldErrors);
        return;
      }
      Alert.alert('Error', validation.error || 'Datos inválidos');
      return;
    }

    // Formatear el nombre antes de guardar
    const dataToSend = {
      ...editableData,
      fullName: editableData.fullName ? formatFullName(editableData.fullName) : undefined
    };

    const success = await updateProfile(dataToSend);
    if (success) {
      Alert.alert(
        'Perfil actualizado',
        'Los cambios se han guardado correctamente',
        [{ text: 'OK', onPress: onSave }]
      );
    }
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No se pudo cargar la información del usuario</Text>
      </View>
    );
  }

  return (
    <FormContainer title={'Editar perfil'}>
      <VStack className="p-4" space="lg">
        {/* Header con foto de perfil */}
        <View className="items-center">
          <TouchableOpacity onPress={handlePickImage} testID="profile-photo-selector">
            <Avatar size="xl" className="pb-2">
              {formData.photoURL ? (
                <AvatarImage source={{ uri: formData.photoURL }} />
              ) : (
                <AvatarFallbackText>
                  {user.userDetails.fullName || user.userDetails.userName || "Usuario"}
                </AvatarFallbackText>
              )}
            </Avatar>
          </TouchableOpacity>
          <Button 
            action="primary" 
            variant="solid" 
            size="sm" 
            onPress={handlePickImage} 
            isDisabled={isUpdating} 
            testID="select-photo-button"
          >
            <Icon as={Camera} className="color-white dark:color-black" />
            <ButtonText>Cambiar Foto</ButtonText>
          </Button>
        </View>

        {/* Formulario */}
        <VStack space="md">
          {/* Nombre completo */}
          <View>
            <Text className="font-medium pb-2">Nombre completo *</Text>
            <Input>
              <InputField
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                placeholder="Ingresa tu nombre completo"
              />
            </Input>
            {formErrors.fullName && (
              <Text className="text-red-500 text-sm pt-1">{formErrors.fullName}</Text>
            )}
          </View>

          {/* Biografía */}
          <View>
            <Text className="font-medium pb-2">Biografía</Text>
            <Textarea size="lg" className="min-h-24">
              <TextareaInput
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Cuéntanos sobre ti..."
                multiline
                numberOfLines={5}
                style={{ textAlignVertical: 'top' }}
              />
            </Textarea>
            <Text className="text-gray-500 text-sm pt-1">
              {formData.bio?.length || 0}/500 caracteres
            </Text>
            {formErrors.bio && (
              <Text className="text-red-500 text-sm pt-1">{formErrors.bio}</Text>
            )}
          </View>

          {/* Teléfono */}
          <View>
            <Text className="font-medium pb-2">Teléfono</Text>
            <Input>
              <InputField
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                placeholder="Número de teléfono"
                keyboardType="phone-pad"
              />
            </Input>
            {formErrors.phoneNumber && (
              <Text className="text-red-500 text-sm pt-1">{formErrors.phoneNumber}</Text>
            )}
          </View>

        </VStack>

        {/* Error general */}
        {error && (
          <View className="bg-red-50 p-3 rounded-md">
            <Text className="text-red-700 text-center">{error}</Text>
          </View>
        )}

        {/* Botones de acción */}
        <HStack className="pt-6" space="md">
          <Button 
            variant="outline" 
            className="flex-1"
            onPress={onCancel}
            disabled={isUpdating}
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button 
            className="flex-1"
            onPress={handleSave}
            disabled={isUpdating}
          >
            <ButtonText>
              {isUpdating ? 'Guardando...' : 'Guardar cambios'}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </FormContainer>
  );
};