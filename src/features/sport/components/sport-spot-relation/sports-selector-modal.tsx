import { Box } from "@/src/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import { Heading } from "@/src/components/ui/heading";
import { HStack } from "@/src/components/ui/hstack";
import { Icon } from "@/src/components/ui/icon";
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader
} from "@/src/components/ui/modal";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { Trash2, X } from "lucide-react-native";
import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { ScrollView } from "react-native";
import { useCreateSport } from "../../hooks/use-create-sport";
import { useSelectSports } from "../../hooks/use-select-sports";
import { CreateSportData, SportSimple, SportsSelectorProps, SportsSelectorRef } from "../../types/sport-types";
import { formatSelectedCount } from "../../utils/sport-helpers";
import { CreateSportForm } from "../sport-create/sport-create-form";
import { SportSearch } from "../sport-search/sport-search";

type ViewMode = 'select' | 'create';

/**
 * Modal selector de deportes refactorizado
 * Componente que maneja solo la UI y delega la lógica a los hooks especializados
 */
export const SportsSelectorModal = forwardRef<SportsSelectorRef, SportsSelectorProps>(
  ({
    selectedSports,
    onSportsChange,
    error,
    required = false,
    availableSports,
    allowCreate = false,
    onCreateSport,
  }, ref) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('select');

    // Hooks especializados para lógica de negocio
    const {
      sportOptions,
      loading,
      error: sportsError,
      toggleSport,
      addAndSelectSport,
      getSelectedSports,
      resetSelection,
      validateSelection,
      reloadSports,
    } = useSelectSports(selectedSports, availableSports);

    const {
      isCreating,
      createError,
      createSport,
      clearCreateError,
    } = useCreateSport();

    /**
     * Exponer métodos públicos
     */
    useImperativeHandle(ref, () => ({
      validate: validateSelection,
      getSelectedSports,
      reset: resetSelection,
    }));

    /**
     * Abre el modal
     */
    const openModal = useCallback(() => {
      setIsModalVisible(true);
    }, []);

    /**
     * Cierra el modal y confirma cambios
     */
    const closeModal = useCallback(() => {
      // Guardar las selecciones actuales antes de cerrar
      const selected = getSelectedSports();
      
      // Propagar cambios hacia arriba
      onSportsChange(selected);
      setIsModalVisible(false);
    }, [getSelectedSports, onSportsChange]);

    /**
     * Maneja la selección de un deporte desde la búsqueda
     */
    const handleSportSelect = useCallback((sport: SportSimple) => {
      // Añadir y seleccionar el deporte (inmediato, sin esperar sincronización)
      addAndSelectSport(sport);
      console.log(`Deporte seleccionado: ${sport.name} (ID: ${sport.id})`);
    }, [addAndSelectSport]);

    /**
     * Maneja la creación de un nuevo deporte
     */
    const handleCreateSport = useCallback(async (sportData: CreateSportData) => {
      try {
        if (onCreateSport) {
          // Usar función personalizada si se proporciona
          const sportId = await onCreateSport(sportData);
          addAndSelectSport({ 
            id: sportId, 
            name: sportData.name, 
            category: sportData.category 
          });
        } else {
          // Usar hook interno de creación
          const sportId = await createSport(sportData);
          addAndSelectSport({ 
            id: sportId, 
            name: sportData.name, 
            category: sportData.category 
          });
          
          // Recargar deportes para mantener sincronización
          await reloadSports();
        }
        setViewMode('select');
      } catch (error) {
        throw error;
      }
    }, [onCreateSport, createSport, addAndSelectSport, reloadSports]);

    const selectedCount = getSelectedSports().length;
    const errorMessage = error || sportsError;

    return (
      <>
        {/* Trigger Button */}
        <Box>
          <Button
            variant="outline"
            onPress={openModal}
            className="border-gray-300"
          >
            <ButtonText className="text-gray-700">
              {formatSelectedCount(selectedCount)}
            </ButtonText>
          </Button>
          
          {/* Lista horizontal de deportes seleccionados */}
          {selectedCount > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="pt-2"
            >
              <HStack space="xs" className="py-1">
                {sportOptions
                  .filter(sport => sport.selected)
                  .map((sport) => (
                    <Box 
                      key={sport.id}
                      className="bg-blue-100 border border-blue-300 rounded-full px-3 py-1"
                    >
                      <Text className="text-blue-800 text-xs font-medium">
                        {sport.name}
                      </Text>
                    </Box>
                  ))}
              </HStack>
            </ScrollView>
          )}
          
          {errorMessage && (
            <Text className="text-red-600 text-sm pt-1">{errorMessage}</Text>
          )}
        </Box>

        {/* Modal */}
        <Modal
          isOpen={isModalVisible}
          onClose={closeModal}
          className="p-2"
        >
          <ModalBackdrop />
          <ModalContent className=" w-fit h-fit p-6 border-2 border-gray-300 rounded-2xl shadow-lg bg-white">
            <ModalHeader className="border-b border-gray-400 px-4 py-3">
              <HStack className="items-center justify-between">
                <Heading size="xl" >
                  {viewMode === 'select' ? 'Search and Select Sports' : 'Create New Sport'}
                </Heading>
                <ModalCloseButton>
                  <Icon as={X} />
                </ModalCloseButton>
              </HStack>
            </ModalHeader>

            <ModalBody className="flex-1 flex flex-col">
              <Box className="flex-1">
                <ScrollView className="flex-1">
                  <Box className="p-4">
                    {/* Vista de Selección */}
                    {viewMode === 'select' && (
                        <VStack space="lg">
                        {/* Buscador principal */}
                        <SportSearch
                          onSportSelect={handleSportSelect}
                          excludeIds={getSelectedSports()}
                          placeholder="Search sports in the database..."
                          showAllOnEmpty={true}
                          maxResults={10}
                          showCategoryFilter={true}
                        />

                        {/* Lista de deportes seleccionados */}
                        <VStack space="md" className="pt-6 border border-gray-400 rounded-lg p-4 bg-gray-50">
                          <Text className="text-sm text-gray-600 font-medium">
                            Selected sports ({selectedCount})
                          </Text>
                          {loading ? (
                            <Box className="p-4">
                              <Text className="text-center text-gray-600">Loading sports...</Text>
                            </Box>
                          ) : sportOptions.filter(s => s.selected).length > 0 ? (
                            <VStack space="xs">
                              {sportOptions
                                .filter(sport => sport.selected)
                                .map((sport) => (
                                  <HStack 
                                    key={sport.id} 
                                    className="items-center justify-between p-3 bg-white rounded-lg border border-gray-300"
                                  >
                                    <Text className="text-gray-900 flex-1">{sport.name}</Text>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onPress={() => toggleSport(sport.id)}
                                      className="p-2"
                                    >
                                      <ButtonIcon as={Trash2} className="text-red-500" size="sm" />
                                    </Button>
                                  </HStack>
                                ))}
                            </VStack>
                          ) : (
                            <Box className="p-4 bg-white rounded-lg border border-gray-300">
                              <Text className="text-center text-gray-500">
                                {required 
                                  ? "Select at least one sport to continue" 
                                  : "No sports selected"
                                }
                              </Text>
                            </Box>
                          )}
                        </VStack>

                        {/* Botón para crear nuevo deporte */}
                        {allowCreate && (
                          <Button
                            variant="outline"
                            onPress={() => {
                              setViewMode('create');
                              clearCreateError();
                            }}
                          >
                            <ButtonText className="text-blue-600 font-medium">
                              + Crear nuevo deporte
                            </ButtonText>
                          </Button>
                        )}
                      </VStack>
                    )}

                    {/* Vista de Creación */}
                    {viewMode === 'create' && (
                      <CreateSportForm
                        onSubmit={handleCreateSport}
                        onCancel={() => setViewMode('select')}
                        isLoading={isCreating}
                        error={createError}
                      />
                    )}
                  </Box>
                </ScrollView>
              </Box>
              
              {/* Botón Aceptar fijo en la parte inferior */}
              <Box className="p-4 border-t border-gray-300 bg-gray-50 rounded-b-2xl">
                <Button
                  size="lg"
                  onPress={closeModal}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ButtonText className="text-white font-semibold">
                    Aceptar ({formatSelectedCount(selectedCount)})
                  </ButtonText>
                </Button>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }
);

SportsSelectorModal.displayName = 'SportsSelectorModal';