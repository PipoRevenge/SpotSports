# Profile Feature ✅

Esta feature implementa la funcionalidad de perfiles de usuario siguiendo los principios de **bullet-proof-react** para crear componentes reutilizables y mantenibles.

**🚀 Estado actual:** Funcionalidad de **editar perfil completamente integrada** con API real y Firebase.

## Estructura

```
src/features/profile/
├── components/           # Componentes de UI
│   ├── profile.tsx       # Componente principal reutilizable
│   ├── profile-header.tsx # Header con información básica
│   └── profile-edit.tsx  # Formulario de edición
├── hooks/               # Hooks personalizados
│   ├── use-profile.ts   # Hook para obtener perfil
│   └── use-update-profile.ts # Hook para actualizar perfil
├── types/               # Tipos TypeScript
│   └── index.ts
├── utils/               # Utilidades
│   ├── profile-validation.ts # Validaciones
│   └── profile-date-utils.ts # Utilidades de fecha
└── index.ts            # Exportaciones principales
```

## Componentes

### Profile
Componente principal reutilizable que puede mostrar:
- Perfil propio (`ProfileActionType.VIEW_OWN`)
- Perfil de otro usuario (`ProfileActionType.VIEW_OTHER`)

**Props:**
- `userId?: string` - ID del usuario (opcional, usa el usuario actual si no se proporciona)
- `actionType?: ProfileActionType` - Tipo de vista
- `showActions?: boolean` - Mostrar botones de acción
- `showStats?: boolean` - Mostrar estadísticas

### ProfileHeader
Header con información básica del usuario, foto, estadísticas y botones de acción.

### ProfileEdit
Formulario para editar información del perfil con validación en tiempo real.

## Hooks

### useProfile
Hook para obtener información de perfil con soporte para:
- Perfil propio
- Perfil de otros usuarios
- Estados de carga y error
- Refetch manual

*⚠️ Pendiente: Implementar integración con API*

### useUpdateProfile ✅
Hook **completamente integrado** para actualizar información del perfil con:
- ✅ **API Integration** - Utiliza `userRepository.updateUserProfile()`
- ✅ **Validación automática** - Valida datos antes del envío
- ✅ **Estados de carga** - `isUpdating` state para UI feedback
- ✅ **Manejo de errores** - Error handling robusto con mensajes descriptivos
- ✅ **Firebase Persistence** - Cambios se guardan en Firestore
- ✅ **Context Update** - Actualiza automáticamente el contexto del usuario

## Tipos

La feature define tipos TypeScript para:
- Props de componentes
- Estados de la aplicación
- Configuración
- Enums para acciones y estados

## Utilidades

### Validación
- Validación de nombre completo
- Validación de biografía
- Validación de teléfono
- Validación de fecha de nacimiento
- Formateo de datos

### Fechas
- Formateo de fechas para mostrar
- Cálculo de edad
- Fechas relativas
- Validación de fechas

## Uso

### Ver perfil propio
```tsx
import { Profile, ProfileActionType } from '@/src/features/profile';
import { router } from 'expo-router';

const handleNavigateToEdit = () => {
  router.push('/profile/profile-edit');
};

const handleNavigateToUser = (userId: string) => {
  router.push(`/profile/${userId}`);
};

<Profile 
  actionType={ProfileActionType.VIEW_OWN}
  showActions={true}
  showStats={true}
  onNavigateToEdit={handleNavigateToEdit}
  onNavigateToUser={handleNavigateToUser}
/>
```

### Ver perfil de otro usuario
```tsx
import { Profile, ProfileActionType } from '@/src/features/profile';
import { router } from 'expo-router';

const handleNavigateToUser = (userId: string) => {
  router.push(`/profile/${userId}`);
};

const handleBack = () => {
  router.back();
};

<Profile 
  userId="user-id-123"
  actionType={ProfileActionType.VIEW_OTHER}
  showActions={true}
  showStats={true}
  onNavigateToUser={handleNavigateToUser}
  onBack={handleBack}
/>
```

### Editar perfil
```tsx
import { ProfileEdit } from '@/src/features/profile';
import { router } from 'expo-router';

const handleSave = () => {
  router.back(); // Navegar de vuelta después de guardar
};

const handleCancel = () => {
  router.back(); // Navegar de vuelta sin guardar
};

<ProfileEdit 
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### Usar hooks individualmente
```tsx
import { useProfile, useUpdateProfile } from '@/src/features/profile';

const { user, isLoading, error, refetch } = useProfile(userId);
const { updateProfile, isUpdating } = useUpdateProfile();
```

## Navegación

La feature incluye páginas de ejemplo:
- `/home-tabs/my-profile` - Perfil propio
- `/profile/[userId]` - Perfil de otro usuario
- `/profile/profile-edit` - Edición de perfil

## Patrón de Navegación

La feature de perfil utiliza **inversión de dependencia** para la navegación. Los componentes no conocen sobre las rutas específicas, sino que reciben callbacks que la aplicación define:

### Callbacks disponibles:

- `onNavigateToEdit?: () => void` - Navegar a edición de perfil
- `onNavigateToUser?: (userId: string) => void` - Navegar a perfil de usuario
- `onBack?: () => void` - Navegar hacia atrás

### Ventajas:

- ✅ **Desacoplamiento** - Los componentes no dependen de rutas específicas
- ✅ **Reutilización** - Mismo componente puede usarse con diferentes sistemas de navegación
- ✅ **Testabilidad** - Fácil de mockear en tests
- ✅ **Flexibilidad** - La app controla completamente la navegación

## Características

✅ **Reutilizable** - Componentes que funcionan para perfil propio y ajeno
✅ **Type-safe** - Tipado completo con TypeScript
✅ **Validación** - Validación robusta de datos de entrada
✅ **Estados de carga** - Manejo de estados de carga y error
✅ **Responsive** - Interfaz adaptable
✅ **Modular** - Arquitectura modular siguiendo bullet-proof-react
✅ **Extensible** - Fácil de extender con nuevas características
✅ **Estructura simple** - Sin archivos index intermedios, solo el principal de la feature
✅ **Navegación desacoplada** - Los componentes no conocen sobre rutas específicas
✅ **API Integration** - Conectado con Firebase a través del patrón Repository
✅ **Real-time Updates** - Cambios persisten inmediatamente en la base de datos
✅ **Photo Upload** - Soporte completo para subida de fotos de perfil

## Integración con API

✅ **API Completamente Integrada** - La funcionalidad de editar perfil ahora utiliza la API real

### useUpdateProfile Hook
- ✅ **Implementado** - Utiliza `userRepository.updateUserProfile()` 
- ✅ **Firebase Integration** - Persistencia real en Firestore
- ✅ **Error Handling** - Manejo robusto de errores de la API
- ✅ **Data Validation** - Validación antes del envío a la API
- ✅ **User Context Update** - Actualización automática del contexto tras cambios

### Campos Editables
- ✅ `fullName` - Nombre completo del usuario
- ✅ `bio` - Biografía personal
- ✅ `phoneNumber` - Número de teléfono
- ✅ `photoURL` - URL de foto de perfil (con soporte para upload)

### Seguridad
- 🔒 `birthDate` - **No editable** por razones de seguridad
- 🔒 `email` - Gestionado a través de autenticación
- 🔒 `userName` - Requiere validación especial

### Arquitectura API
La feature utiliza el **patrón Repository** implementado en `src/api/`:

```typescript
// Hook utiliza la API directamente
import { userRepository } from '@/src/api';

// Llamada a la API
const updatedUser = await userRepository.updateUserProfile(user.id, updateData);
```

**Flujo de datos:**
1. **Validación local** - `validateProfileData()` valida antes del envío
2. **Estructuración** - Datos se formatean como `Partial<User>`
3. **API Call** - `userRepository.updateUserProfile()` maneja Firebase
4. **Persistencia** - Firebase Firestore almacena los cambios
5. **Response** - API devuelve el usuario actualizado
6. **Context Update** - Se actualiza el contexto automáticamente

**Ventajas del patrón Repository:**
- ✅ **Desacoplamiento** - La feature no conoce detalles de Firebase
- ✅ **Testabilidad** - Fácil de mockear para tests
- ✅ **Mantenibilidad** - Cambios en la API no afectan la feature
- ✅ **Reutilización** - Mismo repositorio usado por otras features

## TODOs

- [x] ~~Implementar llamadas reales a la API~~ ✅ **COMPLETADO**
- [x] ~~Añadir soporte para cambio de foto de perfil~~ ✅ **COMPLETADO**
- [ ] Implementar sistema de seguimiento (follow/unfollow)
