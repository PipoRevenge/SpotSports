/**
 * Utilidades para el manejo de fechas en la aplicación
 */

/**
 * Formatea una fecha a formato dd/mm/yyyy
 * @param date - Fecha a formatear
 * @returns String con formato dd/mm/yyyy
 * 
 * @example
 * ```ts
 * formatDate(new Date(2025, 0, 15)) // "15/01/2025"
 * ```
 */
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha a formato relativo (hace X tiempo)
 * @param date - Fecha a formatear
 * @returns String con formato relativo
 * 
 * @example
 * ```ts
 * formatRelativeDate(new Date()) // "Hace un momento"
 * formatRelativeDate(new Date(Date.now() - 86400000)) // "Hace 1 día"
 * ```
 */
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "Hace un momento";
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
  } else if (diffInDays < 30) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;
  } else if (diffInMonths < 12) {
    return `Hace ${diffInMonths} mes${diffInMonths > 1 ? "es" : ""}`;
  } else {
    return `Hace ${diffInYears} año${diffInYears > 1 ? "s" : ""}`;
  }
};

/**
 * Formatea una fecha y hora a formato dd/mm/yyyy HH:MM
 * @param date - Fecha a formatear
 * @returns String con formato dd/mm/yyyy HH:MM
 */
export const formatDateTime = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Genera las iniciales de un nombre
 * @param name - Nombre completo
 * @returns Iniciales en mayúsculas (máximo 2 caracteres)
 * 
 * @example
 * ```ts
 * getInitials("Juan Pérez") // "JP"
 * getInitials("María") // "MA"
 * getInitials("") // "U"
 * ```
 */
export const getInitials = (name?: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
