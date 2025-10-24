import { spotRepository } from "@/src/api/repositories";
import { SpotDetails } from "@/src/entities/spot/model/spot";
import { useState } from "react";
import { SpotCreateFormData, SpotFormState } from "../types/spot-types";
import { validateSpotCreateForm } from "../utils/spot-validations";

/**
 * Hook personalizado para manejar la creación de spots
 */
export const useCreateSpot = () => {
  const [state, setState] = useState<SpotFormState>({
    isLoading: false,
    error: null,
    success: false
  });

  /**
   * Función para crear un nuevo spot
   */
  const createSpot = async (formData: SpotCreateFormData): Promise<boolean> => {
    setState({ isLoading: true, error: null, success: false });

    try {
      // Validar formulario
      const validation = validateSpotCreateForm(formData);
      
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        setState({ 
          isLoading: false, 
          error: firstError || "Datos del formulario inválidos", 
          success: false 
        });
        return false;
      }

      // Preparar datos para el repositorio
      const spotDetails: SpotDetails = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        availableSports: formData.availableSports,
        media: formData.media,
        location: formData.location!,
        overallRating: 0, // Rating inicial
        contactInfo: {
          phone: formData.contactPhone?.trim() || "",
          email: formData.contactEmail?.trim() || "",
          website: formData.contactWebsite?.trim() || "",
        }
      };

      // Llamar al repositorio para crear el spot
      await spotRepository.createSpot(spotDetails);

      setState({ isLoading: false, error: null, success: true });
      return true;

    } catch (error) {
      console.error("Error creating spot:", error);
      
      let errorMessage = "Error inesperado al crear el spot";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setState({ 
        isLoading: false, 
        error: errorMessage, 
        success: false 
      });
      return false;
    }
  };

  /**
   * Función para resetear el estado del hook
   */
  const resetState = () => {
    setState({ isLoading: false, error: null, success: false });
  };

  /**
   * Función para limpiar errores
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    // Estado
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    
    // Acciones
    createSpot,
    resetState,
    clearError
  };
};
