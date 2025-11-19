import { userRepository } from "@/src/api/repositories";
import { useUser } from "@/src/entities/user/context/user-context";
import { SavedSpot, SpotCategory } from "@/src/entities/user/model/spot-collection";
import { useSelectedSpot } from "@/src/features/spot";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

/**
 * Hook para gestionar spots guardados en diferentes categorías
 * Permite añadir/quitar spots de las categorías del usuario (Favorites, Visited, WantToVisit)
 */
export const useSpotFavorites = (spotId?: string) => {
  const { user } = useUser();
  const { refreshSpotCounters } = useSelectedSpot();
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
        console.error("[useSpotFavorites] Error checking categories:", error);
        setCategories([]);
      }
    };

    checkCategories();
  }, [user, spotId]);

  /**
   * Obtener todos los spots guardados del usuario (filtrados por categoría si se especifica)
   */
  const loadSavedSpots = async (category?: SpotCategory) => {
    if (!user) {
      setSavedSpots([]);
      return;
    }

    try {
      setIsLoading(true);
      const spots = await userRepository.getUserSavedSpots(user.id, category);
      setSavedSpots(spots);
    } catch (error) {
      console.error("[useSpotFavorites] Error loading saved spots:", error);
      setSavedSpots([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Añadir spot a categorías
   */
  const addToCategories = async (categoriesToAdd: SpotCategory[], targetSpotId?: string) => {
    const spotToAdd = targetSpotId || spotId;
    
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para guardar spots");
      return;
    }

    if (!spotToAdd) {
      Alert.alert("Error", "No se especificó un spot");
      return;
    }

    try {
      setIsLoading(true);
      
      await userRepository.addSpotToCategories(user.id, spotToAdd, categoriesToAdd);
      
      // Actualizar categorías locales
      if (spotToAdd === spotId) {
        const updatedCategories = await userRepository.getSpotCategories(user.id, spotToAdd);
        setCategories(updatedCategories);
      }
      
      // Recargar spots guardados si están cargados
      if (savedSpots.length > 0) {
        await loadSavedSpots();
      }
      
      // Refresh spot counters if we're working with the current spot
      try {
        await refreshSpotCounters();
      } catch (error) {
        // Ignore refresh errors as they're not critical
        console.log("[useSpotFavorites] Could not refresh spot counters:", error);
      }
      
    } catch (error) {
      console.error("[useSpotFavorites] Error adding to categories:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "No se pudo guardar el spot";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quitar spot de categorías
   */
  const removeFromCategories = async (categoriesToRemove: SpotCategory[], targetSpotId?: string) => {
    const spotToRemove = targetSpotId || spotId;
    
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    if (!spotToRemove) {
      Alert.alert("Error", "No se especificó un spot");
      return;
    }

    try {
      setIsLoading(true);
      
      await userRepository.removeSpotFromCategories(user.id, spotToRemove, categoriesToRemove);
      
      // Actualizar categorías locales
      if (spotToRemove === spotId) {
        const updatedCategories = await userRepository.getSpotCategories(user.id, spotToRemove);
        setCategories(updatedCategories);
      }
      
      // Recargar spots guardados si están cargados
      if (savedSpots.length > 0) {
        await loadSavedSpots();
      }
      
      // Refresh spot counters if we're working with the current spot
      try {
        await refreshSpotCounters();
      } catch (error) {
        // Ignore refresh errors as they're not critical
        console.log("[useSpotFavorites] Could not refresh spot counters:", error);
      }
      
    } catch (error) {
      console.error("[useSpotFavorites] Error removing from categories:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "No se pudo eliminar el spot";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualizar las categorías del spot (reemplazar completamente)
   */
  const updateCategories = async (newCategories: SpotCategory[], targetSpotId?: string) => {
    const spotToUpdate = targetSpotId || spotId;
    
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    if (!spotToUpdate) {
      Alert.alert("Error", "No se especificó un spot");
      return;
    }

    try {
      setIsLoading(true);
      
      await userRepository.updateSpotCategories(user.id, spotToUpdate, newCategories);
      
      // Actualizar categorías locales
      if (spotToUpdate === spotId) {
        setCategories(newCategories);
      }
      
      // Recargar spots guardados si están cargados
      if (savedSpots.length > 0) {
        await loadSavedSpots();
      }
      
      // Refresh spot counters if we're working with the current spot
      try {
        await refreshSpotCounters();
      } catch (error) {
        // Ignore refresh errors as they're not critical
        console.log("[useSpotFavorites] Could not refresh spot counters:", error);
      }
      
    } catch (error) {
      console.error("[useSpotFavorites] Error updating categories:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "No se pudo actualizar las categorías";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verificar si el spot está en una categoría específica
   */
  const isInCategory = (category: SpotCategory): boolean => {
    return categories.includes(category);
  };

  /**
   * Verificar si el spot está en alguna categoría
   */
  const isInAnyCategory = (): boolean => {
    return categories.length > 0;
  };

  return {
    categories,
    isLoading,
    savedSpots,
    loadSavedSpots,
    addToCategories,
    removeFromCategories,
    updateCategories,
    isInCategory,
    isInAnyCategory,
  };
};
