import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { SportsSelectorModal } from "@/src/features/sport";
import { SpotCreateForm } from "@/src/features/spot";
import { useUserLocation } from "@/src/hooks/use-user-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";

export default function CreateSpotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Pre-cargar la ubicación del usuario al entrar a la pantalla
  // Esto evita errores cuando se abre el modal de selección de ubicación
  useUserLocation(true);

  // Obtener ubicación desde parámetros si viene del mapa
  const initialLocation = useMemo(() => {
    if (params.latitude && params.longitude) {
      return {
        latitude: parseFloat(params.latitude as string),
        longitude: parseFloat(params.longitude as string),
      };
    }
    return undefined;
  }, [params.latitude, params.longitude]);

  const handleSuccess = (spotId: string) => {
    console.log("Spot creado con éxito:", spotId);
    // Navegar de vuelta o a la pantalla del spot
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  /**
   * Componente SportsSelectorModal como slot para SpotCreateForm
   * Permite buscar y crear deportes desde la base de datos
   */
  const SportsSlot = useCallback((props: any) => (
    <SportsSelectorModal
      {...props}
      allowCreate={true}
      allowSearch={true}
    />
  ), []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SpotCreateForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        sportsSlot={SportsSlot}
        initialLocation={initialLocation}
      />
    </SafeAreaView>
  );
}