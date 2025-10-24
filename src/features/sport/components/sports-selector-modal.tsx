import { Box } from "@/src/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/src/components/ui/button";
import { Heading } from "@/src/components/ui/heading";
import { HStack } from "@/src/components/ui/hstack";
import { CloseIcon, Icon, TrashIcon } from "@/src/components/ui/icon";
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
import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { ScrollView } from "react-native";
import { useSelectSports } from "../hooks/use-select-sports";
import { CreateSportData, SportSimple, SportsSelectorProps, SportsSelectorRef } from "../types/sport-types";
import { CreateSportForm } from "./create-sport-form";
import { SportSearch } from "./sport-search";


type ViewMode = 'select' | 'create';

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

    const {
      sportOptions,
      loading,
      error: sportsError,
      isCreating,
      createError,
      toggleSport,
      addAndSelectSport,
      getSelectedSports,
      resetSelection,
      validateSelection,
      createSport,
      clearCreateError,
    } = useSelectSports(selectedSports, availableSports);
    
    // El hook useSelectSports ahora maneja la sincronización con el caché global
    // No necesitamos sincronización adicional aquí

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
          const sportId = await onCreateSport(sportData);
          addAndSelectSport({ id: sportId, name: sportData.name });
        } else {
          await createSport(sportData);
        }
        setViewMode('select');
      } catch (error) {
        throw error;
      }
    }, [onCreateSport, createSport, addAndSelectSport]);

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
              {selectedCount > 0 
                ? `${selectedCount} deporte${selectedCount !== 1 ? 's' : ''} seleccionado${selectedCount !== 1 ? 's' : ''}` 
                : "Añadir deportes"}
            </ButtonText>
          </Button>
          
          {/* Lista horizontal de deportes seleccionados */}
          {selectedCount > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mt-2"
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
            <Text className="text-red-600 text-sm mt-1">{errorMessage}</Text>
          )}
        </Box>

        {/* Modal */}
        <Modal
          isOpen={isModalVisible}
          onClose={closeModal}
          size="full"
        >
          <ModalBackdrop />
          <ModalContent className="h-full max-h-full m-6 border-2 border-gray-300 rounded-2xl shadow-lg bg-white p-2">
            <ModalHeader className="border-b border-gray-400 px-4 py-3">
              <HStack className="items-center justify-between">
                <Heading size="xl" >
                  {viewMode === 'select' ? 'Buscar y Seleccionar Deportes' : 'Crear Nuevo Deporte'}
                </Heading>
                <ModalCloseButton>
                  <Icon as={CloseIcon} />
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
                          placeholder="Buscar deportes en la base de datos..."
                          showAllOnEmpty={true}
                          maxResults={10}
                        />

                        {/* Lista de deportes seleccionados */}
                        <VStack space="md" className="mt-6 border border-gray-400 rounded-lg p-4 bg-gray-50">
                          <Text className="text-sm text-gray-600 font-medium">
                            Deportes seleccionados ({selectedCount})
                          </Text>
                          {loading ? (
                            <Box className="py-8">
                              <Text className="text-center text-gray-600">Cargando deportes...</Text>
                            </Box>
                          ) : sportOptions.filter(s => s.selected).length > 0 ? (
                            <VStack space="xs">
                              {sportOptions
                                .filter(sport => sport.selected)
                                .map((sport) => (
                                  <HStack 
                                    key={sport.id}
                                    className="items-center justify-between p-3 bg-white rounded-lg border border-gray-400"
                                  >
                                    <Text className="text-gray-900 flex-1">{sport.name}</Text>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onPress={() => toggleSport(sport.id)}
                                    >
                                      <ButtonIcon as={TrashIcon} className="text-red-600" />
                                    </Button>
                                  </HStack>
                                ))}
                            </VStack>
                          ) : (
                            <Box className="py-8 bg-white rounded-lg">
                              <Text className="text-center text-gray-600">
                                No hay deportes seleccionados
                              </Text>
                              <Text className="text-center text-gray-500 text-sm mt-2">
                                Usa el buscador para agregar deportes
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
                            className="mt-4"
                          >
                            <ButtonText className="text-gray-700">Crear Nuevo Deporte</ButtonText>
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
                    Aceptar ({selectedCount} deporte{selectedCount !== 1 ? 's' : ''})
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
