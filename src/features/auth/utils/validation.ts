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
  return username.trim().length > 0 && !username.includes(" ");
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