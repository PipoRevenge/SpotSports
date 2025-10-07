import { useUser } from '@/src/context/user-context';
import { useCallback, useState } from 'react';

interface UseProfileActionsReturn {
  signOut: () => Promise<void>;
  isSigningOut: boolean;
  signOutError: string | null;
}

/**
 * Hook para manejar las acciones del perfil de usuario
 * Mantiene la separación de responsabilidades sin acoplar features
 */
export const useProfileActions = (): UseProfileActionsReturn => {
  const { signOut: contextSignOut } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      setSignOutError(null);
      await contextSignOut();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar sesión';
      setSignOutError(errorMessage);
      console.error('Profile Actions - Sign Out Error:', error);
    } finally {
      setIsSigningOut(false);
    }
  }, [contextSignOut]);

  return {
    signOut,
    isSigningOut,
    signOutError,
  };
};