import { SportOption, SportSimple } from '../types/sport-types';

/**
 * Convierte un deporte del dominio a SportSimple para la UI
 */
export const toSimpleSport = (sport: any): SportSimple => ({
  id: sport.id,
  name: sport.details?.name || sport.name,
  category: sport.details?.category || sport.category || 'Outdoor', // Fallback para datos legacy
});

/**
 * Convierte SportSimple a SportOption
 */
export const toSportOption = (sport: SportSimple, selected: boolean = false): SportOption => ({
  ...sport,
  selected,
});

/**
 * Filtra deportes excluyendo IDs específicos
 */
export const filterSportsExcluding = (sports: SportSimple[], excludeIds: string[]): SportSimple[] => {
  if (excludeIds.length === 0) return sports;
  const excludeSet = new Set(excludeIds);
  return sports.filter(sport => !excludeSet.has(sport.id));
};

/**
 * Limita el número de resultados
 */
export const limitResults = <T>(items: T[], maxResults: number): T[] => {
  return items.slice(0, maxResults);
};

/**
 * Verifica si una consulta de búsqueda es válida
 */
export const isValidSearchQuery = (query: string, minLength: number = 1): boolean => {
  return query.trim().length >= minLength;
};

/**
 * Normaliza texto para búsqueda (sin acentos, minúsculas)
 */
export const normalizeForSearch = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Filtra deportes por texto de búsqueda (búsqueda local)
 */
export const filterSportsByQuery = (sports: SportSimple[], query: string): SportSimple[] => {
  if (!isValidSearchQuery(query)) return sports;
  
  const normalizedQuery = normalizeForSearch(query);
  
  return sports.filter(sport => 
    normalizeForSearch(sport.name).includes(normalizedQuery)
  );
};

/**
 * Obtiene IDs de deportes seleccionados desde SportOptions
 */
export const getSelectedSportIds = (sportOptions: SportOption[]): string[] => {
  return sportOptions
    .filter(sport => sport.selected)
    .map(sport => sport.id);
};

/**
 * Actualiza la selección de un deporte en la lista de opciones
 */
export const toggleSportSelection = (sportOptions: SportOption[], sportId: string): SportOption[] => {
  return sportOptions.map(sport => 
    sport.id === sportId 
      ? { ...sport, selected: !sport.selected }
      : sport
  );
};

/**
 * Marca deportes como seleccionados basado en una lista de IDs
 */
export const markSportsAsSelected = (sportOptions: SportOption[], selectedIds: string[]): SportOption[] => {
  const selectedSet = new Set(selectedIds);
  return sportOptions.map(sport => ({
    ...sport,
    selected: selectedSet.has(sport.id),
  }));
};

/**
 * Añade un nuevo deporte a la lista de opciones y lo marca como seleccionado
 */
export const addAndSelectSport = (sportOptions: SportOption[], newSport: SportSimple): SportOption[] => {
  // Verificar si el deporte ya existe
  const existingIndex = sportOptions.findIndex(sport => sport.id === newSport.id);
  
  if (existingIndex >= 0) {
    // Si existe, marcarlo como seleccionado
    return sportOptions.map((sport, index) => 
      index === existingIndex 
        ? { ...sport, selected: true }
        : sport
    );
  } else {
    // Si no existe, agregarlo como seleccionado
    return [...sportOptions, toSportOption(newSport, true)];
  }
};

/**
 * Formatea el texto de conteo de deportes seleccionados
 */
export const formatSelectedCount = (count: number): string => {
  if (count === 0) return 'Añadir deportes';
  return `${count} deporte${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`;
};

/**
 * Formatea el texto de resultados encontrados
 */
export const formatResultsCount = (count: number): string => {
  return `${count} deporte${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
};

/**
 * Filtra deportes por categoría
 */
export const filterSportsByCategory = (sports: SportSimple[], category?: string): SportSimple[] => {
  if (!category) return sports;
  
  return sports.filter(sport => sport.category === category);
};

/**
 * Filtra deportes por múltiples criterios
 */
export const filterSportsMultiple = (
  sports: SportSimple[], 
  filters: { query?: string; category?: string; excludeIds?: string[] }
): SportSimple[] => {
  let filtered = sports;
  
  // Filtrar por categoría
  if (filters.category) {
    filtered = filterSportsByCategory(filtered, filters.category);
  }
  
  // Filtrar por texto de búsqueda
  if (filters.query && isValidSearchQuery(filters.query)) {
    filtered = filterSportsByQuery(filtered, filters.query);
  }
  
  // Excluir IDs específicos
  if (filters.excludeIds && filters.excludeIds.length > 0) {
    filtered = filterSportsExcluding(filtered, filters.excludeIds);
  }
  
  return filtered;
};