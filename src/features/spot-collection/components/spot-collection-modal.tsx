import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SpotCategory } from "@/src/entities/user/model/spot-collection";
import { Check } from "lucide-react-native";
import React from "react";
import { ActionSheetIOS, Alert, Modal, Platform, TouchableOpacity, View } from "react-native";
import { SPOT_CATEGORIES } from "../constants/categories";

interface SpotCollectionModalProps {
  visible: boolean;
  categories: SpotCategory[];
  isLoading: boolean;
  onToggleCategory: (category: SpotCategory) => Promise<boolean>;
  onClose: () => void;
}

/**
 * Modal para seleccionar categorías de spots
 * En iOS muestra ActionSheet nativo, en Android un modal personalizado
 */
export const SpotCollectionModal: React.FC<SpotCollectionModalProps> = ({
  visible,
  categories,
  isLoading,
  onToggleCategory,
  onClose,
}) => {
  const handleToggle = async (category: SpotCategory) => {
    const success = await onToggleCategory(category);
    
    if (success) {
      const isInCategory = categories.includes(category);
      const categoryLabel = SPOT_CATEGORIES.find(c => c.type === category)?.label;
      
      Alert.alert(
        isInCategory ? "Añadido" : "Eliminado",
        `Spot ${isInCategory ? "añadido a" : "eliminado de"} ${categoryLabel}`
      );
    }
  };

  // Modal para Android
  if (Platform.OS !== 'ios') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <VStack className="bg-white rounded-t-3xl p-6">
              <Text className="text-xl font-bold pb-2">Guardar en colección</Text>
              <Text className="text-gray-600 pb-6">
                Selecciona donde quieres guardar este spot
              </Text>

              <VStack className="gap-3">
                {SPOT_CATEGORIES.map((category) => {
                  const isInCategory = categories.includes(category.type);
                  
                  return (
                    <Pressable
                      key={category.type}
                      onPress={() => handleToggle(category.type)}
                      disabled={isLoading}
                      className={`flex-row items-center justify-between p-4 rounded-lg border ${
                        isInCategory
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        <Icon
                          as={category.icon}
                          size={24}
                          color={isInCategory ? category.color : "#9ca3af"}
                        />
                        <Text
                          className={`text-base font-medium ${
                            isInCategory ? "text-blue-900" : "text-gray-700"
                          }`}
                        >
                          {category.label}
                        </Text>
                      </View>
                      
                      {isInCategory && (
                        <Icon as={Check} size={20} color={category.color} />
                      )}
                    </Pressable>
                  );
                })}
              </VStack>

              <Pressable
                onPress={onClose}
                className="pt-6 p-4 bg-gray-100 rounded-lg items-center"
              >
                <Text className="text-gray-700 font-medium">Cancelar</Text>
              </Pressable>
            </VStack>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  return null;
};

/**
 * Mostrar ActionSheet en iOS
 */
export const showSpotCollectionActionSheet = (
  categories: SpotCategory[],
  onToggleCategory: (category: SpotCategory) => Promise<boolean>
) => {
  if (Platform.OS !== 'ios') return;

  const options = [
    ...SPOT_CATEGORIES.map(ct => {
      const isInCategory = categories.includes(ct.type);
      return `${ct.label}${isInCategory ? " ✓" : ""}`;
    }),
    "Cancelar"
  ];

  ActionSheetIOS.showActionSheetWithOptions(
    {
      options,
      cancelButtonIndex: options.length - 1,
      title: "Guardar en colección",
      message: "Selecciona donde quieres guardar este spot",
    },
    async (buttonIndex) => {
      if (buttonIndex < SPOT_CATEGORIES.length) {
        const category = SPOT_CATEGORIES[buttonIndex].type;
        const success = await onToggleCategory(category);
        
        if (success) {
          const isInCategory = categories.includes(category);
          const categoryLabel = SPOT_CATEGORIES[buttonIndex].label;
          
          Alert.alert(
            isInCategory ? "Añadido" : "Eliminado",
            `Spot ${isInCategory ? "añadido a" : "eliminado de"} ${categoryLabel}`
          );
        }
      }
    }
  );
};
