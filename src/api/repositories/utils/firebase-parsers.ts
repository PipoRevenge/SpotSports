/**
 * Utilidades para parsear datos de Firebase a formatos de la aplicación
 */

import { FirebaseError } from 'firebase/app';

/**
 * Parses Firebase errors into user-friendly messages
 */
export const parseFirebaseError = (error: unknown): { message: string; code?: string; details?: any } => {
  if (error instanceof FirebaseError) {
    const code = error.code;
    const originalMessage = error.message;
    
    // Map common Firebase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'permission-denied': 'No tienes permisos para realizar esta acción',
      'unauthenticated': 'Debes iniciar sesión para continuar',
      'not-found': 'El recurso solicitado no existe',
      'already-exists': 'Este recurso ya existe',
      'resource-exhausted': 'Se ha excedido el límite de recursos',
      'failed-precondition': 'La operación no puede completarse en este momento',
      'aborted': 'La operación fue cancelada',
      'out-of-range': 'Valor fuera del rango permitido',
      'unimplemented': 'Esta funcionalidad no está implementada',
      'internal': 'Error interno del servidor. Por favor, intenta nuevamente',
      'unavailable': 'El servicio no está disponible. Verifica tu conexión',
      'data-loss': 'Se perdieron datos durante la operación',
      'invalid-argument': 'Los datos proporcionados no son válidos',
      'deadline-exceeded': 'La operación tardó demasiado tiempo',
      'cancelled': 'La operación fue cancelada',
    };
    
    const userMessage = errorMessages[code] || `Error de Firebase: ${originalMessage}`;
    
    console.error('[FirebaseError]', {
      code,
      message: originalMessage,
      userMessage,
      stack: error.stack,
      customData: error.customData,
    });
    
    return {
      message: userMessage,
      code,
      details: {
        originalMessage,
        customData: error.customData,
      },
    };
  }
  
  if (error instanceof Error) {
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return {
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
    };
  }
  
  console.error('[UnknownError]', error);
  return {
    message: 'Ocurrió un error inesperado',
    details: { error: String(error) },
  };
};

/**
 * Logs repository operation errors with context
 */
export const logRepositoryError = (
  operation: string,
  context: Record<string, any>,
  error: unknown
): void => {
  const parsedError = parseFirebaseError(error);
  
  console.error(`[Repository:${operation}] Error`, {
    operation,
    context,
    error: parsedError,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Convierte varios formatos de timestamp a Date
 * Soporta: Date, number (ms), string, Firestore Timestamp, objeto {seconds, nanoseconds}
 */
export function parseTimestamp(value: any): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  // Firestore Timestamp has toDate()
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return undefined;
    }
  }
  // Raw object like { seconds, nanos } or { seconds, nanoseconds }
  if (typeof value === 'object' && (value.seconds !== undefined || value.nanoseconds !== undefined || value.nanos !== undefined)) {
    const secs = Number(value.seconds || 0);
    const nanos = Number(value.nanoseconds ?? value.nanos ?? 0);
    return new Date(secs * 1000 + Math.floor(nanos / 1e6));
  }
  return undefined;
}

/**
 * Convierte varios formatos de location a { latitude, longitude }
 * Soporta: FirebaseGeoPoint, {lat, lng}, {latitude, longitude}
 */
export function parseLocation(value: any): { latitude: number; longitude: number } {
  if (!value) {
    return { latitude: 0, longitude: 0 };
  }

  // FirebaseGeoPoint tiene propiedades latitude y longitude
  if (value.latitude !== undefined && value.longitude !== undefined) {
    return {
      latitude: Number(value.latitude) || 0,
      longitude: Number(value.longitude) || 0,
    };
  }

  // Objeto plano con lat y lng (de cloud functions)
  if (value.lat !== undefined && value.lng !== undefined) {
    return {
      latitude: Number(value.lat) || 0,
      longitude: Number(value.lng) || 0,
    };
  }

  return { latitude: 0, longitude: 0 };
}
