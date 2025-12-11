import { spotRepository } from "@/src/api/repositories";
import { useUser } from "@/src/context/user-context";
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
  const { user } = useUser();

  /**
   * Función para crear un nuevo spot
   */
  const createSpot = async (formData: SpotCreateFormData): Promise<string | null> => {
    setState({ isLoading: true, error: null, success: false });

    try {
      // Verificar que el usuario esté autenticado
      if (!user || !user.id) {
        setState({ 
          isLoading: false, 
          error: "Debes estar autenticado para crear un spot", 
          success: false 
        });
        return null;
      }

      // Verificar que el usuario tenga username
      if (!user.userDetails?.userName) {
        setState({ 
          isLoading: false, 
          error: "El usuario debe tener un nombre de usuario configurado", 
          success: false 
        });
        return null;
      }

      // Validar formulario
      const validation = validateSpotCreateForm(formData);
      
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        setState({ 
          isLoading: false, 
          error: firstError || "Datos del formulario inválidos", 
          success: false 
        });
        return null;
      }

      // Preparar datos para el repositorio
      const spotDetails: SpotDetails = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        availableSports: formData.availableSports,
        media: formData.media.map(item => item.uri), // Extraer solo las URIs
        location: formData.location!,
        overallRating: 0, // Rating inicial
        contactInfo: {
          phone: formData.contactPhone?.trim() || "",
          email: formData.contactEmail?.trim() || "",
          website: formData.contactWebsite?.trim() || "",
        }
      };

      // Llamar al repositorio para crear el spot con el userId y username
      const spotId = await spotRepository.createSpot(spotDetails, user.id, user.userDetails.userName);

      setState({ isLoading: false, error: null, success: true });
      return spotId;

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
      return null;
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
