# Hooks - Custom Hooks Globales

## 📦 Propósito

La carpeta `src/hooks` contiene **custom hooks globales** que son reutilizables en toda la aplicación y no pertenecen a ninguna feature específica. Estos hooks encapsulan lógica común que puede ser compartida entre múltiples features y componentes.

## 🎯 ¿Qué va en Hooks Globales?

Los hooks en esta carpeta deben ser:
- ✅ **Genéricos y reutilizables** - no específicos de una feature
- ✅ **Independientes del dominio** - lógica técnica, no de negocio
- ✅ **Compartidos** - usados en múltiples features o componentes

## 🚨 Restricción Importante

**Los hooks específicos de una feature deben ir en** `src/features/[feature]/hooks/`

```typescript
// ❌ INCORRECTO - Hook de negocio en hooks globales
src/hooks/use-spot-details.ts  // Esto va en src/features/spot/hooks/

// ✅ CORRECTO - Hook genérico en hooks globales
src/hooks/use-user-location.ts  // Hook reutilizable en toda la app
```

## 📁 Estructura Actual

```
hooks/
└── use-user-location.ts    # Hook para obtener la ubicación del usuario
```

## 🎣 Hooks Disponibles

### **useUserLocation** 📍

**Archivo**: `use-user-location.ts`

Hook para obtener la ubicación geográfica actual del usuario, solicitando permisos y manejando errores.

**Interfaz:**
```typescript
interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseUserLocationReturn {
  location: UserLocation | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => Promise<void>;
}

const useUserLocation = (autoRequest?: boolean): UseUserLocationReturn
```

**Parámetros:**
- `autoRequest` (opcional): Si es `true`, solicita la ubicación automáticamente al montar el componente. Por defecto: `false`

**Retorna:**
- `location`: Coordenadas del usuario o `null`
- `error`: Mensaje de error si falla la obtención de ubicación
- `isLoading`: Estado de carga
- `requestLocation`: Función para solicitar ubicación manualmente

**Características:**
- ✅ Solicita permisos de ubicación al usuario
- ✅ Timeout de 10 segundos para evitar bloqueos
- ✅ Fallback a última ubicación conocida si falla la actual
- ✅ Manejo robusto de errores (emulador, permisos denegados, etc.)
- ✅ Logs detallados para debugging

**Uso:**

```typescript
import { useUserLocation } from '@/src/hooks/use-user-location';

function MapComponent() {
  // Obtener ubicación automáticamente al montar
  const { location, error, isLoading } = useUserLocation(true);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <MapView 
      center={location} 
      zoom={15}
    />
  );
}

// O solicitar manualmente
function SearchComponent() {
  const { location, requestLocation, isLoading } = useUserLocation();
  
  const handleUseMyLocation = async () => {
    await requestLocation();
  };
  
  return (
    <Button onPress={handleUseMyLocation} loading={isLoading}>
      Usar mi ubicación
    </Button>
  );
}
```

**Usado en:**
- Feature de búsqueda en mapa
- Creación de nuevos spots
- Filtros por proximidad
- Cualquier feature que necesite la ubicación del usuario

## 🔄 Flujo de Uso

```
Global Hooks (src/hooks)
         ↓
┌────────┼────────┬────────┐
│        │        │        │
Features  App   Components  Pages
```

## ✅ Cuándo Crear un Hook Global

Crea un nuevo hook en `src/hooks/` cuando:

- ✅ **Reutilizable en múltiples features** - usado en 2+ features diferentes
- ✅ **Lógica técnica/infraestructura** - no es lógica de negocio
- ✅ **Independiente del dominio** - no está acoplado a un concepto de negocio específico

**Ejemplos válidos para hooks globales:**
- `useDebounce` - Debouncing de inputs
- `useThrottle` - Throttling de funciones
- `usePermissions` - Manejo de permisos del sistema
- `useUserLocation` - Obtener ubicación del usuario
- `useNetworkStatus` - Estado de la conexión
- `useKeyboardHeight` - Altura del teclado
- `useAppState` - Estado de la app (foreground/background)

## 🚫 Qué NO va en Hooks Globales

NO uses `src/hooks/` para:

- ❌ **Hooks específicos de features** → Usar `src/features/[feature]/hooks/`
- ❌ **Lógica de negocio** → Usar hooks en la feature correspondiente
- ❌ **Llamadas a API específicas** → Usar hooks de feature
- ❌ **Estado de features** → Usar hooks de feature

**Ejemplos de lo que NO debe estar aquí:**
```typescript
// ❌ Estos van en features, NO en hooks globales
use-spot-details.ts       // → src/features/spot/hooks/
use-create-review.ts      // → src/features/review/hooks/
use-user-profile.ts       // → src/features/user/hooks/
use-auth.ts              // → src/features/auth/hooks/
```

## 📝 Convenciones

### Nomenclatura de Archivos
- Usar `use-kebab-case.ts`
- Nombre descriptivo del hook
- Ejemplos: `use-debounce.ts`, `use-keyboard-height.ts`

### Nomenclatura de Hooks
- Usar `camelCase` comenzando con `use`
- Ejemplos: `useDebounce`, `useUserLocation`

### Estructura del Hook
```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseMyHookParams {
  // Parámetros del hook
}

interface UseMyHookReturn {
  // Valores retornados
}

/**
 * Description of what the hook does
 * 
 * @param params - Description of parameters
 * @returns Object with hook state and functions
 * 
 * @example
 * ```tsx
 * const { value, error, isLoading } = useMyHook({ param: 'value' });
 * ```
 */
export const useMyHook = (params: UseMyHookParams): UseMyHookReturn => {
  // 1. Estado
  const [state, setState] = useState();
  
  // 2. Callbacks memoizados
  const memoizedCallback = useCallback(() => {
    // Lógica
  }, [dependencies]);
  
  // 3. Efectos
  useEffect(() => {
    // Lógica de efectos
  }, [dependencies]);
  
  // 4. Retorno
  return {
    // Valores y funciones
  };
};
```

### Documentación
- Incluir JSDoc completo
- Documentar parámetros y retorno
- Incluir ejemplos de uso
- Especificar dependencias y efectos secundarios

## 🎯 Hooks Sugeridos para Implementar

Basándose en las necesidades comunes de aplicaciones móviles:

### **useDebounce**
```typescript
/**
 * Debounces a value by a specified delay
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [value, delay]);
  
  return debouncedValue;
};

// Uso:
const searchTerm = 'query';
const debouncedSearch = useDebounce(searchTerm, 500);
```

### **useKeyboardHeight**
```typescript
/**
 * Returns the current keyboard height
 */
export const useKeyboardHeight = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);
  
  return keyboardHeight;
};
```

### **useNetworkStatus**
```typescript
/**
 * Returns the current network connection status
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
  }, []);
  
  return { isConnected };
};
```

### **useAppState**
```typescript
/**
 * Tracks app state (active, background, inactive)
 */
export const useAppState = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);
  
  return appState;
};
```

## 🧪 Testing de Hooks

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useUserLocation } from '../use-user-location';

describe('useUserLocation', () => {
  it('should request location when autoRequest is true', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useUserLocation(true)
    );
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.location).toBeDefined();
  });
  
  it('should handle permission denial', async () => {
    // Mock permission denial
    jest.spyOn(Location, 'requestForegroundPermissionsAsync')
      .mockResolvedValue({ status: 'denied' });
    
    const { result } = renderHook(() => useUserLocation());
    
    await act(async () => {
      await result.current.requestLocation();
    });
    
    expect(result.current.error).toBe('Permiso de ubicación denegado');
  });
});
```

## 📚 Recursos

- Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- Ver [src/features/README-FEATURES.md](../features/README-FEATURES.md) para hooks de features
- [React Hooks Documentation](https://react.dev/reference/react)
- [React Native Hooks](https://reactnative.dev/docs/hooks)

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
