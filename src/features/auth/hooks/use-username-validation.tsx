import { userRepository } from '@/src/api';
import { validateUsername } from '@/src/features/auth/utils/validation';
import { useCallback, useEffect, useState } from 'react';

interface UseUsernameValidationReturn {
  isValid: boolean;
  isAvailable: boolean | null;
  isChecking: boolean;
  error: string | null;
}

export const useUsernameValidation = (username: string, debounceMs: number = 500): UseUsernameValidationReturn => {
  const [isValid, setIsValid] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck.trim()) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    if (!validateUsername(usernameToCheck)) {
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      setError(null);
      
      const isTaken = await userRepository.checkUserNameExists(usernameToCheck);
      setIsAvailable(!isTaken);
    } catch (err: any) {
      setError(err.message || 'Error checking username availability');
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const trimmedUsername = username.trim();
    
    // Validate format first
    const formatIsValid = validateUsername(trimmedUsername);
    setIsValid(formatIsValid);

    if (!trimmedUsername) {
      setIsAvailable(null);
      setIsChecking(false);
      setError(null);
      return;
    }

    if (!formatIsValid) {
      setIsAvailable(false);
      setIsChecking(false);
      setError('Invalid username format');
      return;
    }

    // Debounce the availability check
    const timeoutId = setTimeout(() => {
      checkAvailability(trimmedUsername);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, debounceMs, checkAvailability]);

  return {
    isValid,
    isAvailable,
    isChecking,
    error,
  };
};