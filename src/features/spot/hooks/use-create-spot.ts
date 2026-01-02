import { spotRepository } from "@/src/api/repositories";
import { parseFirebaseError } from "@/src/api/repositories/utils/firebase-parsers";
import { useUser } from "@/src/context/user-context";
import { SpotDetails } from "@/src/entities/spot/model/spot";
import { useMutation, useQueryClient } from "@/src/lib/react-query";
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
  const queryClient = useQueryClient();

  /**
   * Función para crear un nuevo spot
   */
  const createSpotMutation = useMutation({
    mutationFn: async (formData: SpotCreateFormData): Promise<string> => {
      console.log('[useCreateSpot] Starting spot creation', {
        hasUser: !!user,
        hasUserDetails: !!user?.userDetails,
        mediaCount: formData.media?.length || 0,
      });

      // Verificar que el usuario esté autenticado
      if (!user || !user.id) {
        throw new Error("Debes estar autenticado para crear un spot");
      }

      // Verificar que el usuario tenga username
      if (!user.userDetails?.userName) {
        throw new Error("El usuario debe tener un nombre de usuario configurado");
      }

      // Validar formulario
      const validation = validateSpotCreateForm(formData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        console.error('[useCreateSpot] Form validation failed', validation.errors);
        throw new Error(firstError || "Datos del formulario inválidos");
      }

      const spotDetails: SpotDetails = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        availableSports: formData.availableSports,
        media: formData.media.map(item => item.uri),
        location: formData.location!,
        overallRating: 0,
        contactInfo: {
          phone: formData.contactPhone?.trim() || "",
          email: formData.contactEmail?.trim() || "",
          website: formData.contactWebsite?.trim() || "",
        }
      };

      console.log('[useCreateSpot] Calling repository with spot details', {
        name: spotDetails.name,
        mediaCount: spotDetails.media.length,
        sportsCount: spotDetails.availableSports.length,
      });

      return spotRepository.createSpot(spotDetails, user.id, user.userDetails.userName);
    },
    onSuccess: async (spotId) => {
      console.log('[useCreateSpot] Spot created successfully', { spotId });
      setState({ isLoading: false, error: null, success: true });
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['spots'] });
      await queryClient.invalidateQueries({ queryKey: ['spot', spotId] });
    },
    onMutate: () => {
      console.log('[useCreateSpot] Mutation started');
      setState({ isLoading: true, error: null, success: false });
    },
    onError: (error: unknown) => {
      const parsedError = parseFirebaseError(error);
      console.error('[useCreateSpot] Mutation failed', parsedError);
      
      setState({
        isLoading: false,
        error: parsedError.message,
        success: false
      });
    },
    retry: 0,
  });

  const createSpot = async (formData: SpotCreateFormData): Promise<string | null> => {
    try {
      const spotId = await createSpotMutation.mutateAsync(formData);
      return spotId;
    } catch {
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
