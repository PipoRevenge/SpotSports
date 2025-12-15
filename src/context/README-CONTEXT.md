# Context - Contextos React Globales

## 📦 Propósito

La carpeta `src/context` contiene **React Context providers** que manejan estado global compartido en toda la aplicación. Los contextos proporcionan una forma de compartir datos entre componentes sin prop drilling.

## 🎯 ¿Qué va en Context?

Los contextos en esta carpeta deben:
- ✅ **Estado global verdaderamente necesario** - usado en múltiples partes de la app
- ✅ **Estado de aplicación** - no específico de una feature
- ✅ **Cross-cutting concerns** - funcionalidad que cruza múltiples features

## 🚨 Restricción Importante

**No abusar de Context**. Usar Context solo cuando:
- El estado es necesario en múltiples niveles del árbol de componentes
- Prop drilling se vuelve excesivo (3+ niveles)
- El estado es verdaderamente global (ej: usuario actual, tema, notificaciones)

Para estado de features específicas, usar hooks locales en la feature.

## 📁 Estructura Actual

```
context/
├── app-alert-context.tsx         # Sistema de notificaciones global (notification / AppAlert)
├── map-search-context.tsx        # Gestión de ubicación de usuario y estado del mapa
├── selected-spot-context.tsx     # Gestión del spot seleccionado en el mapa
└── user-context.tsx              # Gestión del usuario autenticado
```

## 🔔 Contexts Disponibles

### **MapSearchContext** 🗺️

**Archivo**: `map-search-context.tsx`

Context centralizado para gestionar la ubicación del usuario y el estado del mapa de búsqueda. Elimina la necesidad de múltiples llamadas a `useUserLocation`.

**Interfaz:**
```typescript
interface MapSearchContextValue {
  // User Location
  userLocation: GeoPoint | null;
  isLoadingUserLocation: boolean;
  locationError: string | null;
  requestUserLocation: () => Promise<void>;
  
  // Map Region
  visibleRegion: Region | null;
  setVisibleRegion: (region: Region) => void;
  regionKey: string;
  regionBounds: { minLat, maxLat, minLng, maxLng } | null;
  
  // Navigation
  followsUserLocation: boolean;
  setFollowsUserLocation: (follows: boolean) => void;
  centerOnUser: () => void;
  
  // Prefetch
  prefetchSpotBasic: (spotId: string) => Promise<void>;
  prefetchSpotFull: (spotId: string) => Promise<void>;
}
```

**Uso:**
```tsx
import { useMapSearch } from '@/src/context/map-search-context';

function MapScreen() {
  const { userLocation, isLoadingUserLocation, centerOnUser } = useMapSearch();
  
  return (
    <View>
      <MapView showsUserLocation={true} />
      <Button onPress={centerOnUser}>Center on Me</Button>
    </View>
  );
}
```

### **Notification / AppAlert Context** 🔔

**Archivo**: `app-alert-context.tsx`

Sistema de notificaciones global para mostrar mensajes de error, éxito e información en toda la aplicación.

**Interfaz:**
```typescript
interface AppAlertContextType {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConfirm: (title: string, message: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
  showActionSheet: (title: string | undefined, message: string | undefined, options: { key: string; label: string }[]) => Promise<string | null>;
}
```

**Uso:**

```typescript
import { useAppAlert } from '@/src/context/app-alert-context';

function MyComponent() {
  const { showError, showSuccess, showInfo, showConfirm, showActionSheet } = useAppAlert();
  
  const handleAction = async () => {
    try {
      await someAction();
      showSuccess('Acción completada exitosamente');
    } catch (error) {
      showError('Error al realizar la acción', 'Error');
    }
  };
  
  return <Button onPress={handleAction}>Ejecutar</Button>;
}
```

**Características:**
- ✅ Gestión centralizada de notificaciones
- ✅ Tipos de notificación: error, success, info
- ✅ Títulos personalizables
- ✅ Modal de error integrado
- ✅ Cierre automático y manual

**Provider:**
```typescript
// En src/app/_layout.tsx
import { AppAlertProvider } from '@/src/context/app-alert-context';

export default function RootLayout() {
  return (
    <AppAlertProvider>
      {/* App content */}
    </AppAlertProvider>
  );
}
```

**Implementación Actual:**
- Implementa `AppAlertErrorModal`, toasts para success/info (`AppAlertToast`), `AppAlertConfirmDialog` y `AppAlertChoiceSheet`
- `showError` -> Modal (AppAlertErrorModal)
- `showSuccess` / `showInfo` -> toasts (`AppAlertToast`) (auto dismiss)
- `showConfirm` -> AppAlertConfirmDialog (returns Promise<boolean>)
- `showActionSheet` -> AppAlertChoiceSheet (returns selection or null)

### **SelectedSpotContext** 📍

**Archivo**: `selected-spot-context.tsx`

Gestiona el spot actualmente seleccionado en el mapa, permitiendo sincronización entre el mapa y otros componentes de la interfaz.

**Interfaz:**
```typescript
interface SelectedSpotContextType {
  selectedSpotId: string | null;
  setSelectedSpotId: (spotId: string | null) => void;
  clearSelectedSpot: () => void;
}
```

**Uso:**

```typescript
import { useSelectedSpot } from '@/src/context/selected-spot-context';

function MapComponent() {
  const { selectedSpotId, setSelectedSpotId } = useSelectedSpot();
  
  const handleMarkerPress = (spotId: string) => {
    setSelectedSpotId(spotId);
  };
  
  return (
    <MapView>
      {spots.map(spot => (
        <Marker
          key={spot.id}
          onPress={() => handleMarkerPress(spot.id)}
          selected={selectedSpotId === spot.id}
        />
      ))}
    </MapView>
  );
}

function SpotDetailsBottomSheet() {
  const { selectedSpotId, clearSelectedSpot } = useSelectedSpot();
  
  if (!selectedSpotId) return null;
  
  return (
    <BottomSheet onClose={clearSelectedSpot}>
      <SpotDetails spotId={selectedSpotId} />
    </BottomSheet>
  );
}
```

**Características:**
- ✅ Estado compartido del spot seleccionado
- ✅ Sincronización entre mapa y detalles
- ✅ Función de limpieza conveniente

**Usado en:**
- Feature de búsqueda en mapa
- Bottom sheet de detalles de spot
- Navegación entre spots

## 🔄 Flujo de Context

```
Context Provider (App Root)
         ↓
    Context Value
         ↓
┌────────┼────────┬────────┐
│        │        │        │
Features Components Pages  Hooks
(useContext hook)
```

## 📝 Estructura de un Context

Estructura estándar para crear un nuevo contexto:

```typescript
import React, { createContext, ReactNode, useContext, useState } from 'react';

// 1. Definir tipos
interface MyContextData {
  value: string;
  count: number;
}

interface MyContextType {
  data: MyContextData;
  updateData: (newData: MyContextData) => void;
  increment: () => void;
}

// 2. Crear contexto con valor por defecto undefined
const MyContext = createContext<MyContextType | undefined>(undefined);

// 3. Crear Provider
interface MyProviderProps {
  children: ReactNode;
}

export const MyProvider: React.FC<MyProviderProps> = ({ children }) => {
  // Estado
  const [data, setData] = useState<MyContextData>({
    value: '',
    count: 0,
  });
  
  // Funciones
  const updateData = (newData: MyContextData) => {
    setData(newData);
  };
  
  const increment = () => {
    setData(prev => ({ ...prev, count: prev.count + 1 }));
  };
  
  // Memoizar valor si es necesario (para optimización)
  const value = React.useMemo(
    () => ({ data, updateData, increment }),
    [data]
  );
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

// 4. Crear hook personalizado
export const useMyContext = (): MyContextType => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

## ✅ Cuándo Crear un Context

Crea un nuevo contexto cuando:

- ✅ **Estado global necesario** - múltiples componentes necesitan el mismo estado
- ✅ **Prop drilling excesivo** - pasando props por 3+ niveles
- ✅ **Cross-feature state** - estado compartido entre features independientes
- ✅ **App-wide functionality** - funcionalidad que toda la app necesita

**Ejemplos válidos:**
- 👤 Usuario actual autenticado
- 🎨 Tema de la aplicación (light/dark)
- 🔔 Sistema de notificaciones
- 🌐 Configuración de idioma (i18n)
- 📡 Estado de la conexión
- 📍 Ubicación del usuario

## 🚫 Cuándo NO Usar Context

NO uses Context para:

- ❌ **Estado de componente** - usar `useState` local
- ❌ **Estado de feature** - usar hooks en la feature
- ❌ **Server state** - usar React Query o SWR
- ❌ **Optimización prematura** - empezar con props, refactorizar si es necesario
- ❌ **Estado que cambia frecuentemente** - puede causar re-renders innecesarios

**Alternativas:**
```typescript
// ❌ Context para estado local
<ThemeContext> // Solo si afecta a toda la app

// ✅ useState para estado local
const [theme, setTheme] = useState('light');

// ❌ Context para datos de servidor
<SpotsContext> // Los datos de spots vienen de la API

// ✅ Hook de feature para datos de servidor
const { spots } = useSpotList();
```

## 📝 Convenciones

### Nomenclatura
- **Archivos**: `kebab-case-context.tsx`
- **Context**: `PascalCaseContext`
- **Provider**: `PascalCaseProvider`
- **Hook**: `usePascalCase`

```typescript
// app-alert-context.tsx
const AppAlertContext = ...
export const AppAlertProvider = ...
export const useAppAlert = ...
```

### Organización
Cada archivo de contexto debe incluir:
1. Tipos (interfaces)
2. Creación del contexto
3. Provider component
4. Hook personalizado

### Documentación
```typescript
/**
 * AppAlertContext provides global notification system
 * 
 * @example
 * ```tsx
 * const { showError } = useAppAlert();
 * showError('Something went wrong');
 * ```
 */
export const AppAlertProvider = ...
```

## 🎯 Contexts Sugeridos

Basándose en necesidades comunes de aplicaciones:

### **ThemeContext** 🎨
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### **AuthContext** (Nota: Ya existe en entities/user/context) 👤
Si se mueve a contextos globales:
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### **I18nContext** 🌐
```typescript
interface I18nContextType {
  locale: string;
  t: (key: string) => string;
  changeLocale: (locale: string) => void;
}
```

## 🔄 Composición de Providers

En `src/app/_layout.tsx`, componer múltiples providers:

```typescript
export default function RootLayout() {
  return (
    <AppAlertProvider>
      <ThemeProvider>
        <AuthProvider>
          <I18nProvider>
            {/* App content */}
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppAlertProvider>
  );
}
```

**Optimización**: Crear un `AppProviders` componente:
```typescript
// src/context/app-providers.tsx
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AppAlertProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </AppAlertProvider>
  );
};
```

## ⚡ Optimización de Performance

### 1. **Memoización del Valor**
```typescript
const value = React.useMemo(
  () => ({ state, setState, action }),
  [state] // Solo re-crear cuando state cambia
);
```

### 2. **Separar Contextos**
Si el estado cambia con frecuencias diferentes, separar en múltiples contextos:

```typescript
// ❌ Un solo contexto con estado mixto
<AppContext value={{ user, theme, notifications }}>

// ✅ Contextos separados
<UserContext>
  <ThemeContext>
    <AppAlertContext>
```

### 3. **Usar Selectores**
Para evitar re-renders innecesarios, considerar usar una librería como `use-context-selector`.

## 🧪 Testing de Contexts

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { AppAlertProvider, useAppAlert } from '../app-alert-context';

describe('AppAlertContext', () => {
  it('should show error notification', () => {
    const { result } = renderHook(() => useAppAlert(), {
      wrapper: AppAlertProvider,
    });
    
    act(() => {
      result.current.showError('Test error');
    });
    
    // Verificar que se muestra el error
    // (depende de la implementación)
  });
});
```

## 📚 Recursos

- Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- [React Context Documentation](https://react.dev/reference/react/useContext)
- [When to use Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Context Performance Tips](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
