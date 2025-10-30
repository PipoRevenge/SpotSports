# README-FEATURES

## 🏗️ Capa de Features - SpotsSports

### 🎯 Descripción General

La capa `features` implementa la arquitectura **Feature-Driven Development (FDD)** siguiendo los principios de Bullet-Proof React. Cada feature es un módulo independiente y autocontenido que encapsula toda la lógica relacionada con una funcionalidad específica del dominio de negocio.

### 🧩 Principios Fundamentales

- **Encapsulación**: Cada feature contiene su propia lógica, componentes, hooks y tipos
- **Reutilización**: Componentes diseñados para ser utilizados en múltiples contextos
- **Separación de responsabilidades**: Clara división entre UI, lógica de negocio y estado
- **Testabilidad**: Estructura que facilita las pruebas unitarias e integración
- **Escalabilidad**: Fácil adición de nuevas features sin afectar las existentes

### 📁 Estructura de Features

```
features/
├── auth/                    # 🔐 Autenticación y autorización
│   ├── index.ts            # Exportaciones públicas
│   ├── components/         # Componentes de UI
│   ├── hooks/             # Hooks personalizados
│   ├── types/             # Definiciones de tipos
│   └── utils/             # Utilidades y validaciones
├── reviews/               # ⭐ Sistema de reseñas
├── sport/                 # 🏃 Gestión de deportes
├── spot/                  # 📍 Gestión de spots deportivos
└── user-profile/          # 👤 Perfiles de usuario
    ├── index.ts
    ├── README.md          # Documentación específica
    ├── components/
    ├── hooks/
    ├── types/
    └── utils/
```

## 🏗️ Proceso de Creación de una Feature

### 1. **Estructura Base**

Cada feature debe seguir esta estructura estándar:

```
feature-name/
├── index.ts              # 📤 Exportaciones públicas
├── README.md             # 📖 Documentación específica
├── components/           # 🧩 Componentes de UI
│   ├── feature-main.tsx
│   ├── feature-form.tsx
│   └── feature-item.tsx
├── hooks/               # 🎣 Hooks personalizados
│   ├── use-feature.ts
│   └── use-feature-mutation.ts
├── types/               # 📝 Definiciones de tipos
│   └── feature-types.ts
├── utils/               # 🛠️ Utilidades
│   ├── feature-validations.ts
│   └── feature-helpers.ts

```

### 2. **Paso a Paso: Crear una Nueva Feature**

#### **Paso 1: Crear la estructura base**
```bash
# Crear directorios
mkdir src/features/nueva-feature
mkdir src/features/nueva-feature/components
mkdir src/features/nueva-feature/hooks
mkdir src/features/nueva-feature/types
mkdir src/features/nueva-feature/utils
```

#### **Paso 2: Definir tipos TypeScript**
```typescript
// types/nueva-feature-types.ts
export interface NuevaFeature {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NuevaFeatureFormData {
  name: string;
  description: string;
}

export interface NuevaFeatureFilters {
  search?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```

#### **Paso 3: Crear hooks personalizados (que contengan la logica de negocio por un lado y por el otro lo demas)**
```typescript
// hooks/use-nueva-feature.ts
import { useState, useEffect } from 'react';
import { NuevaFeature } from '../types/nueva-feature-types';

export const useNuevaFeature = (id: string) => {
  const [feature, setFeature] = useState<NuevaFeature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeature = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // API call logic
        const data = await fetchNuevaFeatureById(id);
        setFeature(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeature();
  }, [id]);

  return { feature, isLoading, error };
};
```

#### **Paso 4: Implementar validaciones con Zod**
All validations should use Zod for consistency and type safety:

```typescript
// utils/nueva-feature-validations.ts
import { z } from 'zod';

export const nuevaFeatureSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description cannot exceed 500 characters'),
});

export const validateNuevaFeature = (data: unknown) => {
  return nuevaFeatureSchema.safeParse(data);
};
```

#### **Paso 5: Crear componentes reutilizables que tengan en se encargue exclusivamente de la vista y de como se comporta**
```tsx
// components/nueva-feature-card.tsx
import React from 'react';
import { Card } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { NuevaFeature } from '../types/nueva-feature-types';

interface NuevaFeatureCardProps {
  feature: NuevaFeature;
  onPress?: (feature: NuevaFeature) => void;
  showActions?: boolean;
}

export const NuevaFeatureCard: React.FC<NuevaFeatureCardProps> = ({
  feature,
  onPress,
  showActions = true,
}) => {
  return (
    <Card onPress={() => onPress?.(feature)}>
      <Text className="text-lg font-bold">{feature.name}</Text>
      <Text className="text-gray-600">{feature.description}</Text>
      {showActions && (
        <View className="mt-2">
          {/* Botones de acción */}
        </View>
      )}
    </Card>
  );
};
```

#### **Paso 6: Crear archivo de exportaciones**
```typescript
// index.ts
// Componentes
export { NuevaFeatureCard } from './components/nueva-feature-card';
export { NuevaFeatureForm } from './components/nueva-feature-form';
export { NuevaFeatureList } from './components/nueva-feature-list';

// Hooks
export { useNuevaFeature } from './hooks/use-nueva-feature';
export { useNuevaFeatureMutation } from './hooks/use-nueva-feature-mutation';

// Tipos
export * from './types/nueva-feature-types';

// Utilidades
export { validateNuevaFeature } from './utils/nueva-feature-validations';
```

## 🧩 Anatomía de una Feature

### **Components** 🎨
Componentes de UI específicos de la feature:

```tsx
// Patrón de nomenclatura: [feature-name]-[component-type].tsx
spot-card.tsx           // Tarjeta individual
spot-list.tsx          // Lista de elementos  
spot-form.tsx          // Formularios
spot-details.tsx       // Vista de detalles
spot-filters.tsx       // Componentes de filtrado
```

**Principios para componentes:**
- **Reutilizables**: Diseñados para múltiples contextos
- **Controlados**: Props explícitas para comportamiento
- **Accesibles**: Implementar testID y accesibilidad
- **Performantes**: Memoización cuando sea necesario

### **Hooks** 🎣
Lógica de estado y efectos reutilizable:

```tsx
// Patrones comunes de hooks
use-[feature].ts           // Obtener datos
use-[feature]-mutation.ts  // Mutaciones (create, update, delete)
use-[feature]-filters.ts   // Lógica de filtrado
use-[feature]-validation.ts // Validaciones en tiempo real
```

**Tipos de hooks:**
- **Data fetching**: `useSpot`, `useSpotList`
- **Mutations**: `useCreateSpot`, `useUpdateSpot`
- **Form handling**: `useSpotForm`, `useSpotValidation`
- **UI state**: `useSpotFilters`, `useSpotSelection`

### **Types** 📝
Definiciones de tipos TypeScript:

```typescript
// Estructura típica de tipos
export interface Feature {
  // Propiedades principales
}

export interface FeatureFormData {
  // Datos para formularios
}

export interface FeatureFilters {
  // Filtros de búsqueda
}

export interface FeatureApiResponse {
  // Respuestas de API
}

export enum FeatureStatus {
  // Estados posibles
}
```

### **Utils** 🛠️
Utilidades y funciones auxiliares:

```typescript
// Tipos de utilidades
validations.ts    // Esquemas de validación
helpers.ts        // Funciones auxiliares
formatters.ts     // Formateo de datos
constants.ts      // Constantes específicas
```

## 📋 Convenciones de Desarrollo

### **Nomenclatura**
- **Archivos**: `kebab-case.tsx/ts`
- **Componentes**: `PascalCase`
- **Hooks**: `camelCase` comenzando con `use`
- **Tipos**: `PascalCase` con sufijos descriptivos
- **Constantes**: `SCREAMING_SNAKE_CASE`

### **Estructura de Componentes**
```tsx
// Plantilla estándar para componentes de feature
import React from 'react';
import { ComponentProps } from './types';

interface FeatureComponentProps extends ComponentProps {
  // Props específicas
}

export const FeatureComponent: React.FC<FeatureComponentProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // 1. Hooks del sistema
  const router = useRouter();
  
  // 2. Hooks de la feature
  const { data, isLoading } = useFeatureData();
  
  // 3. Estado local
  const [localState, setLocalState] = useState();
  
  // 4. Efectos
  useEffect(() => {
    // Lógica de efectos
  }, []);
  
  // 5. Handlers
  const handleAction = () => {
    // Lógica del handler
  };
  
  // 6. Early returns
  if (isLoading) return <LoadingComponent />;
  if (error) return <ErrorComponent error={error} />;
  
  // 7. Renderizado principal
  return (
    <View>
      {/* JSX */}
    </View>
  );
};

// 8. Configuración por defecto
FeatureComponent.defaultProps = {
  // Props por defecto
};
```

### **Gestión de Estado**
```tsx
// Patrón para hooks de mutación
export const useCreateFeature = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeature = async (data: FeatureFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.createFeature(data);
      
      // Notificación de éxito
      showSuccess('Feature creada exitosamente');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createFeature, isLoading, error };
};
```

## 💡 Ejemplos Prácticos

### **Feature de Autenticación**
```tsx
// auth/components/sign-in-form.tsx
export const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const { signIn, isLoading } = useSignIn();
  
  const handleSubmit = async (data: SignInData) => {
    try {
      await signIn(data);
      onSuccess?.();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </Form>
  );
};
```

### **Feature de Spots**
```tsx
// spot/components/spot-list.tsx
export const SpotList = ({ filters }: SpotListProps) => {
  const { spots, isLoading, error } = useSpotList(filters);
  
  if (isLoading) return <SpotListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <FlatList
      data={spots}
      renderItem={({ item }) => (
        <SpotCard 
          spot={item} 
          onPress={() => navigateToSpot(item.id)} 
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
};
```

## ⚠️ Manejo de Errores

### **Error Boundaries por Feature**
```tsx
// components/feature-error-boundary.tsx
export const FeatureErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <FeatureErrorFallback error={error} onRetry={resetError} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### **Validación en Tiempo Real**
```tsx
// hooks/use-feature-validation.ts
export const useFeatureValidation = (data: FeatureFormData) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const validate = useCallback(() => {
    const result = validateFeature(data);
    setErrors(result.errors || {});
    return result.success;
  }, [data]);
  
  useEffect(() => {
    const timeoutId = setTimeout(validate, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [validate]);
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};
```

## 🧪 Testing de Features

### **Testing de Componentes**
```tsx
// __tests__/components/spot-card.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { SpotCard } from '../components/spot-card';

describe('SpotCard', () => {
  const mockSpot = {
    id: '1',
    name: 'Test Spot',
    description: 'Test Description',
  };

  it('should render spot information', () => {
    const { getByText } = render(<SpotCard spot={mockSpot} />);
    expect(getByText('Test Spot')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SpotCard spot={mockSpot} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('spot-card'));
    expect(onPress).toHaveBeenCalledWith(mockSpot);
  });
});
```

### **Testing de Hooks**
```tsx
// __tests__/hooks/use-spot.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useSpot } from '../hooks/use-spot';

describe('useSpot', () => {
  it('should fetch spot data', async () => {
    const { result } = renderHook(() => useSpot('spot-1'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.spot).toBeDefined();
  });
});
```

### **Testing de Integration**
```tsx
// __tests__/integration/spot-flow.test.tsx
describe('Spot Feature Integration', () => {
  it('should create, view and delete spot', async () => {
    // Test completo del flujo de la feature
  });
});
```

## 📚 Recursos y Referencias

### **Documentación**
- [Bullet-Proof React](https://github.com/alan2207/bulletproof-react)
- [Feature-Driven Development](https://en.wikipedia.org/wiki/Feature-driven_development)
- [React Patterns](https://reactpatterns.com/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)

### **Herramientas Recomendadas**
- **Validación**: Zod, Yup
- **Testing**: Jest, React Native Testing Library
- **Estado**: Zustand, React Query
- **Formularios**: React Hook Form

## 🔄 Changelog y Roadmap

### ✅ **Features Implementadas (v1.0.0)**

#### **Auth Feature**
- [x] Componentes de autenticación (SignIn, SignUp, AuthSelector)
- [x] Hooks de autenticación (useSignIn, useSignOut, useSignUp)
- [x] Validación de username en tiempo real
- [x] Gestión de errores y estados de carga

#### **User Profile Feature**
- [x] Visualización de perfil propio y ajeno
- [x] Formulario de edición de perfil
- [x] Header de perfil con estadísticas
- [x] Hooks para gestión de perfil
- [x] Validaciones de datos de perfil

#### **Spot Feature**
- [x] Tarjetas de spots (SpotCard)
- [x] Formulario de creación de spots
- [x] Componente de detalles de spot
- [x] Puntos en mapa para spots

#### **Sport Feature**
- [x] Tabla de deportes para spots
- [x] Componentes base de deportes

### 🚧 **Próximas Implementaciones (v1.1.0)**

#### **Reviews Feature**
- [ ] Sistema completo de reseñas
- [ ] Componentes de rating y comentarios
- [ ] Hooks para CRUD de reviews
- [ ] Validaciones de contenido

#### **Notifications Feature**
- [ ] Sistema de notificaciones push
- [ ] Notificaciones in-app
- [ ] Configuración de preferencias

#### **Social Feature**
- [ ] Sistema de seguimiento entre usuarios
- [ ] Feed social personalizado
- [ ] Interacciones (likes, shares)

### 📋 **Backlog (v2.0.0)**

#### **Advanced Search Feature**
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Geolocalización y búsqueda por proximidad
- [ ] Historial de búsquedas

#### **Booking Feature**
- [ ] Sistema de reservas de spots
- [ ] Calendario de disponibilidad
- [ ] Gestión de cancelaciones

#### **Analytics Feature**
- [ ] Dashboard de estadísticas
- [ ] Métricas de uso de spots
- [ ] Reportes personalizados

#### **Chat Feature**
- [ ] Mensajería en tiempo real
- [ ] Chat grupal por spots
- [ ] Notificaciones de mensajes

## 🏆 Mejores Prácticas

### **Performance**
- Implementar lazy loading para features pesadas
- Usar React.memo para componentes que no cambian frecuentemente
- Implementar virtualization para listas largas
- Optimizar imágenes y recursos multimedia

### **Accesibilidad**
- Agregar testID a todos los componentes interactivos
- Implementar labels descriptivos
- Soporte para lectores de pantalla
- Navegación por teclado

### **Internacionalización**
- Preparar strings para traducción
- Formateo de fechas y números por región
- RTL support cuando sea necesario

### **Seguridad**
- Validación tanto en cliente como servidor
- Sanitización de inputs
- Gestión segura de tokens de autenticación
- Logging de acciones críticas

---

**Última actualización**: Octubre 2025  
**Versión del documento**: 1.0.0  
**Mantenido por**: Equipo de Frontend SpotsSports