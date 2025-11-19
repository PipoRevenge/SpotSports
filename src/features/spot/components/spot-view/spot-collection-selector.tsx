import { useSelectedSpot } from "@/src/features/spot";
import {
  SpotCollectionButton,
  SpotCollectionModal,
  showSpotCollectionActionSheet,
  useSpotCollection
} from "@/src/features/spot-collection";
import React, { useState } from "react";
import { Platform } from "react-native";

interface SpotCollectionSelectorProps {
  spotId: string;
}

/**
 * Componente que permite añadir/quitar un spot de diferentes categorías
 * Usa un ActionSheet en iOS y un Modal personalizado en Android
 */
export const SpotCollectionSelector: React.FC<SpotCollectionSelectorProps> = ({ spotId }) => {
  const { refreshSpotCounters } = useSelectedSpot();
  const { categories, hasCategories, isLoading, toggleCategory } = useSpotCollection(spotId);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Wrapper para toggle que también refresca contadores
   */
  const handleToggle = async (category: any) => {
    const success = await toggleCategory(category);
    if (success) {
      await refreshSpotCounters();
    }
    return success;
  };

  /**
   * Manejar clic en el botón
   */
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      showSpotCollectionActionSheet(categories, handleToggle);
    } else {
      setModalVisible(true);
    }
  };

  return (
    <>
      <SpotCollectionButton
        hasCategories={hasCategories}
        onPress={handlePress}
        disabled={isLoading}
      />

      <SpotCollectionModal
        visible={modalVisible}
        categories={categories}
        isLoading={isLoading}
        onToggleCategory={handleToggle}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};
