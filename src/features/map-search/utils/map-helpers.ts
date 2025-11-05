import { GeoPoint } from "@/src/types/geopoint";
import { Region } from "react-native-maps";
import {
    LocationWithDistance,
    MapSearchResult,
} from "../types/map-types";

/**
 * Helpers y utilidades para búsqueda en mapa
 */

// ==================== CÁLCULOS DE DISTANCIA ====================

/**
 * Convierte grados a radianes
 */
const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param point1 Primera coordenada
 * @param point2 Segunda coordenada
 * @returns Distancia en kilómetros
 */
export const calculateDistance = (
  point1: GeoPoint,
  point2: GeoPoint
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Verifica si un punto está dentro de un radio de distancia
 */
export const isWithinDistance = (
  point1: GeoPoint,
  point2: GeoPoint,
  maxDistanceKm: number
): boolean => {
  const distance = calculateDistance(point1, point2);
  return distance <= maxDistanceKm;
};

/**
 * Añade información de distancia a una ubicación
 */
export const addDistanceToLocation = (
  location: GeoPoint,
  userLocation?: GeoPoint
): LocationWithDistance => {
  if (!userLocation) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  const distance = calculateDistance(userLocation, location);

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    distance,
  };
};

// ==================== FORMATEO DE DISTANCIA ====================

/**
 * Formatea una distancia para mostrar al usuario
 * @param distanceKm Distancia en kilómetros
 * @returns String formateado (ej: "1.5 km", "500 m")
 */
export const formatDistance = (distanceKm: number | undefined): string => {
  if (distanceKm === undefined) {
    return "Distancia desconocida";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
};

// ==================== CÁLCULOS DE REGIÓN ====================

/**
 * Calcula una región apropiada para mostrar múltiples puntos
 * @param locations Array de ubicaciones
 * @param padding Padding adicional (por defecto 0.1)
 * @returns Región del mapa
 */
export const calculateRegionForLocations = (
  locations: GeoPoint[],
  padding: number = 0.1
): Region | null => {
  if (locations.length === 0) {
    return null;
  }

  if (locations.length === 1) {
    return {
      latitude: locations[0].latitude,
      longitude: locations[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  // Calcular límites
  let minLat = locations[0].latitude;
  let maxLat = locations[0].latitude;
  let minLng = locations[0].longitude;
  let maxLng = locations[0].longitude;

  locations.forEach((location) => {
    if (location.latitude < minLat) minLat = location.latitude;
    if (location.latitude > maxLat) maxLat = location.latitude;
    if (location.longitude < minLng) minLng = location.longitude;
    if (location.longitude > maxLng) maxLng = location.longitude;
  });

  // Calcular centro y deltas
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const deltaLat = (maxLat - minLat) * (1 + padding);
  const deltaLng = (maxLng - minLng) * (1 + padding);

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(deltaLat, 0.01), // Mínimo zoom
    longitudeDelta: Math.max(deltaLng, 0.01),
  };
};

/**
 * Calcula una región basada en una ubicación y distancia máxima
 * @param center Centro de la región
 * @param maxDistanceKm Distancia máxima en km
 * @returns Región del mapa
 */
export const calculateRegionForDistance = (
  center: GeoPoint,
  maxDistanceKm: number
): Region => {
  // Aproximación: 1 grado de latitud ≈ 111 km
  const latitudeDelta = (maxDistanceKm / 111) * 2.5; // Factor 2.5 para dar más contexto
  const longitudeDelta = latitudeDelta;

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

// ==================== VALIDACIONES ====================

/**
 * Valida que una ubicación sea válida
 */
export const isValidLocation = (location: GeoPoint | null | undefined): boolean => {
  if (!location) return false;

  const { latitude, longitude } = location;

  // Validar rangos
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  if (latitude < -90 || latitude > 90) {
    return false;
  }

  if (longitude < -180 || longitude > 180) {
    return false;
  }

  return true;
};

/**
 * Valida una distancia máxima
 */
export const isValidMaxDistance = (distance: number | undefined): boolean => {
  if (distance === undefined) return true;
  return distance > 0 && distance <= 1000; // Máximo 1000 km
};

// ==================== FILTRADO Y ORDENAMIENTO ====================

/**
 * Filtra resultados por distancia máxima
 */
export const filterByDistance = <T,>(
  results: MapSearchResult<T>[],
  maxDistanceKm?: number
): MapSearchResult<T>[] => {
  if (!maxDistanceKm) {
    return results;
  }

  return results.filter((result) => {
    if (result.location.distance === undefined) {
      return true; // Mantener items sin distancia calculada
    }
    return result.location.distance <= maxDistanceKm;
  });
};

/**
 * Filtra resultados por query de búsqueda
 * @param results Resultados a filtrar
 * @param query Query de búsqueda
 * @param searchableFields Función que extrae campos buscables del item
 */
export const filterByQuery = <T,>(
  results: MapSearchResult<T>[],
  query: string,
  searchableFields: (item: T) => string[]
): MapSearchResult<T>[] => {
  if (!query || query.trim() === "") {
    return results;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return results.filter((result) => {
    const fields = searchableFields(result.item);
    return fields.some((field) =>
      field.toLowerCase().includes(normalizedQuery)
    );
  });
};

/**
 * Ordena resultados según criterio
 */
export const sortResults = <T,>(
  results: MapSearchResult<T>[],
  sortBy: "distance" | "rating" | "name" | "recent",
  sortOrder: "asc" | "desc" = "asc",
  getters: {
    getRating?: (item: T) => number;
    getName?: (item: T) => string;
    getDate?: (item: T) => Date;
  } = {}
): MapSearchResult<T>[] => {
  const sorted = [...results];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "distance":
        const distA = a.location.distance ?? Infinity;
        const distB = b.location.distance ?? Infinity;
        comparison = distA - distB;
        break;

      case "rating":
        if (getters.getRating) {
          const ratingA = getters.getRating(a.item);
          const ratingB = getters.getRating(b.item);
          comparison = ratingB - ratingA; // Orden descendente por defecto
        }
        break;

      case "name":
        if (getters.getName) {
          const nameA = getters.getName(a.item).toLowerCase();
          const nameB = getters.getName(b.item).toLowerCase();
          comparison = nameA.localeCompare(nameB);
        }
        break;

      case "recent":
        if (getters.getDate) {
          const dateA = getters.getDate(a.item).getTime();
          const dateB = getters.getDate(b.item).getTime();
          comparison = dateB - dateA; // Más recientes primero
        }
        break;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });

  return sorted;
};

// ==================== TRANSFORMACIONES ====================

/**
 * Transforma un array de items en resultados de búsqueda
 */
export const transformToSearchResults = <T,>(
  items: T[],
  getLocation: (item: T) => GeoPoint,
  userLocation?: GeoPoint
): MapSearchResult<T>[] => {
  return items.map((item) => {
    const itemLocation = getLocation(item);
    const location = addDistanceToLocation(itemLocation, userLocation);

    return {
      item,
      location,
    };
  });
};

// ==================== AGRUPACIÓN ====================

/**
 * Agrupa resultados por distancia
 */
export const groupByDistance = <T,>(
  results: MapSearchResult<T>[],
  ranges: { label: string; max: number }[]
): { label: string; results: MapSearchResult<T>[] }[] => {
  const groups = ranges.map((range) => ({
    label: range.label,
    results: [] as MapSearchResult<T>[],
  }));

  // Agregar grupo para items sin distancia
  groups.push({
    label: "Distancia desconocida",
    results: [],
  });

  results.forEach((result) => {
    const distance = result.location.distance;

    if (distance === undefined) {
      groups[groups.length - 1].results.push(result);
      return;
    }

    // Encontrar el grupo apropiado
    for (let i = 0; i < ranges.length; i++) {
      if (distance <= ranges[i].max) {
        groups[i].results.push(result);
        return;
      }
    }

    // Si no encaja en ningún rango, va al último grupo antes de "desconocida"
    if (ranges.length > 0) {
      groups[ranges.length - 1].results.push(result);
    }
  });

  // Filtrar grupos vacíos
  return groups.filter((group) => group.results.length > 0);
};

// ==================== ESTADÍSTICAS ====================

/**
 * Calcula estadísticas sobre los resultados
 */
export interface SearchStatistics {
  totalResults: number;
  averageDistance?: number;
  closestDistance?: number;
  farthestDistance?: number;
  withinRange: number; // Cantidad dentro del rango especificado
}

export const calculateStatistics = <T,>(
  results: MapSearchResult<T>[],
  maxDistanceKm?: number
): SearchStatistics => {
  const distances = results
    .map((r) => r.location.distance)
    .filter((d): d is number => d !== undefined);

  const withinRange = maxDistanceKm
    ? results.filter(
        (r) =>
          r.location.distance !== undefined &&
          r.location.distance <= maxDistanceKm
      ).length
    : results.length;

  if (distances.length === 0) {
    return {
      totalResults: results.length,
      withinRange,
    };
  }

  const averageDistance =
    distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const closestDistance = Math.min(...distances);
  const farthestDistance = Math.max(...distances);

  return {
    totalResults: results.length,
    averageDistance,
    closestDistance,
    farthestDistance,
    withinRange,
  };
};
