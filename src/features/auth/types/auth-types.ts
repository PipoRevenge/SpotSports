export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  photo?: string;
  birthDate?: Date;
  fullName?: string;
  bio?: string;
}

export interface AuthFormErrors {
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
  username?: boolean;
  birthDate?: boolean;
}

export interface AuthResult {
  validationErrors: any;
  success: boolean;
  error?: any;
}