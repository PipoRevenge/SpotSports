# Spot Feature - README

## 📍 Feature de Spots Deportivos

### 🎯 Descripción General

La feature `spot` implementa toda la funcionalidad relacionada con la creación, gestión y visualización de spots deportivos en SpotsSports. Esta feature sigue los principios de Bullet-Proof React y encapsula toda la lógica de negocio relacionada con spots deportivos.

### 📁 Estructura de Archivos

```
spot/
├── index.ts                    # Exportaciones públicas
├── README.md                   # Este archivo
├── components/                 # Componentes UI
│   ├── spot-create-form.tsx   # Formulario de creación ✅
│   ├── spot-data-details.tsx  # Detalles del spot
│   └── spot-map-point.tsx     # Punto en el mapa ✅
├── hooks/                      # Hooks personalizados
│   └── use-create-spot.ts     # Hook para crear spots ✅
├── types/                      # Definiciones de tipos
│   └── spot-types.ts          # Tipos de la feature ✅
└── utils/                      # Utilidades
    └── spot-validations.ts    # Validaciones ✅
```

### ✅ Funcionalidades Implementadas

#### 🔧 Creación de Spots
- **Formulario completo** con validaciones en tiempo real
- **Selección de ubicación** mediante mapa interactivo
- **Selección múltiple de deportes** disponibles
- **Carga de multimedia** (fotos y videos)
- **Información de contacto** opcional (teléfono, email, website)
- **Validaciones robustas** usando Zod schemas
- **Manejo de errores** con mensajes descriptivos en inglés

#### 🗃️ Tipos y Validaciones
- **Tipos TypeScript** completos para toda la feature
- **Validaciones** específicas para cada campo del formulario
- **Mensajes de error** consistentes y localizados
- **Estados del formulario** bien definidos

#### 🎣 Hooks Personalizados
- **useCreateSpot**: Hook para manejar la creación de spots
  - Estados de loading, error y success
  - Validación automática del formulario
  - Integración con el repositorio
  - Manejo de errores robusto

#### 🏗️ Arquitectura de Datos
- **Repository Pattern** implementado con Firebase
- **Mappers** para conversión entre modelos de dominio y Firebase
- **Validaciones a nivel de repositorio** para seguridad
- **Manejo de timestamps** automático

### 🚀 Uso de la Feature

#### Importar el formulario de creación
```tsx
import { SpotCreateForm } from '@/src/features/spot';

// En tu componente
<SpotCreateForm 
  onSuccess={(spotId) => console.log('Spot creado:', spotId)}
  onCancel={() => navigation.goBack()}
/>
```

#### Usar el hook de creación
```tsx
import { useCreateSpot } from '@/src/features/spot';

const { createSpot, isLoading, error, success } = useCreateSpot();

const handleCreate = async (formData) => {
  const success = await createSpot(formData);
  if (success) {
    // Manejar éxito
  }
};
```

#### Validar datos manualmente
```tsx
import { validateSpotCreateForm } from '@/src/features/spot';

const validation = validateSpotCreateForm(formData);
if (!validation.isValid) {
  console.log('Errores:', validation.errors);
}
```

### 📋 Campos del Formulario

#### Campos Obligatorios
- **Nombre del spot** (3-100 caracteres)
- **Descripción** (10-500 caracteres)
- **Deportes disponibles** (al menos uno)
- **Multimedia** (al menos una foto o video)
- **Ubicación** (coordenadas del mapa)

#### Campos Opcionales
- **Teléfono de contacto**
- **Email de contacto** (validado si se proporciona)
- **Sitio web** (validado si se proporciona)

### 🔍 Sistema de Validación

El sistema utiliza **Zod** para todas las validaciones:

```typescript
import { spotCreateFormSchema } from '@/features/spot';

// Validar datos completos
const result = spotCreateFormSchema.safeParse(formData);

// Validaciones individuales
validateSpotName("Sport Center");
validateSpotDescription("Great place for sports...");
validateMedia([{ uri: "...", type: "image" }]);
```

### 🎨 Deportes Disponibles

La feature incluye una lista predefinida de deportes:
- Fútbol
- Baloncesto  
- Tenis
- Voleibol
- Running
- Ciclismo
- Natación
- Skateboarding
- Escalada
- Yoga

### 🗺️ Integración con Mapas

- **Componente PointPicker** para selección de ubicación
- **Vista previa del mapa** con marcador
- **Coordenadas GeoPoint** para compatibilidad con Firebase
- **Validación de ubicación** requerida

### 🔄 Estados del Formulario

```tsx
interface SpotFormState {
  isLoading: boolean;  // Proceso de creación en curso
  error: string | null; // Error si ocurre algún problema
  success: boolean;    // Éxito en la creación
}
```

### 🧪 Validaciones Implementadas

- **Nombre**: Longitud mínima/máxima, no vacío
- **Descripción**: Longitud mínima/máxima, contenido descriptivo
- **Deportes**: Al menos uno seleccionado
- **Ubicación**: Coordenadas válidas requeridas
- **Email**: Formato válido si se proporciona
- **Website**: URL válida si se proporciona

### 🚨 Manejo de Errores

- **Validación en tiempo real** al escribir
- **Errores específicos por campo** mostrados bajo cada input
- **Error general del formulario** para problemas de red/servidor
- **Mensajes descriptivos** para guiar al usuario

### 🔧 Configuración de Firebase

La feature utiliza Firebase Firestore con la siguiente estructura:

```javascript
// Colección: spots
{
  name: string,
  description: string,
  availableSports: string[],
  media: string[],
  location: { latitude: number, longitude: number },
  overallRating: number,
  contactPhone?: string,
  contactEmail?: string,
  contactWebsite?: string,
  isVerified: boolean,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy?: string,
  reviewsCount: number,
  visitsCount: number
}
```

### 📱 Pantalla de Ejemplo

Se incluye una pantalla de ejemplo en:
```
src/app/spot/create-spot.tsx
```

Esta pantalla demuestra cómo integrar el formulario en una aplicación real.

### 🔮 Próximas Funcionalidades

- [ ] Carga de imágenes/media del spot
- [ ] Edición de spots existentes
- [ ] Lista y búsqueda de spots
- [ ] Favoritos de spots
- [ ] Sistema de reviews y calificaciones
- [ ] Verificación de spots por administradores

### 🎯 Testing

Para testear la funcionalidad:

1. Navegar a la pantalla de creación de spot
2. Completar todos los campos obligatorios
3. Seleccionar ubicación en el mapa
4. Elegir al menos un deporte
5. Verificar validaciones en tiempo real
6. Enviar formulario y verificar creación en Firebase

### 📚 Dependencias

- Firebase Firestore (para persistencia)
- React Native Maps (para selección de ubicación)
- GluestackUI (para componentes UI)
- Expo Router (para navegación)

---

**Nota**: Esta feature está lista para producción y sigue las mejores prácticas de React Native y Firebase.

