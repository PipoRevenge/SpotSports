import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { SportsSelectorModal } from "@/src/features/sport";
import { SpotCreateForm } from "@/src/features/spot";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";

export default function CreateSpotScreen() {
  const router = useRouter();

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
      />
    </SafeAreaView>
  );
}