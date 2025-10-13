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

Este proyecto sigue la estructura de desarrollo basada en el enfoque de **Bulletproof React**, que promueve una organización modular, escalable y mantenible para aplicaciones React. A continuación, se describe la estructura del proyecto y su propósito:

---

## Estructura del Proyecto

### 1. **src/**
Contiene todo el código fuente de la aplicación.

#### 1.1 **api/**
La carpeta api implementa un patrón de repositorio con inyección de dependencias para gestionar todas las operaciones de datos en la aplicación SpotsSports. Abstrae las interacciones de Firebase, gestiona las transformaciones de datos mediante mapeadores y garantiza un código limpio y testeable según los principios SOLID. Sus responsabilidades incluyen operaciones CRUD, autenticación, gestión de errores y validación de datos.

- **config/**: Configuraciones relacionadas con servicios externos, como Firebase.
- **repositories/**: Implementaciones y abstracciones para interactuar con datos externos o APIs.
  - **interfaces/**: Definición de contratos (interfaces) para los repositorios.
  - **implementations/**: Implementaciones concretas de los repositorios.
  - **mappers/**: Transformaciones entre modelos de datos internos y externos.

#### 1.2 **app/**
- Contiene las pantallas principales y la navegación de la aplicación.
- **auth/**: Pantallas y lógica relacionadas con la autenticación (inicio de sesión, registro, etc.).
- **home-tabs/**: Pestañas principales de la aplicación (feed, perfil, búsqueda, etc.).
- **profile/**: Pantallas relacionadas con el perfil del usuario.
- **spot/**: Pantallas relacionadas con los "spots".

#### 1.3 **assets/**
- Contiene recursos estáticos como imágenes y datos de prueba.

#### 1.4 **components/**
- **commons/**: Componentes reutilizables comunes (e.g., formularios, mapas, carruseles).
- **ui/**: Componentes de interfaz de usuario (e.g., botones, modales, listas).

#### 1.5 **context/**
- Contextos globales de React para manejar estados compartidos (e.g., notificaciones, usuario).

#### 1.6 **features/**
- Organización modular por características.
- Cada carpeta incluye:
  - **components/**: Componentes específicos de la característica.
  - **hooks/**: Hooks personalizados relacionados con la característica (Logica de negocio y llamadadas a la api simplificada).
  - **types/**: Tipos TypeScript específicos de la característica.
  - **utils/**: Utilidades específicas de la característica.

#### 1.7 **hooks/**
- Hooks personalizados reutilizables en toda la aplicación.

#### 1.8 **lib/**
- Librerías y configuraciones compartidas (e.g., configuración de Firebase).

#### 1.9 **types/**
- Definiciones de tipos globales de TypeScript (e.g., usuario, spot, deporte).

#### 1.10 **utils/**
- Funciones utilitarias reutilizables (e.g., manejo de fechas).
