/**
 * Error types used across the application
 * This provides a standardized way to handle errors
 */

/**
 * Error categories in the application
 */
export enum ErrorCategory {
  Auth = "auth",
  Validation = "validation",
  Network = "network",
  Database = "database",
  Storage = "storage",
  Unknown = "unknown",
}

/**
 * Standard error interface used across the application
 */
export interface AppError {
  message: string;
  code?: string;
  category: ErrorCategory;
  originalError?: unknown;
}

/**
 * Factory function to create an AppError from different inputs
 */
export const createAppError = (
  error: unknown,
  defaultMessage = "Ha ocurrido un error inesperado",
): AppError => {
  // Handle case where the error is already an AppError
  if (
    typeof error === "object" &&
    error !== null &&
    "category" in error &&
    "message" in error
  ) {
    return error as AppError;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
      category: determineErrorCategory(error),
      originalError: error,
    };
  }

  // Handle Firebase-like errors with code property
  if (typeof error === "object" && error !== null && "code" in error) {
    const typedError = error as { code: string; message?: string };
    return {
      message: typedError.message || defaultMessage,
      code: typedError.code,
      category: ErrorCategory.Auth, // Assuming most code-based errors are auth related
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      message: error,
      category: ErrorCategory.Unknown,
    };
  }

  // Default case for unknown error types
  return {
    message: defaultMessage,
    category: ErrorCategory.Unknown,
    originalError: error,
  };
};

/**
 * Helper to determine error category from an Error object
 */
const determineErrorCategory = (error: Error): ErrorCategory => {
  const errorName = error.name.toLowerCase();

  if (errorName.includes("auth") || errorName.includes("permission")) {
    return ErrorCategory.Auth;
  }

  if (errorName.includes("network") || errorName.includes("connection")) {
    return ErrorCategory.Network;
  }

  if (errorName.includes("validation") || errorName.includes("invalid")) {
    return ErrorCategory.Validation;
  }

  if (errorName.includes("database") || errorName.includes("firestore")) {
    return ErrorCategory.Database;
  }

  if (errorName.includes("storage")) {
    return ErrorCategory.Storage;
  }

  return ErrorCategory.Unknown;
};

/**
 * Error utility to extract a user-friendly message from any error
 */
export const getErrorMessage = (
  error: unknown,
  defaultMessage = "Ha ocurrido un error inesperado",
): string => {
  const appError = createAppError(error, defaultMessage);
  return appError.message;
};
