import { Toast, ToastDescription, ToastTitle, useToast } from "@/src/components/ui/toast";
import * as ExpoImagePicker from "expo-image-picker";

import { VStack } from "@/src/components/ui/vstack";

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
}

export interface ImagePickerResult {
  uri: string | null;
  width?: number;
  height?: number;
  cancelled?: boolean;
  canceled?: boolean;
  type?: 'image' | 'video';
}

export const useImagePicker = () => {
  const toast = useToast();

  const showErrorToast = (message: string) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        return (
          <Toast nativeID={`toast-${id}`} action="error">
            <VStack space="xs">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>{message}</ToastDescription>
            </VStack>
          </Toast>
        );
      },
    });
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const permissionResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showErrorToast("Permission to access gallery was denied");
        return false;
      }
      return true;
    } catch {
      showErrorToast("Failed to request permissions");
      return false;
    }
  };

  const pickImage = async (options?: ImagePickerOptions): Promise<ImagePickerResult> => {
    // Request permissions first
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return { uri: null, cancelled: true, canceled: true };
    }

    try {
      const defaultOptions: ImagePickerOptions  = {
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      };

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        ...defaultOptions,
        ...options,
      });

      if (result.canceled || result.assets.length === 0) {
        return { uri: null, canceled: true };
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        canceled: false,
      };
    } catch {
      showErrorToast("Failed to pick image");
      return { uri: null, canceled: true };
    }
  };

  const pickMultiple = async (options?: ImagePickerOptions): Promise<ImagePickerResult[]> => {
    // Request permissions first
    const hasPermission = await requestPermissions();
    if (!hasPermission) return [];
    try {
      const defaultOptions: ImagePickerOptions & { allowsMultipleSelection: boolean } = {
        allowsEditing: false,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
        allowsMultipleSelection: true,
      };

      const merged = { ...defaultOptions, ...options };
      const resolvedOptions = merged.allowsMultipleSelection ? { ...merged, allowsEditing: false } : merged;

      const result = await ExpoImagePicker.launchImageLibraryAsync(resolvedOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) return [];

      return result.assets.map(asset => ({ uri: asset.uri ?? null, width: asset.width, height: asset.height, canceled: false, type: asset.type as ('image'|'video') }));
    } catch {
      showErrorToast('Failed to pick images');
      return [];
    }
  };

  const takePhoto = async (options?: ImagePickerOptions): Promise<ImagePickerResult> => {
    try {
      const cameraPermission = await ExpoImagePicker.requestCameraPermissionsAsync();
      
      if (!cameraPermission.granted) {
        showErrorToast("Permission to access camera was denied");
        return { uri: null, canceled: true };
      }

      const defaultOptions: ImagePickerOptions & { mediaTypes: ExpoImagePicker.MediaType[] } = {
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      };

      const result = await ExpoImagePicker.launchCameraAsync({
        ...defaultOptions,
        ...options,
      });

      if (result.canceled || result.assets.length === 0) {
        return { uri: null, canceled: true };
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        canceled: false,
      };
    } catch {
      showErrorToast("Failed to take photo");
      return { uri: null, canceled: true };
    }
  };

  return {
    pickImage,
    pickMultiple,
    takePhoto,
    requestPermissions,
  };
};