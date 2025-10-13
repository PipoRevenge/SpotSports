export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

export const validateUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') return false;
  
  const trimmedUsername = username.trim();
  
  // Verificaciones básicas
  if (trimmedUsername.length < 3) return false; // Mínimo 3 caracteres
  if (trimmedUsername.length > 30) return false; // Máximo 30 caracteres
  
  // Solo permite letras, números y guiones
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(trimmedUsername)) return false;
  
  // No puede empezar o terminar con guión
  if (trimmedUsername.startsWith('-') || trimmedUsername.endsWith('-')) return false;
  
  // No puede tener guiones consecutivos
  if (trimmedUsername.includes('--')) return false;
  
  return true;
};

/**
 * Valida el formato del userName de forma más estricta
 * @param username - userName a validar
 * @returns boolean - true si el formato es válido
 */
export const validateUserNameFormat = (username: string): boolean => {
  return validateUsername(username);
};

/**
 * Genera sugerencias de userName basadas en el nombre completo
 * @param fullName - Nombre completo del usuario
 * @returns string[] - Array de sugerencias de userName
 */
export const generateUserNameSuggestions = (fullName: string): string[] => {
  if (!fullName || typeof fullName !== 'string') return [];
  
  const cleanName = fullName.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();
  
  if (!cleanName) return [];
  
  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  const suggestions: string[] = [];
  
  if (nameParts.length >= 2) {
    const [firstName, ...restNames] = nameParts;
    const lastName = restNames[restNames.length - 1];
    
    // Combinaciones básicas con guiones
    suggestions.push(`${firstName}-${lastName}`);
    suggestions.push(`${firstName}${lastName}`);
    suggestions.push(`${firstName.charAt(0)}${lastName}`);
    
    // Con números aleatorios
    const randomNum = Math.floor(Math.random() * 999) + 1;
    suggestions.push(`${firstName}-${lastName}${randomNum}`);
    suggestions.push(`${firstName}${lastName}${randomNum}`);
  } else if (nameParts.length === 1) {
    const name = nameParts[0];
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    
    suggestions.push(`${name}${randomNum}`);
    suggestions.push(`${name}-${randomNum}`);
  }
  
  // Filtrar solo sugerencias válidas y únicas
  return [...new Set(suggestions)]
    .filter(suggestion => validateUserNameFormat(suggestion))
    .slice(0, 5); // Máximo 5 sugerencias
};

export const validateBirthDate = (date: Date | null): boolean => {
  if (!date) return false;
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  return age > 14 || (age === 14 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
};

export interface ValidationResult {
  isValid: boolean;
  errors: {
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
    username?: boolean;
    birthDate?: boolean;
  };
}

export const validateSignInForm = (email: string, password: string): ValidationResult => {
  const errors = {
    email: !validateEmail(email),
    password: !validatePassword(password),
  };

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors,
  };
};

export const validateSignUpForm = (
  email: string,
  password: string,
  confirmPassword: string,
  username: string,
  birthDate: Date | null
): ValidationResult => {
  const errors = {
    email: !validateEmail(email),
    password: !validatePassword(password),
    confirmPassword: !validatePasswordsMatch(password, confirmPassword),
    username: !validateUsername(username),
    birthDate: !validateBirthDate(birthDate),
  };

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors,
  };
};