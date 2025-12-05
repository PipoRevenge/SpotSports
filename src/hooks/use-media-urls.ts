import { resolveStorageUrls } from "@/src/api/lib";
import { useEffect, useMemo, useState } from "react";

/**
 * Hook para resolver URLs de Firebase Storage
 * 
 * Convierte paths de Storage a URLs descargables.
 * Si el path ya es una URL (http/https), lo devuelve sin cambios.
 * 
 * @param paths - Array de paths de Storage o URLs
 * @returns Object con las URLs resueltas y estado de carga
 */
export const useMediaUrls = (paths: string[] | undefined | null) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoizar la key para evitar re-renders innecesarios
  const pathsKey = useMemo(() => JSON.stringify(paths), [paths]);

  useEffect(() => {
    const resolveUrls = async () => {
      if (!paths || paths.length === 0) {
        setUrls([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resolvedUrls = await resolveStorageUrls(paths);
        setUrls(resolvedUrls);
      } catch (err) {
        console.error('[useMediaUrls] Error resolving URLs:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // En caso de error general, usar los paths originales
        setUrls(paths);
      } finally {
        setLoading(false);
      }
    };

    resolveUrls();
  }, [pathsKey, paths]);

  return { urls, loading, error };
};

/**
 * Hook para resolver una sola URL de Firebase Storage
 * 
 * @param path - Path de Storage o URL
 * @returns Object con la URL resuelta y estado de carga
 */
export const useMediaUrl = (path: string | undefined | null) => {
  const { urls, loading, error } = useMediaUrls(path ? [path] : []);
  
  return {
    url: urls[0] || null,
    loading,
    error
  };
};
