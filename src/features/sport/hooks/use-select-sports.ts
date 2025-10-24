import { useCallback, useEffect, useRef, useState } from "react";
import { SportCategory, SportOption, SportSimple } from "../types/sport-types";
import {
  getSelectedSportIds,
  addAndSelectSport as helperAddAndSelectSport,
  markSportsAsSelected,
  toggleSportSelection,
  toSportOption
} from "../utils/sport-helpers";
import { validateSportSelection } from "../utils/sport-validations";
import { useSearchSports } from "./use-search-sports";

// Caché global para mantener las selecciones entre renders y componentes
const selectedSportsCache: Record<string, boolean> = {};

/**
 * Hook para manejar la selección de deportes
 * Encapsula toda la lógica de negocio para seleccionar múltiples deportes
 */
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
  
  // Refs para seguimiento de estado
  const initializedRef = useRef(false);
  const initialSelectedRef = useRef<string[]>([]);
  const manualSelectionRef = useRef<Set<string>>(new Set());
  const instanceIdRef = useRef(`sports-${Math.random().toString(36).substring(2, 9)}`);

  /**
   * Función para inicializar el caché con selecciones iniciales
   */
  const initializeCache = useCallback((ids: string[]) => {
    ids.forEach(id => {
      selectedSportsCache[id] = true;
    });
    initialSelectedRef.current = [...ids];
  }, []);

  /**
   * Inicializar opciones y caché cuando se cargan los deportes
   */
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
      
      return toSportOption(sport, isSelected);
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

    // Actualizar el estado de UI usando el helper
    setSportOptions(prev => toggleSportSelection(prev, sportId));
    
    console.log(`[${instanceIdRef.current}] Sport toggled: ${sportId}, now ${!currentSelected}`);
  }, []);

  /**
   * Agrega un nuevo deporte a las opciones y lo selecciona
   */
  const addAndSelectSport = useCallback((sport: SportSimple) => {
    // Actualizar caché inmediatamente
    selectedSportsCache[sport.id] = true;
    manualSelectionRef.current.add(sport.id);
    
    // Actualizar estado usando el helper
    setSportOptions(prev => helperAddAndSelectSport(prev, sport));
    
    console.log(`Deporte añadido y seleccionado: ${sport.name} (${sport.id})`);
    console.log(`[${instanceIdRef.current}] Cache updated:`, 
      Object.keys(selectedSportsCache).filter(id => selectedSportsCache[id]));
  }, []);

  /**
   * Obtiene los deportes seleccionados
   */
  const getSelectedSports = useCallback((): string[] => {
    // Usar helper para obtener IDs de las opciones actuales
    const selectedFromOptions = getSelectedSportIds(sportOptions);
    
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
      delete selectedSportsCache[id];
    });
    
    selectedSportIds.forEach(id => {
      selectedSportsCache[id] = true;
    });

    // Actualizar referencia manual
    manualSelectionRef.current = new Set(selectedSportIds);
    
    // Actualizar opciones UI usando helper
    setSportOptions(prev => markSportsAsSelected(prev, selectedSportIds));
    
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
    
    // Resetear opciones pero mantener iniciales usando helper
    setSportOptions(prev => markSportsAsSelected(prev, initialSelectedRef.current));
    
    console.log(`[${instanceIdRef.current}] Selection reset`);
  }, []);

  /**
   * Valida que al menos un deporte esté seleccionado
   */
  const validateSelection = useCallback((): boolean => {
    const selectedIds = getSelectedSports();
    return validateSportSelection(selectedIds);
  }, [getSelectedSports]);
  
  /**
   * Recargar deportes desde la API
   */
  const reloadSports = useCallback(async (category?: SportCategory) => {
    if (!availableSports) {
      await loadSports(category);
    }
  }, [availableSports, loadSports]);

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
      
      // Actualizar UI usando helper
      setSportOptions(prev => markSportsAsSelected(prev, allSelected));
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
    // Estado
    sportOptions,
    loading: sportsLoading,
    error: sportsError,
    availableSports: sourceSports,
    
    // Acciones de selección
    toggleSport,
    addAndSelectSport,
    getSelectedSports,
    setSelectedSports,
    resetSelection,
    validateSelection,
    
    // Acciones de datos
    reloadSports,
  };
};