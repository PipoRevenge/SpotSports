# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

# SpotsSports

Este proyecto sigue la estructura de desarrollo basada en el enfoque de **Bulletproof React**, que promueve una organización modular, escalable y mantenible para aplicaciones React. A continuación, se describe la estructura del proyecto y su propósito:

---

## Estructura del Proyecto

### 1. **src/**
Contiene todo el código fuente de la aplicación.

#### 1.1 **api/**
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
  - **hooks/**: Hooks personalizados relacionados con la característica.
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
