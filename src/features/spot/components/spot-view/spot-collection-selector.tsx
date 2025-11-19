import { userRepository } from "@/src/api/repositories";
import { Icon } from "@/src/components/ui/icon";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/entities/user/context/user-context";
import { SpotCategory } from "@/src/entities/user/model/spot-collection";
import { useSelectedSpot } from "@/src/features/spot";
import { Bookmark, Check, CheckCircle, Heart, Target } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Modal, Platform, TouchableOpacity, View } from "react-native";

interface SpotCollectionSelectorProps {
  spotId: string;
}

/**
 * Categorías disponibles con sus etiquetas
 */
const CATEGORIES: { type: SpotCategory; label: string; icon: any; color: string }[] = [
  { type: "Favorites", label: "Favoritos", icon: Heart, color: "#ff6b6b" },
  { type: "Visited", label: "Visitados", icon: CheckCircle, color: "#4ecdc4" },
  { type: "WantToVisit", label: "Quiero Visitar", icon: Target, color: "#45b7d1" },
];

/**
 * Componente que permite añadir/quitar un spot de diferentes categorías
 * Usa un ActionSheet en iOS y un Modal personalizado en Android
 */
export const SpotCollectionSelector: React.FC<SpotCollectionSelectorProps> = ({ spotId }) => {
  const { user } = useUser();
  const { refreshSpotCounters } = useSelectedSpot();
  const [categories, setCategories] = useState<SpotCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Cargar categorías actuales del spot
   */
  useEffect(() => {
    const loadCategories = async () => {
      if (!user?.id) return;

      try {
        const spotCategories = await userRepository.getSpotCategories(user.id, spotId);
        setCategories(spotCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, [user?.id, spotId]);

  /**
   * Toggle una categoría (añadir o quitar)
   */
  const toggleCategory = async (category: SpotCategory) => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      const isInCategory = categories.includes(category);
      
      if (isInCategory) {
        // Quitar de la categoría
        await userRepository.removeSpotFromCategories(user.id, spotId, [category]);
        setCategories(prev => prev.filter(c => c !== category));
        
        Alert.alert("Eliminado", `Spot eliminado de ${CATEGORIES.find(c => c.type === category)?.label}`);
      } else {
        // Añadir a la categoría
        await userRepository.addSpotToCategories(user.id, spotId, [category]);
        setCategories(prev => [...prev, category]);
        
        Alert.alert("Añadido", `Spot añadido a ${CATEGORIES.find(c => c.type === category)?.label}`);
      }
      
      // Refresh spot counters only
      await refreshSpotCounters();
    } catch (error) {
      console.error("Error toggling category:", error);
      Alert.alert("Error", "No se pudo actualizar la categoría");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mostrar selector nativo en iOS
   */
  const showActionSheetIOS = () => {
    const options = [
      ...CATEGORIES.map(ct => {
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
      (buttonIndex) => {
        if (buttonIndex < CATEGORIES.length) {
          toggleCategory(CATEGORIES[buttonIndex].type);
        }
      }
    );
  };

  /**
   * Mostrar modal en Android
   */
  const showModalAndroid = () => {
    setModalVisible(true);
  };

  /**
   * Manejar clic en el botón
   */
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      showActionSheetIOS();
    } else {
      showModalAndroid();
    }
  };

  // Determinar si el spot está en alguna categoría
  const hasCategories = categories.length > 0;

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="p-2"
      >
        <Icon
          as={Bookmark}
          className={`w-6 h-6 ${
            hasCategories 
              ? "text-blue-500 fill-blue-500" 
              : "text-gray-400"
          }`}
        />
      </Pressable>

      {/* Modal para Android */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-6">
              <Text className="text-xl font-bold mb-2">Guardar en colección</Text>
              <Text className="text-gray-600 mb-6">Selecciona donde quieres guardar este spot</Text>
              
              <VStack className="gap-3">
                {CATEGORIES.map((ct) => {
                  const isInCategory = categories.includes(ct.type);
                  
                  return (
                    <Pressable
                      key={ct.type}
                      onPress={() => {
                        toggleCategory(ct.type);
                        setModalVisible(false);
                      }}
                      disabled={loading}
                      className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg active:bg-gray-100"
                    >
                      <View className="flex-row items-center gap-3">
                        <Icon 
                          as={ct.icon} 
                          size={20} 
                          color={ct.color}
                        />
                        <Text className="text-base font-medium">{ct.label}</Text>
                      </View>
                      {isInCategory && (
                        <Icon as={Check} className="w-5 h-5 text-blue-500" />
                      )}
                    </Pressable>
                  );
                })}
              </VStack>

              <Pressable
                onPress={() => setModalVisible(false)}
                className="mt-6 p-4 bg-gray-200 rounded-lg items-center"
              >
                <Text className="font-medium text-gray-700">Cancelar</Text>
              </Pressable>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
