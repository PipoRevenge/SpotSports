export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface ProfileData {
  fullName?: string;
  bio?: string;
  birthDate?: string;
  phoneNumber?: string;
  photoURL?: string;
}

// Validación para el nombre completo
export const validateFullName = (fullName?: string): ValidationResult => {
  if (!fullName || fullName.trim().length === 0) {
    return { isValid: false, error: 'El nombre completo es requerido' };
  }

  if (fullName.trim().length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (fullName.trim().length > 50) {
    return { isValid: false, error: 'El nombre no puede exceder los 50 caracteres' };
  }

  // Validar que solo contenga letras, espacios y algunos caracteres especiales
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/;
  if (!nameRegex.test(fullName.trim())) {
    return { isValid: false, error: 'El nombre solo puede contener letras, espacios, guiones y apostrofes' };
  }

  return { isValid: true };
};

// Validación para la biografía
export const validateBio = (bio?: string): ValidationResult => {
  if (bio && bio.length > 500) {
    return { isValid: false, error: 'La biografía no puede exceder los 500 caracteres' };
  }

  return { isValid: true };
};

// Validación para el número de teléfono
export const validatePhoneNumber = (phoneNumber?: string): ValidationResult => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return { isValid: true }; // El teléfono es opcional
  }

  // Regex para validar formatos de teléfono comunes (incluyendo internacionales)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  if (!phoneRegex.test(cleanedPhone)) {
    return { isValid: false, error: 'El formato del número de teléfono no es válido' };
  }

  if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
    return { isValid: false, error: 'El número de teléfono debe tener entre 7 y 15 dígitos' };
  }

  return { isValid: true };
};

// Validación para la fecha de nacimiento
export const validateBirthDate = (birthDate?: string): ValidationResult => {
  if (!birthDate) {
    return { isValid: true }; // La fecha de nacimiento es opcional
  }

  const date = new Date(birthDate);
  const now = new Date();

  // Verificar que sea una fecha válida
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'La fecha de nacimiento no es válida' };
  }

  // Verificar que no sea en el futuro
  if (date > now) {
    return { isValid: false, error: 'La fecha de nacimiento no puede ser en el futuro' };
  }

  // Verificar que la persona tenga al menos 13 años (política común de apps)
  const minAge = 13;
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - minAge);

  if (date > minDate) {
    return { isValid: false, error: `Debes tener al menos ${minAge} años` };
  }

  // Verificar que la persona tenga menos de 120 años (límite razonable)
  const maxAge = 120;
  const maxDate = new Date();
  maxDate.setFullYear(now.getFullYear() - maxAge);

  if (date < maxDate) {
    return { isValid: false, error: 'La fecha de nacimiento no parece válida' };
  }

  return { isValid: true };
};

// Validación principal para todos los datos del perfil
export const validateProfileData = (profileData: ProfileData): ValidationResult => {
  const fieldErrors: Record<string, string> = {};

  // Validar cada campo
  const fullNameValidation = validateFullName(profileData.fullName);
  if (!fullNameValidation.isValid && fullNameValidation.error) {
    fieldErrors.fullName = fullNameValidation.error;
  }

  const bioValidation = validateBio(profileData.bio);
  if (!bioValidation.isValid && bioValidation.error) {
    fieldErrors.bio = bioValidation.error;
  }

  const phoneValidation = validatePhoneNumber(profileData.phoneNumber);
  if (!phoneValidation.isValid && phoneValidation.error) {
    fieldErrors.phoneNumber = phoneValidation.error;
  }

  const birthDateValidation = validateBirthDate(profileData.birthDate);
  if (!birthDateValidation.isValid && birthDateValidation.error) {
    fieldErrors.birthDate = birthDateValidation.error;
  }

  // Si hay errores de campo, devolver el primero encontrado
  const firstError = Object.values(fieldErrors)[0];
  if (firstError) {
    return {
      isValid: false,
      error: firstError,
      fieldErrors
    };
  }

  return { isValid: true };
};

// Utility para limpiar el número de teléfono
export const cleanPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/[\s\-\(\)]/g, '');
};

// Utility para formatear el nombre (capitalizar primera letra de cada palabra)
export const formatFullName = (fullName: string): string => {
  return fullName
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};