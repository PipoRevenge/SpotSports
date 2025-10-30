/**
 * Formatea una fecha para mostrar en el perfil
 * @param date - La fecha a formatear
 * @returns La fecha formateada como string
 */
export const formatProfileDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) {
    return 'No disponible';
  }

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calcula la edad basada en la fecha de nacimiento
 * @param birthDate - La fecha de nacimiento
 * @returns La edad en años
 */
export const calculateAge = (birthDate: Date): number => {
  if (!birthDate || !(birthDate instanceof Date)) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Formatea una fecha de manera relativa (hace X tiempo)
 * @param date - La fecha a formatear
 * @returns La fecha formateada de manera relativa
 */
export const formatRelativeDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) {
    return 'Fecha no disponible';
  }

  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInYears > 0) {
    return `hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
  } else if (diffInMonths > 0) {
    return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  } else if (diffInDays > 0) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInHours > 0) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInMinutes > 0) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else {
    return 'hace un momento';
  }
};

/**
 * Verifica si una fecha de nacimiento es válida para el registro
 * @param birthDate - La fecha de nacimiento a validar
 * @returns true si la fecha es válida
 */
export const isValidBirthDate = (birthDate: Date): boolean => {
  if (!birthDate || !(birthDate instanceof Date)) {
    return false;
  }

  const age = calculateAge(birthDate);
  return age >= 13 && age <= 120;
};

/**
 * Obtiene el rango de edad apropiado para mostrar
 * @param birthDate - La fecha de nacimiento
 * @returns El rango de edad como string
 */
export const getAgeRange = (birthDate: Date): string => {
  const age = calculateAge(birthDate);
  
  if (age < 18) return '13-17';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
};