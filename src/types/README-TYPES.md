# Types - Definiciones TypeScript Globales

## 📦 Propósito

La carpeta `src/types` contiene **definiciones de tipos TypeScript globales** que son compartidas en toda la aplicación y no pertenecen a ninguna feature o entidad específica.

## 🎯 ¿Qué va en Types?

Los tipos en esta carpeta deben ser:
- ✅ **Genéricos y reutilizables** en toda la aplicación
- ✅ **No específicos de dominio** - para tipos de dominio usar `src/entities`
- ✅ **Técnicos o utilitarios** - tipos relacionados con la infraestructura, no con el negocio

## 📁 Estructura Actual

```
types/
├── geopoint.ts       # Definición de coordenadas geográficas
└── difficulty.ts     # Sistema de niveles de dificultad
```

## 📝 Tipos Disponibles

### **GeoPoint** 🌍

**Archivo**: `geopoint.ts`

Representa coordenadas geográficas (latitud y longitud).

```typescript
export interface GeoPoint {
  /**
   * The latitude coordinate in degrees.
   */
  latitude: number;

  /**
   * The longitude coordinate in degrees.
   */
  longitude: number;
}
```

**Uso:**
```typescript
import { GeoPoint } from '@/src/types/geopoint';

const location: GeoPoint = {
  latitude: 40.7128,
  longitude: -74.0060
};
```

**Usado en:**
- Entidades de Spot (ubicación del spot)
- Componentes de mapas
- Features de búsqueda geográfica

### **Difficulty System** 📊

**Archivo**: `difficulty.ts`

Sistema de niveles de dificultad para deportes en spots.

```typescript
export enum DifficultyLevel {
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4
}

export interface Difficulty {
  level: DifficultyLevel;
  label: string;
  description?: string;
}
```

**Usado en:**
- Reviews (calificación de dificultad por deporte)
- Filtros de búsqueda
- Información de spots

## 🔄 Flujo de Uso

```
Types (src/types)
    ↓
┌───┴────┬────────┬────────┐
│        │        │        │
Entities Features Components App
```

**Ejemplo de flujo:**

1. **Type definido** en `src/types/geopoint.ts`:
```typescript
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
```

2. **Usado en Entity** (`src/entities/spot/model/spot.ts`):
```typescript
import { GeoPoint } from '@/src/types/geopoint';

export interface SpotDetails {
  location: GeoPoint;
  // ...
}
```

3. **Usado en Components** (`src/components/commons/map/map-view.tsx`):
```typescript
import { GeoPoint } from '@/src/types/geopoint';

interface MapViewProps {
  center: GeoPoint;
  markers: GeoPoint[];
}
```

## ✅ Cuándo Crear un Nuevo Type

Crea un nuevo tipo en `src/types/` cuando:

- ✅ Es un **tipo técnico/utilitario** usado en múltiples lugares
- ✅ No representa un **concepto de dominio** (eso va en `entities/`)
- ✅ Es **genérico y reutilizable**
- ✅ Ayuda a la **consistencia** del código

**Ejemplos válidos:**
- Coordenadas geográficas (`GeoPoint`)
- Tipos de respuesta HTTP genéricos
- Configuraciones de paginación
- Formatos de error estándar
- Enums de estados comunes

## 🚫 Qué NO va en Types

NO uses `src/types/` para:

- ❌ **Modelos de negocio** → Usar `src/entities/`
- ❌ **Tipos específicos de una feature** → Usar `src/features/[feature]/types/`
- ❌ **Props de componentes** → Definir inline o en el mismo archivo del componente
- ❌ **DTOs de API** → Usar `src/api/mappers/` o tipos del repositorio

## 📝 Convenciones

### Nomenclatura de Archivos
- Usar `kebab-case.ts`
- Nombres descriptivos y concisos
- Ejemplos: `geopoint.ts`, `http-error.ts`, `pagination.ts`

### Nomenclatura de Tipos
- Usar `PascalCase` para interfaces y tipos
- Usar `SCREAMING_SNAKE_CASE` para enums
- Ejemplos: `GeoPoint`, `DifficultyLevel`, `HttpError`

### Documentación
- Incluir JSDoc para tipos complejos
- Explicar el propósito y uso del tipo
- Incluir ejemplos si es necesario

```typescript
/**
 * Represents geographic coordinates (latitude, longitude)
 * Used across the app for location-based features
 * 
 * @example
 * ```ts
 * const location: GeoPoint = {
 *   latitude: 40.7128,
 *   longitude: -74.0060
 * };
 * ```
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
```

## 🎯 Tipos Sugeridos para Implementar

Basándose en las necesidades comunes de la aplicación:

### **Pagination**
```typescript
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

### **API Response**
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
```

### **Error Handling**
```typescript
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
```

## 📚 Recursos

- Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- Ver [src/entities/README-ENTITIES.md](../entities/README-ENTITIES.md) para modelos de negocio
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
