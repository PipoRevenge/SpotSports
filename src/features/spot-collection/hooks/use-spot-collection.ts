import { userRepository } from "@/src/api/repositories";
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from "@/src/context/user-context";
import { SavedSpot, SpotCategory } from "@/src/entities/user/model/spot-collection";
import { useCallback, useEffect, useState } from "react";
// removed Alert import - using AppAlertProvider (useAppAlert) instead

/**
 * Hook para gestionar colecciones de spots del usuario
 * Proporciona funcionalidad para añadir, quitar y consultar spots en diferentes categorías
 */
export const useSpotCollection = (spotId?: string) => {
  const { user } = useUser();
  const { showError } = useAppAlert();
  const [categories, setCategories] = useState<SpotCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSpots, setSavedSpots] = useState<SavedSpot[]>([]);

  /**
   * Verificar las categorías del spot actual
   */
  useEffect(() => {
    const checkCategories = async () => {
      if (!user || !spotId) {
        setCategories([]);
        return;
      }

      try {
        const spotCategories = await userRepository.getSpotCategories(user.id, spotId);
        setCategories(spotCategories);
      } catch (error) {
        console.error("[useSpotCollection] Error checking categories:", error);
        setCategories([]);
      }
    };

    checkCategories();
  }, [user, spotId]);

  /**
   * Cargar todos los spots guardados del usuario (filtrados por categoría si se especifica)
   */
  const loadSavedSpots = useCallback(async (category?: SpotCategory) => {
    if (!user) {
      setSavedSpots([]);
      return;
    }

    try {
      setIsLoading(true);
      const spots = await userRepository.getUserSavedSpots(user.id, category);
      setSavedSpots(spots);
    } catch (error) {
      console.error("[useSpotCollection] Error loading saved spots:", error);
      setSavedSpots([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Añadir spot a categorías
   */
  const addToCategories = async (
    categoriesToAdd: SpotCategory[], 
    targetSpotId?: string
  ) => {
    const spotToAdd = targetSpotId || spotId;
    
    // useAppAlert is initialized at the top of the hook (see above)
    if (!user) {
      showError("Debes iniciar sesión para guardar spots");
      return false;
    }

    if (!spotToAdd) {
      showError("No se especificó un spot");
      return false;
    }

    try {
      setIsLoading(true);
      
      await userRepository.addSpotToCategories(user.id, spotToAdd, categoriesToAdd);
      
      // Actualizar categorías locales si es el spot actual
      if (spotToAdd === spotId) {
        const updatedCategories = await userRepository.getSpotCategories(user.id, spotToAdd);
        setCategories(updatedCategories);
      }
      
      // Recargar spots guardados si están cargados
      if (savedSpots.length > 0) {
        await loadSavedSpots();
      }
      
      return true;
    } catch (error) {
      console.error("[useSpotCollection] Error adding to categories:", error);
      showError("No se pudo guardar el spot");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quitar spot de categorías
   */
  const removeFromCategories = async (
    categoriesToRemove: SpotCategory[], 
    targetSpotId?: string
  ) => {
    const spotToRemove = targetSpotId || spotId;
    
    // useAppAlert is initialized at the top of the hook (see above)
    if (!user) {
      showError("Debes iniciar sesión");
      return false;
    }

    if (!spotToRemove) {
      showError("No se especificó un spot");
      return false;
    }

    try {
      setIsLoading(true);
      
      await userRepository.removeSpotFromCategories(user.id, spotToRemove, categoriesToRemove);
      
      // Actualizar categorías locales si es el spot actual
      if (spotToRemove === spotId) {
        const updatedCategories = await userRepository.getSpotCategories(user.id, spotToRemove);
        setCategories(updatedCategories);
      }
      
      // Recargar spots guardados si están cargados
      if (savedSpots.length > 0) {
        await loadSavedSpots();
      }
      
      return true;
    } catch (error) {
      console.error("[useSpotCollection] Error removing from categories:", error);
      showError("No se pudo eliminar el spot");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle una categoría (añadir si no está, quitar si está)
   * Ahora el backend maneja el toggle automáticamente
   */
  const toggleCategory = async (category: SpotCategory, targetSpotId?: string) => {
    const spotToToggle = targetSpotId || spotId;
    
    if (!spotToToggle) {
      return false;
    }

    // El backend ahora hace toggle automáticamente:
    // - Si no existe, lo añade
    // - Si ya existe, lo quita
    return await addToCategories([category], spotToToggle);
  };

  /**
   * Verificar si el spot está en alguna categoría
   */
  const hasCategories = categories.length > 0;

  return {
    categories,
    savedSpots,
    isLoading,
    hasCategories,
    loadSavedSpots,
    addToCategories,
    removeFromCategories,
    toggleCategory,
  };
};
