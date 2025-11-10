# README-APP

## 📱 Capa de Aplicación - SpotsSports

### 🎯 Descripción General

La capa `app` es el punto de entrada principal de la aplicación SpotsSports, siguiendo los principios de la arquitectura Bullet-Proof React adaptada para React Native con Expo Router. Esta capa es responsable de:

- **Gestión de rutas**: Manejo del sistema de navegación file-based routing de Expo Router
- **Páginas y comportamiento visual**: Definición de las pantallas principales y su lógica de presentación
- **Configuración global**: Inicialización de providers, contextos y configuraciones de la aplicación
- **Layout y estructura**: Definición de la estructura base de navegación (tabs, stacks, etc.)

### 📁 Estructura de Directorios

```
app/
├── _layout.tsx              # Layout raíz con providers globales
├── index.tsx               # Pantalla principal/splash
├── README-APP.md           # Este archivo de documentación
├── auth/                   # Flujo de autenticación
│   ├── authentication.tsx  # Selector de tipo de autenticación
│   ├── sign-in.tsx        # Pantalla de inicio de sesión
│   └── sign-up.tsx        # Pantalla de registro
├── home-tabs/             # Navegación principal con tabs
│   ├── _layout.tsx        # Layout de tabs
│   ├── my-favorite-spots.tsx  # Spots favoritos del usuario
│   ├── my-feed.tsx        # Feed personalizado
│   ├── my-profile.tsx     # Perfil del usuario
│   └── search-spots.tsx   # Búsqueda de spots deportivos
├── profile/               # Gestión de perfiles
│   ├── [userId].tsx       # Perfil dinámico por ID
│   └── profile-edit.tsx   # Edición de perfil
├── spot/                  # Detalles de spots
│   └── [spotId].tsx      # Página individual de spot (dinámica)
└── test/                  # Componentes de testing
    └── test-component.tsx # Componente de prueba
```

### 🏗️ Patrones de Diseño Implementados

#### 1. **File-Based Routing (Expo Router)**
```tsx
// Estructura de rutas automáticas basada en archivos
app/
├── index.tsx              → /
├── auth/sign-in.tsx       → /auth/sign-in
├── home-tabs/_layout.tsx  → Tab Navigator
└── profile/[userId].tsx   → /profile/:userId
```

#### 2. **Provider Pattern**
```tsx
// _layout.tsx - Configuración de providers globales
export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system">
      <NotificationProvider>
        <UserProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </UserProvider>
      </NotificationProvider>
    </GluestackUIProvider>
  );
}
```

#### 3. **Container/Presentation Pattern**
- Las páginas actúan como containers que orquestan lógica de negocio
- Los componentes UI se mantienen en la capa `components`

### 📋 Convenciones de Desarrollo

#### Nomenclatura de Archivos
- **Páginas**: `kebab-case.tsx` (ej: `sign-in.tsx`, `my-profile.tsx`)
- **Layouts**: `_layout.tsx` para definir estructura de navegación
- **Rutas dinámicas**: `[parametro].tsx` (ej: `[userId].tsx`)
- **README**: `README-APP.md` específico para la capa

#### Estructura de Componentes de Página
```tsx
// Plantilla estándar para páginas
import React from 'react';
import { SafeAreaView } from '@components/ui/safe-area-view';

export default function PageName() {
  // 1. Hooks de navegación
  const router = useRouter();
  
  // 2. Estado local
  const [state, setState] = useState();
  
  // 3. Efectos
  useEffect(() => {
    // Lógica de inicialización
  }, []);
  
  // 4. Handlers de eventos
  const handleAction = () => {
    // Lógica del evento
  };
  
  // 5. Renderizado
  return (
    <SafeAreaView>
      {/* Contenido de la página */}
    </SafeAreaView>
  );
}
```

#### Gestión de Navigation
```tsx
import { useRouter } from 'expo-router';

// Navegación programática
const router = useRouter();
router.push('/auth/sign-in');
router.replace('/home-tabs');
router.back();
```

### 💡 Ejemplos de Código

#### Página con Autenticación
```tsx
// auth/sign-in.tsx
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SignInForm } from '@/src/features/auth/components/sign-in-form';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      await signIn(credentials);
      router.replace('/home-tabs');
    } catch (error) {
      // Manejo de errores
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignInForm 
      onSubmit={handleSignIn} 
      isLoading={isLoading} 
    />
  );
}
```

#### Layout con Tabs
```tsx
// home-tabs/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#0891b2',
      tabBarInactiveTintColor: '#94a3b8',
    }}>
      <Tabs.Screen
        name="search-spots"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

#### Página con Parámetros Dinámicos
```tsx
// profile/[userId].tsx
import { useLocalSearchParams } from 'expo-router';

export default function UserProfile() {
  const { userId } = useLocalSearchParams();
  
  // Usar userId para cargar datos del perfil
  return (
    <ProfileView userId={userId as string} />
  );
}
```

### ⚠️ Manejo de Errores y Validaciones

#### Error Boundaries
```tsx
// Implementar en _layout.tsx si es necesario
import { ErrorBoundary } from '@/src/components/commons/error-boundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      {/* Providers y navegación */}
    </ErrorBoundary>
  );
}
```

#### Validación de Rutas
```tsx
// Middleware de autenticación
import { useUser } from '@/src/entities/user/hooks/use-user';
import { Redirect } from 'expo-router';

export default function ProtectedPage() {
  const { user, isLoading } = useUser();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect href="/auth/authentication" />;
  
  return <PageContent />;
}
```

#### Manejo de Estados de Carga
```tsx
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setIsLoading(true);
  setError(null);
  // Operación asíncrona
} catch (err) {
  setError(err.message);
} finally {
  setIsLoading(false);
}
```

### 🧪 Testing

#### Pruebas de Páginas
```tsx
// __tests__/auth/sign-in.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import SignIn from '@/src/app/auth/sign-in';

describe('SignIn Page', () => {
  it('should navigate to sign-up when link is pressed', () => {
    const mockPush = jest.fn();
    jest.mock('expo-router', () => ({
      useRouter: () => ({ push: mockPush }),
    }));

    const { getByText } = render(<SignIn />);
    fireEvent.press(getByText('Create Account'));
    
    expect(mockPush).toHaveBeenCalledWith('/auth/sign-up');
  });
});
```

#### Pruebas de Navegación
```tsx
// Testear rutas dinámicas
import { useLocalSearchParams } from 'expo-router';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ userId: 'test-user-id' }),
}));
```

#### Pruebas de Integration
```tsx
// Testear flujo completo de autenticación
describe('Authentication Flow', () => {
  it('should redirect to home after successful login', async () => {
    // Simular login exitoso
    // Verificar redirección a /home-tabs
  });
});
```

### 📚 Recursos Adicionales

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Navigation Patterns](https://reactnavigation.org/docs/navigating)
- [Bullet-Proof React Architecture](https://github.com/alan2207/bulletproof-react)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo CLI Commands](https://docs.expo.dev/workflow/expo-cli/)

### 🔄 Changelog

#### ✅ Funcionalidades Actuales (v1.0.0)

**Autenticación**
- [x] Pantalla de selección de tipo de autenticación
- [x] Formulario de inicio de sesión
- [x] Formulario de registro
- [x] Navegación automática post-autenticación

**Navegación Principal**
- [x] Tab navigator con 4 pestañas principales
- [x] Búsqueda de spots deportivos
- [x] Gestión de spots favoritos
- [x] Feed personalizado del usuario
- [x] Perfil de usuario

**Gestión de Perfiles**
- [x] Visualización de perfil por ID dinámico
- [x] Pantalla de edición de perfil

**Spots Deportivos**
- [x] Página de detalles de spot
- [x] Estructura base para información de spots




