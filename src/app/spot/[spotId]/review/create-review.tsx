import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { CreateReviewForm } from "@/src/features/review";
import { useReviewCreate } from "@/src/features/review/hooks/use-review-create";
import { CreateReviewData } from "@/src/features/review/types/review-types";
import { SportSearch } from "@/src/features/sport";
import { useSelectedSpot } from "@/src/features/spot";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useMemo } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

/**
 * Página de creación de review
 * Ruta: /spot/review/[spotId]/create-review
 */
export const CreateReviewPage = () => {
    const params = useLocalSearchParams();
    const spotId = params.spotId as string;
    const spotSports = useMemo(() => {
        return params.spotSports ? JSON.parse(params.spotSports as string) : [];
    }, [params.spotSports]);
    
    // Usar el contexto de Spot Seleccionado para actualizar globalmente
    const { refreshAll } = useSelectedSpot();
    
    const { createReview, isLoading, error } = useReviewCreate(async () => {
        // Refrescar todos los datos del spot (spot + reviews)
        await refreshAll();
        // Volver atrás sin forzar navegación
        router.back();
    });
    
    /**
     * Manejar el envío del formulario
     */
    const handleSubmit = async (reviewData: CreateReviewData) => {
        if (!spotId) return;
        
        try {
            await createReview(reviewData);
        } catch (error) {
            console.error('Error creating review:', error);
        }
    };
    
    /**
     * Cancelar y volver atrás
     */
    const handleCancel = () => {
        router.back();
    };
    
    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <HStack className="px-6 py-4 border-b border-gray-200 items-center gap-3">
                <Pressable onPress={handleCancel}>
                    <ArrowLeft size={24} color="#000" />
                </Pressable>
                <Text className="text-xl font-bold flex-1">Escribir Review</Text>
            </HStack>
            
            {/* Formulario */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <CreateReviewForm
                        spotId={spotId}
                        spotSports={spotSports}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                        error={error}
                        sportSearchSlot={SportSearch}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreateReviewPage;
