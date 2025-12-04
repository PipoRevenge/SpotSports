import { useAppAlert } from '@/src/context/app-alert-context';
import { useSelectedSpot } from "@/src/context/selected-spot-context";
import React, { useState } from "react";
import { Platform } from "react-native";
import { useSpotCollection } from "../hooks/use-spot-collection";
import { SpotCollectionButton } from "./spot-collection-button";
import { SpotCollectionModal, showSpotCollectionActionSheet } from "./spot-collection-modal";

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
  const { showSuccess, showActionSheet } = useAppAlert();

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
      showSpotCollectionActionSheet(categories, handleToggle, showSuccess, showActionSheet);
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
