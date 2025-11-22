# Welcome to your Expo app 👋


## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```


---

# SpotsSports

Este proyecto sigue una **arquitectura de desarrollo basada en Bulletproof React modificada** para React Native, que promueve una organización modular, escalable y mantenible. 

> **📖 Para desarrolladores y agentes IA**: Consulta [src/ARCHITECTURE.md](src/ARCHITECTURE.md) para una guía completa de patrones, estructura y convenciones.

---

## 🏗️ Principios Arquitectónicos Fundamentales

### 1. **Independencia de Features** 🚨 CRÍTICO

**Las features NO deben depender entre sí**. Este es el principio más importante de la arquitectura.

- ❌ **Prohibido**: Importar código de una feature en otra feature
- ✅ **Correcto**: La comunicación entre features ocurre a través de las páginas en `src/app`
- ✅ **Patrón**: Las features exponen componentes con "slots" (props para inyectar componentes)
- ✅ **Composición**: `src/app` ensambla features mediante inyección de dependencias

**Ejemplo:**
```tsx
// ❌ INCORRECTO - Feature importando de otra feature
import { SpotCard } from '@/src/features/spot';

// ✅ CORRECTO - Composición en src/app
// En src/app/spot/[spotId].tsx:
<SpotDetails 
  spot={spot}
  reviewsSlot={<ReviewList spotId={spotId} />}  // Inyección
/>
```

### 2. **Entidades (Entities)** 📦

La carpeta `src/entities` contiene **exclusivamente modelos de negocio** compartidos:

- **Propósito**: Definir las estructuras de datos del dominio (User, Spot, Review, Sport)
- **Restricción CRÍTICA**: Las entidades NO pueden importar de ninguna otra parte del código
- **Uso**: Son utilizados por la API, features y páginas
- **Beneficio**: Modelo de datos consistente en toda la aplicación

### 3. **API de Firebase Encapsulada** 🔒

Toda interacción con Firebase está encapsulada usando el **patrón Repository**:

- **Acceso ÚNICO**: Solo se puede consultar Firebase a través de hooks
- **Flujo**: Feature Hook → Repository → Firebase
- **Beneficio**: Features desacopladas de la implementación de Firebase
- **Testing**: Fácil de mockear repositorios en pruebas

```tsx
// Hook en feature llama al repositorio
const { spot } = useSpotDetails(spotId);  // Hook
↓
spotRepository.getSpotById(spotId);       // Repository
↓
Firebase Firestore                         // Backend
```

### 4. **App como Capa de Orquestación** 🎭

La carpeta `src/app` es responsable de:

1. **Páginas principales**: Todas las pantallas de la aplicación
2. **Rutas**: Sistema de navegación (features NO controlan rutas)
3. **Inyección de dependencias**: Ensambla features mediante props y callbacks
4. **Composición**: Une features independientes en páginas funcionales

Ver [`src/app/README-APP.md`](file:///c:/Users/aleja/OneDrive/Escritorio/Temporal/SpotSport/rehecho/SpotsSports/src/app/README-APP.md) para más detalles.

---

## 📁 Estructura del Proyecto

### 1. **src/**
Contiene todo el código fuente de la aplicación.

#### 1.1 **api/**
La carpeta api implementa un patrón de repositorio con inyección de dependencias para gestionar todas las operaciones de datos en la aplicación SpotsSports. Abstrae las interacciones de Firebase, gestiona las transformaciones de datos mediante mapeadores y garantiza un código limpio y testeable según los principios SOLID. Sus responsabilidades incluyen operaciones CRUD, autenticación, gestión de errores y validación de datos.


- **repositories/**: Implementaciones y abstracciones para interactuar con datos externos o APIs.
  - **interfaces/**: Definición de contratos (interfaces) para los repositorios.
  - **implementations/**: Implementaciones concretas de los repositorios.
  - **mappers/**: Transformaciones entre modelos de datos internos y externos.

#### 1.2 **app/** 🎭
Capa de orquestación de la aplicación que gestiona:
- **Páginas principales**: Todas las pantallas de la aplicación
- **Rutas** (File-based routing con Expo Router):
  - `auth/` - Pantallas de autenticación (sign-in, sign-up)
  - `home-tabs/` - Navegación principal con pestañas (feed, búsqueda, perfil, favoritos)
  - `profile/` - Pantallas relacionadas con perfiles de usuario
  - `spot/` - Pantallas relacionadas con spots deportivos
- **Inyección de dependencias**: Ensambla features independientes mediante props y callbacks
- **Composición de features**: Une componentes de diferentes features en páginas cohesivas
- **Control de navegación**: Las features NO controlan rutas, solo `app/` lo hace

Ver [src/app/README-APP.md](src/app/README-APP.md) para documentación completa.

#### 1.3 **assets/**
Recursos estáticos como imágenes, fuentes y datos de prueba.

#### 1.4 **components/** 🎨
Componentes compartidos organizados en dos categorías:

- **commons/**: Componentes comunes que abstraen funcionalidad de librerías externas
  - `map/` - Componentes de mapa (abstracción de react-native-maps)
  - `forms/` - Componentes de formularios reutilizables
  - `carousel/` - Carruseles de imágenes/contenido
  - `error-boundary/` - Manejo de errores
  
- **ui/**: Componentes de interfaz de usuario pura (siguiendo GluestackUI)
  - `button/` - Botones y variantes
  - `card/` - Tarjetas
  - `modal/` - Modales y bottom sheets
  - `text/` - Componentes de texto
  - `input/` - Campos de entrada
  - `badge/`, `avatar/`, `spinner/`, etc.

#### 1.5 **context/**
- Contextos globales de React para manejar estados compartidos (e.g., notificaciones, usuario).

#### 1.6 **entities/** 📦
**Modelos de negocio compartidos** (User, Spot, Review, Sport)

**Restricción CRÍTICA**: 
- ❌ Las entidades NO pueden importar de ninguna otra parte del código
- ✅ Son importadas y utilizadas por API, features y páginas
- ✅ Garantizan un modelo de datos consistente en toda la aplicación

Cada entidad define:
- Interfaces y tipos TypeScript del modelo de negocio
- Estructuras de datos puras sin lógica de negocio
- Contratos que todos usan (API ↔ Features ↔ App)

Ejemplo: `src/entities/spot/spot.entity.ts` define la interface `Spot` usada en toda la app.

#### 1.7 **features/** 🔧
Organización modular por características. **Las features son completamente independientes entre sí**.

**Principio fundamental**: Una feature NUNCA importa de otra feature.

Cada feature puede contener (todos opcionales excepto `index.ts`):
- `index.ts` - Exportaciones públicas **[REQUERIDO]**
- `components/` - Componentes específicos de la feature con "slots" para composición
- `hooks/` - Hooks personalizados (lógica de negocio + llamadas a API)
- `types/` - Tipos TypeScript específicos de la feature
- `utils/` - Utilidades (validaciones, transformaciones, formateo)
- `constants/` - Constantes específicas de la feature
- `storage/` - Operaciones de almacenamiento local

**Features actuales**:
- `auth/` - Autenticación y registro
- `spot/` - Gestión de spots deportivos
- `spot-collection/` - Colecciones de spots (favoritos, visitados)
- `user/` - Perfiles y gestión de usuarios
- `review/` - Sistema de reseñas
- `sport/` - Gestión de deportes
- `map-search/` - Búsqueda en mapa

Ver [src/features/README-FEATURES.md](src/features/README-FEATURES.md) para más detalles.

#### 1.8 **hooks/**
Hooks personalizados globales reutilizables en toda la aplicación.

#### 1.9 **lib/**
Librerías y configuraciones externas compartidas:
- `firebase/` - Configuración de Firebase (Firestore, Auth, Storage)

#### 1.10 **types/**
Definiciones de tipos TypeScript globales compartidos.

#### 1.11 **utils/**
Funciones utilitarias globales reutilizables (e.g., manejo de fechas, formateo).

---

## 📚 Índice de Documentación

### 📖 Documentación Principal

- **[ARCHITECTURE.md](src/ARCHITECTURE.md)** - Guía completa de arquitectura para desarrolladores y agentes IA
  - Principios arquitectónicos fundamentales
  - Patrones de desarrollo
  - Convenciones y mejores prácticas
  - Quick reference para AI agents

### 🏗️ Capas de la Aplicación

#### **App Layer** (Páginas y Rutas)
- **[src/app/README-APP.md](src/app/README-APP.md)** - Capa de orquestación de la aplicación
  - File-based routing con Expo Router
  - Composición de features
  - Inyección de dependencias

#### **API Layer** (Acceso a Datos)
- **[src/api/README-API.md](src/api/README-API.md)** - Patrón Repository para Firebase
  - Repositorios y sus interfaces
  - Mappers de datos
  - Operaciones CRUD

#### **Features** (Módulos de Negocio)
- **[src/features/README-FEATURES.md](src/features/README-FEATURES.md)** - Guía de desarrollo de features
  - Estructura de features
  - Independencia entre features
  - Componentes con slots para composición

##### Features Individuales
- **[src/features/auth/README-AUTH.md](src/features/auth/README-AUTH.md)** - Autenticación y registro
- **[src/features/spot/README-SPOT.md](src/features/spot/README-SPOT.md)** - Gestión de spots deportivos
- **[src/features/spot-collection/README-SPOT-COLLECTION.md](src/features/spot-collection/README-SPOT-COLLECTION.md)** - Colecciones de spots (favoritos, visitados)
- **[src/features/user/README-USER.md](src/features/user/README-USER.md)** - Perfiles y gestión de usuarios
- **[src/features/review/README-REVIEW.md](src/features/review/README-REVIEW.md)** - Sistema de reseñas
- **[src/features/sport/README-SPORT-FEATURE.md](src/features/sport/README-SPORT-FEATURE.md)** - Gestión de deportes
- **[src/features/map-search/README-MAP-SEARCH.md](src/features/map-search/README-MAP-SEARCH.md)** - Búsqueda en mapa

### 🧩 Componentes Compartidos

#### **Entities** (Modelos de Negocio)
- **[src/entities/README-ENTITIES.md](src/entities/README-ENTITIES.md)** - Modelos de dominio compartidos
  - Estructura de entidades (Details, Metadata, Activity)
  - User, Spot, Review, Sport
  - Restricciones y convenciones

#### **Types** (Tipos Globales)
- **[src/types/README-TYPES.md](src/types/README-TYPES.md)** - Definiciones TypeScript globales
  - GeoPoint (coordenadas geográficas)
  - Difficulty System (niveles de dificultad)
  - Tipos técnicos y utilitarios

#### **Hooks** (Custom Hooks)
- **[src/hooks/README-HOOKS.md](src/hooks/README-HOOKS.md)** - Custom hooks globales
  - useUserLocation (geolocalización)
  - Patrones de hooks reutilizables
  - Testing de hooks

#### **Context** (Estado Global)
- **[src/context/README-CONTEXT.md](src/context/README-CONTEXT.md)** - React Context providers
  - AppAlertContext (sistema de notificaciones)
  - SelectedSpotContext (spot seleccionado en mapa)
  - Patrones de context y optimización

#### **Utils** (Utilidades)
- **[src/utils/README-UTILS.md](src/utils/README-UTILS.md)** - Funciones utilitarias globales
  - date-utils (formateo de fechas)
  - Utilidades sugeridas (string, number, array, validation)
  - Testing de utilidades

#### **Lib** (Configuraciones Externas)
- **[src/lib/README-LIB.md](src/lib/README-LIB.md)** - Configuración de librerías externas
  - Firebase Configuration
  - Emuladores de desarrollo
  - Variables de entorno

#### **Assets** (Recursos Estáticos)
- **[src/assets/README-ASSETS.md](src/assets/README-ASSETS.md)** - Imágenes y recursos estáticos
  - Organización de assets
  - Test data para desarrollo
  - Optimización de imágenes

---

### 🎯 Guías Rápidas

**Para empezar con el proyecto:**
1. Lee [ARCHITECTURE.md](src/ARCHITECTURE.md) para entender la estructura
2. Revisa [src/features/README-FEATURES.md](src/features/README-FEATURES.md) para crear features
3. Consulta [src/entities/README-ENTITIES.md](src/entities/README-ENTITIES.md) para los modelos de datos

**Para trabajar con datos:**
1. Lee [src/api/README-API.md](src/api/README-API.md) para entender el patrón Repository
2. Revisa [src/entities/README-ENTITIES.md](src/entities/README-ENTITIES.md) para los tipos de datos
3. Consulta [src/lib/README-LIB.md](src/lib/README-LIB.md) para la configuración de Firebase

**Para crear componentes:**
1. Usa [src/components/ui/](src/components/ui/) para componentes de UI pura
2. Usa [src/components/commons/](src/components/commons/) para abstracciones de librerías
3. Crea componentes específicos en [src/features/[feature]/components/](src/features/)
