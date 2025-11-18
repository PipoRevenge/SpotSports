import { Button } from "@/src/components/ui/button";
import { HStack } from "@/src/components/ui/hstack";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import { useUser } from "@/src/entities/user/context/user-context";
import { CreateReviewForm } from "@/src/features/review";
import { useReviewLoad } from "@/src/features/review/hooks/use-review-load";
import { useReviewUpdate } from "@/src/features/review/hooks/use-review-update";
import { CreateReviewData, ReviewFormData } from "@/src/features/review/types/review-types";
import { useSelectedSpot } from "@/src/features/spot";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, View } from "react-native";

/**
 * Página de edición de review
 * Ruta: /spot/review/[spotId]/edit-review
 */
export const EditReviewPage = () => {
    const params = useLocalSearchParams();
    const spotId = params.spotId as string;
    const spotSports = useMemo(() => 
        params.spotSports ? JSON.parse(params.spotSports as string) : []
    , [params.spotSports]);
    
    const { user } = useUser();
    const [initialData, setInitialData] = useState<ReviewFormData | undefined>(undefined);
    const [loadingInitial, setLoadingInitial] = useState(true);
    
    // Usar el contexto de Spot Seleccionado para actualizar globalmente
    const { refreshAll } = useSelectedSpot();
    
    const { loadReview, loadingReview, error: loadError } = useReviewLoad();
    const { updateReview, isLoading: isUpdating, error: updateError } = useReviewUpdate(async () => {
        // Refrescar todos los datos del spot (spot + reviews)
        await refreshAll();
        // Volver atrás sin forzar navegación
        router.back();
    });
    
    /**
     * Cargar la review existente al montar el componente
     */
    useEffect(() => {
        const loadExistingReview = async () => {
            if (!spotId || !user) {
                setLoadingInitial(false);
                return;
            }
            
            const existingReview = await loadReview(spotId);
            
            if (!existingReview) {
                Alert.alert(
                    "Error",
                    "No se encontró la review para editar",
                    [{ text: "OK", onPress: () => router.back() }]
                );
                return;
            }
            
            // Convertir Review a ReviewFormData
            const formData: ReviewFormData = {
                content: existingReview.details.content,
                rating: existingReview.details.rating,
                reviewSports: existingReview.details.reviewSports.map(rs => ({
                    sportId: rs.sportId,
                    name: spotSports.find((s: any) => s.id === rs.sportId)?.name || "Deporte",
                    sportRating: rs.sportRating,
                    difficulty: rs.difficulty,
                    comment: rs.comment,
                })),
                media: existingReview.details.media?.map(uri => {
                    let type: 'image' | 'video' = 'image';
                    try {
                        const match = uri.match(/\/o\/(.+?)(\?|$)/);
                        if (match) {
                            const decodedPath = decodeURIComponent(match[1]);
                            const extension = decodedPath.split('.').pop()?.toLowerCase();
                            if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension || '')) {
                                type = 'video';
                            }
                        }
                    } catch {
                        console.warn('Could not determine media type from URL:', uri);
                    }
                    return { uri, type };
                }) || [],
            };
            
            setInitialData(formData);
            setLoadingInitial(false);
        };
        
        loadExistingReview();
    }, [spotId, user, loadReview, spotSports]);
    
    /**
     * Manejar el envío del formulario
     */
    const handleSubmit = async (reviewData: CreateReviewData) => {
        if (!spotId) return;
        
        try {
            await updateReview(reviewData);
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };
    
    /**
     * Cancelar y volver atrás
     */
    const handleCancel = () => {
        router.back();
    };
    
    if (loadingInitial || loadingReview) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text className="mt-4 text-gray-600">Cargando review...</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (loadError || !initialData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center p-6">
                    <Text className="text-red-600 text-lg font-semibold">Error</Text>
                    <Text className="mt-2 text-gray-600 text-center">
                        {loadError || "No se pudo cargar la review"}
                    </Text>
                    <Button onPress={handleCancel} className="mt-4">
                        <Text>Volver</Text>
                    </Button>
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <HStack className="px-6 py-4 border-b border-gray-200 items-center gap-3">
                <Pressable onPress={handleCancel}>
                    <ArrowLeft size={24} color="#000" />
                </Pressable>
                <Text className="text-xl font-bold flex-1">Actualizar Review</Text>
            </HStack>
            
            {/* Formulario */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-6">
                    {updateError && (
                        <View className="bg-red-50 p-4 rounded-lg mb-4">
                            <Text className="text-red-700">{updateError}</Text>
                        </View>
                    )}
                    
                    <CreateReviewForm
                        spotId={spotId}
                        spotSports={spotSports}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isUpdating}
                        error={updateError}
                        initialData={initialData}
                        isEditMode={true}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditReviewPage;
