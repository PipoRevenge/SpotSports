# Entities - Modelos de Negocio

## 📦 Propósito

La carpeta `entities` contiene **exclusivamente los modelos de negocio** (business models) de SpotsSports. Estas son las estructuras de datos fundamentales que representan los conceptos del dominio de la aplicación.

## 🚨 Restricción CRÍTICA

**Las entidades NO pueden importar de ninguna otra parte del código.**

```typescript
// ❌ PROHIBIDO - Entidad importando de features, api, o app
import { someFunction } from '@/src/features/spot';
import { spotRepository } from '@/src/api';

// ✅ CORRECTO - Solo tipos y definiciones puras
export interface Spot {
  id: string;
  name: string;
  // ...
}
```

**¿Por qué esta restricción?**
- Las entidades son el **núcleo del dominio**, no deben depender de implementaciones
- Garantiza que los modelos sean **portables y reutilizables**
- Facilita **testing y mantenimiento**
- Previene **dependencias circulares**

## ✅ Uso Permitido

Las entidades **SON importadas y utilizadas** por:
- ✅ **API Layer** (`src/api/`) - Para mapear datos de Firebase
- ✅ **Features** (`src/features/`) - Para tipar componentes y hooks
- ✅ **App** (`src/app/`) - Para tipar propiedades de páginas
- ✅ **Hooks** - Para definir tipos de retorno
- ✅ **Componentes** - Para tipar props

```typescript
// ✅ Importando entidades desde features
import { Spot } from '@/src/entities/spot';
import { User } from '@/src/entities/user';

// Usándolas en componentes
interface SpotCardProps {
  spot: Spot;
  user?: User;
}
```

## 📁 Estructura

```
entities/
├── spot/              # Entidad de Spot deportivo
│   └── spot.entity.ts
├── user/              # Entidad de Usuario
│   ├── user.entity.ts
│   └── user-stats.entity.ts
├── review/            # Entidad de Reseña
│   ├── review.entity.ts
│   └── review-summary.entity.ts
└── sport/             # Entidad de Deporte
    └── sport.entity.ts
```

## 🎯 Entidades Actuales

### 1. **Spot** (Spot Deportivo)

**Archivo**: `spot/model/spot.ts`

Representa un lugar donde se pueden practicar deportes.

**Estructura modular:**

```typescript
// Sub-interfaces para organización
export interface SpotDetails {
  name: string;
  description: string;
  availableSports: string[];  // Lista de deportes disponibles
  media: string[];            // Imágenes o videos del spot
  location: GeoPoint;
  overallRating: number;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

export interface SpotMetadata {
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SpotActivity {
  reviewsCount: number;
  visitsCount: number;
  favoritesCount?: number;       // Usuarios que tienen el spot en favoritos
  visitedCount?: number;          // Usuarios que marcaron el spot como visitado
  wantToVisitCount?: number;      // Usuarios que quieren visitar el spot
}

// Interfaz principal de Spot
export interface Spot {
  id: string;
  details: SpotDetails;
  metadata: SpotMetadata;
  activity: SpotActivity;
}
```

**Propósito**: Modelo central de la aplicación, usado en búsqueda, visualización y gestión de spots.

### 2. **User** (Usuario)

**Archivo**: `user/model/user.ts`

Representa un usuario de la aplicación.

**Estructura modular:**

```typescript
export interface UserDetails {
  email: string;
  photoURL?: string;
  userName: string;
  fullName?: string;
  bio?: string;
  birthDate: Date;
  phoneNumber?: string;
}

export interface UserMetadata {
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
}

export interface UserActivity {
  reviewsCount: number;
  commentsCount: number;
  favoriteSpotsCount: number;
  followersCount: number;
  followingCount: number;
}

// Interfaz principal de Usuario
export interface User {
  id: string;
  userDetails: UserDetails;
  metadata: UserMetadata;
  activity: UserActivity;
}
```

**Propósito**: Modelo de usuario que centraliza información del perfil, metadata y actividad social.

### 3. **Review** (Reseña)

**Archivo**: `review/review.ts`

Representa una reseña de un spot deportivo.

**Estructura modular:**

```typescript
export interface ReviewDetails {
  spotId: string;
  content: string;
  rating: number;
  reviewSports: ReviewSport[];  // Calificaciones por deporte
  media?: string[];
}

export interface ReviewSport {
  sportId: string;
  sportRating: number;
  difficulty: number;
  comment?: string;  // Comentario específico sobre este deporte en este spot
}

export interface ReviewMetadata {
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  createdBy: string;
}

export interface ReviewActivity {
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  comments?: CommentReview[];
  reports: number;
}

// Interfaz principal de Reseña
export interface Review {
  id: string;
  details: ReviewDetails;
  metadata: ReviewMetadata;
  activity?: ReviewActivity;
}
```

**SubEntidades relacionadas**:
- `CommentReview` - Comentarios en reseñas (ver `review/comment.ts`)
- `Vote` - Sistema de votación (ver `review/vote.ts`)

### 4. **Sport** (Deporte)

**Archivo**: `sport/model/sport.ts`

Representa un deporte disponible en la aplicación.

**Estructura modular:**

```typescript
export interface SportDetails {
  name: string;
  description: string;
  category?: string;  // Opcional - los deportes pueden no tener categoría
  icon?: string;
  image?: string;
}

export interface SportMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SportActivity {
  spotsCount?: number;    // Número de spots que ofrecen este deporte
  usersCount?: number;    // Número de usuarios que practican este deporte
  popularity?: number;    // Métrica de popularidad
}

// Interfaz principal de Deporte
export interface Sport {
  id: string;
  details: SportDetails;
  metadata: SportMetadata;
  activity?: SportActivity;
}
```

**Propósito**: Catálogo de deportes disponibles en la plataforma.

## 🔄 Flujo de Datos

Las entidades fluyen a través de las capas de la siguiente manera:

```
Firebase (Firestore)
        ↓
Mapper (src/api/mappers)
        ↓
Entity (src/entities)  ← PUNTO CENTRAL
        ↓
┌───────┼───────┐
│       │       │
Repository   Hook   Component
(src/api)   (features) (features/app)
```

**Ejemplo de flujo completo:**

1. **Firebase → Mapper → Entity**:
```typescript
// src/api/mappers/spot-mapper.ts
import { Spot } from '@/src/entities/spot';

export const mapFirestoreToSpot = (doc: DocumentData): Spot => {
  return {
    id: doc.id,
    name: doc.name,
    // ... mapeo de campos
  };
};
```

2. **Repository usa Entity**:
```typescript
// src/api/repositories/implementations/spot-repository.ts
import { Spot } from '@/src/entities/spot';

export const getSpotById = async (id: string): Promise<Spot> => {
  const doc = await getDoc(...);
  return mapFirestoreToSpot(doc);
};
```

3. **Hook usa Entity**:
```typescript
// src/features/spot/hooks/use-spot-details.ts
import { Spot } from '@/src/entities/spot';

export const useSpotDetails = (id: string) => {
  const [spot, setSpot] = useState<Spot | null>(null);
  // ...
};
```

4. **Component usa Entity**:
```typescript
// src/features/spot/components/spot-card.tsx
import { Spot } from '@/src/entities/spot';

interface SpotCardProps {
  spot: Spot;
}
```

## 📝 Convenciones

### Nomenclatura de Archivos
- Usar sufijo `.entity.ts` para archivos de entidades
- Ejemplo: `user.entity.ts`, `spot.entity.ts`

### Nomenclatura de Interfaces
- Usar `PascalCase` 
- Nombre singular y descriptivo
- Ejemplo: `User`, `Spot`, `Review`

### Organización
- Una entidad principal por carpeta
- SubEntidades relacionadas en la misma carpeta
- Ejemplo: `user/user.entity.ts` y `user/user-stats.entity.ts`

## ✅ Mejores Prácticas

### 1. **Mantener Entidades Puras**
```typescript
// ✅ CORRECTO - Solo definiciones de tipos
export interface Spot {
  id: string;
  name: string;
}

// ❌ INCORRECTO - Lógica de negocio en entidad
export interface Spot {
  id: string;
  name: string;
  validate(): boolean;  // NO - La validación va en utils
}
```

### 2. **Usar Tipos Opcionales Apropiadamente**
```typescript
// Campos que pueden no existir: usar ?
export interface User {
  id: string;          // Siempre presente
  email: string;       // Siempre presente
  bio?: string;        // Opcional
  phoneNumber?: string; // Opcional
}
```

### 3. **Documentar Campos Importantes**
```typescript
export interface Spot {
  /** Unique identifier from Firestore */
  id: string;
  
  /** Geographic coordinates (latitude, longitude) */
  location: GeoPoint;
  
  /** Overall rating from 0-5 based on all reviews */
  overallRating: number;
}
```

### 4. **Tipos Compartidos**
```typescript
// Para tipos usados en múltiples entidades
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚫 Anti-Patrones a Evitar

### ❌ NO: Lógica de Negocio
```typescript
// Entidades NO contienen métodos
interface User {
  validate(): boolean;  // ❌
  save(): Promise<void>; // ❌
}
```

### ❌ NO: Dependencias Externas
```typescript
// NO importar de otras capas
import { userRepository } from '@/src/api'; // ❌
import { useUser } from '@/src/features/user'; // ❌
```

### ❌ NO: Valores por Defecto
```typescript
// Valores por defecto van en factories/builders, no en entidades
interface Spot {
  rating = 0; // ❌
}
```

## 🎯 Cuándo Crear una Nueva Entidad

Crea una nueva entidad cuando:
- ✅ Representa un **concepto fundamental** del dominio
- ✅ Se **persiste en la base de datos**
- ✅ Se **usa en múltiples features**
- ✅ Tiene **identidad propia** (generalmente tiene un `id`)

NO crees una entidad si:
- ❌ Es solo para **UI temporal** (usa types en la feature)
- ❌ Es específico de **una sola feature** (usa types en la feature)
- ❌ Es un **DTO o payload** temporal (usa types en api o feature)

## 📚 Recursos

- Ver [../ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- Ver [../api/README-API.md](../api/README-API.md) para cómo se usan en repositorios
- Ver [../features/README-FEATURES.md](../features/README-FEATURES.md) para cómo se usan en features

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
