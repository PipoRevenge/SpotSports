import { sportRepository } from '@/src/api/repositories';
import { useCallback, useEffect, useRef, useState } from "react";
import { CreateSportData, SportOption, SportSimple } from "../types/sport-types";
import { useSearchSports } from "./use-search-sports";

// Caché global para mantener las selecciones entre renders y componentes
const selectedSportsCache: Record<string, boolean> = {};

export const useSelectSports = (
  initialSelectedSports: string[] = [],
  availableSports?: SportSimple[]
) => {
  const { 
    sports: apiSports, 
    loading: sportsLoading, 
    error: sportsError,
    loadSports 
  } = useSearchSports({ autoLoad: !availableSports });

  // Usar deportes proporcionados o los de la API
  const sourceSports = availableSports || apiSports;
  
  // Estado para deportes con selección
  const [sportOptions, setSportOptions] = useState<SportOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Refs para seguimiento de estado
  const initializedRef = useRef(false);
  const initialSelectedRef = useRef<string[]>([]);
  const manualSelectionRef = useRef<Set<string>>(new Set());
  const instanceIdRef = useRef(`sports-${Math.random().toString(36).substring(2, 9)}`);

  // Función para inicializar el caché con selecciones iniciales
  const initializeCache = useCallback((ids: string[]) => {
    ids.forEach(id => {
      selectedSportsCache[id] = true;
    });
    initialSelectedRef.current = [...ids];
  }, []);

  // Inicializar opciones y caché cuando se cargan los deportes
  useEffect(() => {
    if (sourceSports.length === 0) return;
    
    // Inicializar el caché con las selecciones iniciales si es la primera carga
    if (!initializedRef.current) {
      initializeCache(initialSelectedSports);
    }
    
    // Construir opciones basadas en el estado actual del caché
    const options = sourceSports.map(sport => {
      const isSelected = selectedSportsCache[sport.id] === true || 
                         initialSelectedSports.includes(sport.id) || 
                         manualSelectionRef.current.has(sport.id);
      
      // Actualizar caché si está seleccionado
      if (isSelected) {
        selectedSportsCache[sport.id] = true;
      }
      
      return {
        ...sport,
        selected: isSelected
      };
    });
    
    setSportOptions(options);
    initializedRef.current = true;
    
    console.log(`[${instanceIdRef.current}] Sports initialized with cache:`, 
      Object.keys(selectedSportsCache).filter(id => selectedSportsCache[id]));
  }, [sourceSports, initialSelectedSports, initializeCache]);

  /**
   * Alterna la selección de un deporte
   */
  const toggleSport = useCallback((sportId: string) => {
    // Actualizar el caché primero
    const currentSelected = !!selectedSportsCache[sportId];
    if (currentSelected) {
      delete selectedSportsCache[sportId];
      manualSelectionRef.current.delete(sportId);
    } else {
      selectedSportsCache[sportId] = true;
      manualSelectionRef.current.add(sportId);
    }

    // Actualizar el estado de UI
    setSportOptions(prev => 
      prev.map(sport => 
        sport.id === sportId 
          ? { ...sport, selected: !currentSelected }
          : sport
      )
    );
    
    console.log(`[${instanceIdRef.current}] Sport toggled: ${sportId}, now ${!currentSelected}`);
  }, []);

  /**
   * Agrega un nuevo deporte a las opciones y lo selecciona
   */
  const addAndSelectSport = useCallback((sport: SportSimple) => {
    // Actualizar caché inmediatamente
    selectedSportsCache[sport.id] = true;
    manualSelectionRef.current.add(sport.id);
    
    setSportOptions(prev => {
      // Verificar si el deporte ya existe
      const exists = prev.find(option => option.id === sport.id);
      if (exists) {
        // Si existe, solo cambiarlo a seleccionado
        return prev.map(option => 
          option.id === sport.id 
            ? { ...option, selected: true }
            : option
        );
      } else {
        // Si no existe, agregarlo como seleccionado
        return [...prev, { ...sport, selected: true }];
      }
    });
    
    console.log(`Deporte añadido y seleccionado: ${sport.name} (${sport.id})`);
    console.log(`[${instanceIdRef.current}] Cache updated:`, 
      Object.keys(selectedSportsCache).filter(id => selectedSportsCache[id]));
  }, []);

  /**
   * Obtiene los deportes seleccionados
   */
  const getSelectedSports = useCallback((): string[] => {
    // Usar primero el estado de UI, pero validar con el caché como respaldo
    const selectedFromOptions = sportOptions
      .filter(sport => sport.selected || selectedSportsCache[sport.id])
      .map(sport => sport.id);
    
    // También incluir deportes del caché que no estén en las opciones
    const allSelectedIds = new Set([
      ...selectedFromOptions,
      ...Object.keys(selectedSportsCache).filter(id => selectedSportsCache[id])
    ]);
    
    return Array.from(allSelectedIds);
  }, [sportOptions]);

  /**
   * Establece los deportes seleccionados
   */
  const setSelectedSports = useCallback((selectedSportIds: string[]) => {
    // Actualizar caché
    Object.keys(selectedSportsCache).forEach(id => {
      selectedSportsCache[id] = false;
      delete selectedSportsCache[id];
    });
    
    selectedSportIds.forEach(id => {
      selectedSportsCache[id] = true;
    });

    // Actualizar referencia manual
    manualSelectionRef.current = new Set(selectedSportIds);
    
    // Actualizar opciones UI
    setSportOptions(prev =>
      prev.map(sport => ({
        ...sport,
        selected: selectedSportIds.includes(sport.id)
      }))
    );
    
    console.log(`[${instanceIdRef.current}] Selected sports set:`, selectedSportIds);
  }, []);

  /**
   * Resetea la selección
   */
  const resetSelection = useCallback(() => {
    // Limpiar caché pero preservar selecciones iniciales
    Object.keys(selectedSportsCache).forEach(id => {
      if (!initialSelectedRef.current.includes(id)) {
        delete selectedSportsCache[id];
      }
    });
    
    manualSelectionRef.current.clear();
    
    // Resetear opciones pero mantener iniciales
    setSportOptions(prev =>
      prev.map(sport => ({
        ...sport,
        selected: initialSelectedRef.current.includes(sport.id)
      }))
    );
    
    console.log(`[${instanceIdRef.current}] Selection reset`);
  }, []);

  /**
   * Valida que al menos un deporte esté seleccionado
   */
  const validateSelection = useCallback((): boolean => {
    return getSelectedSports().length > 0;
  }, [getSelectedSports]);

  /**
   * Crea un nuevo deporte
   */
  const createSport = useCallback(async (sportData: CreateSportData): Promise<string> => {
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const sportId = await sportRepository.createSport({
        name: sportData.name,
        description: sportData.description,
        category: sportData.category,
        icon: sportData.icon,
      }, 'user'); // TODO: Obtener el ID del usuario actual

      // Añadir inmediatamente al caché
      selectedSportsCache[sportId] = true;
      manualSelectionRef.current.add(sportId);

      // Agregar el nuevo deporte a las opciones
      const newSport: SportOption = {
        id: sportId,
        name: sportData.name,
        selected: true, // Seleccionar automáticamente el nuevo deporte
      };

      setSportOptions(prev => [...prev, newSport]);

      // Recargar deportes si estamos usando la API
      if (!availableSports) {
        // Esperar a que se complete la carga antes de continuar
        await loadSports();
      }

      console.log(`[${instanceIdRef.current}] New sport created and selected: ${sportData.name} (${sportId})`);
      return sportId;
    } catch (error: any) {
      setCreateError(error.message || 'Error al crear el deporte');
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [availableSports, loadSports]);

  /**
   * Limpia el error de creación
   */
  const clearCreateError = useCallback(() => {
    setCreateError(null);
  }, []);
  
  // Efecto para sincronizar cambios de props con el estado interno
  useEffect(() => {
    // Si hay cambios en los deportes iniciales seleccionados (desde props)
    // actualizar solo si realmente han cambiado
    const currentSelected = new Set(Object.keys(selectedSportsCache).filter(id => selectedSportsCache[id]));
    const propsSelected = new Set(initialSelectedSports);

    // Comparar si realmente son diferentes
    let isDifferent = currentSelected.size !== propsSelected.size;
    if (!isDifferent) {
      for (const id of currentSelected) {
        if (!propsSelected.has(id)) {
          isDifferent = true;
          break;
        }
      }
    }

    if (isDifferent) {
      console.log(`[${instanceIdRef.current}] Props changed, updating selections:`, initialSelectedSports);
      
      // Solo actualizar el estado si realmente cambió
      // pero preservar las selecciones manuales
      const manualSelections = Array.from(manualSelectionRef.current);
      
      const allSelected = [...new Set([...initialSelectedSports, ...manualSelections])];
      
      // Actualizar caché
      Object.keys(selectedSportsCache).forEach(id => {
        delete selectedSportsCache[id];
      });
      
      allSelected.forEach(id => {
        selectedSportsCache[id] = true;
      });
      
      // Actualizar UI
      setSportOptions(prev =>
        prev.map(sport => ({
          ...sport,
          selected: allSelected.includes(sport.id)
        }))
      );
    }
  }, [initialSelectedSports]);
  
  // Limpieza al desmontar
  useEffect(() => {
    // Capturar el ID de instancia para usar en la función de limpieza
    const instanceId = instanceIdRef.current;
    
    return () => {
      console.log(`[${instanceId}] Component unmounting, preserving cache`);
      // No limpiamos el caché al desmontar para mantener las selecciones
    };
  }, []);

  return {
    sportOptions,
    loading: sportsLoading,
    error: sportsError,
    isCreating,
    createError,
    toggleSport,
    addAndSelectSport,
    getSelectedSports,
    setSelectedSports,
    resetSelection,
    validateSelection,
    createSport,
    clearCreateError,
    availableSports: sourceSports,
  };
};