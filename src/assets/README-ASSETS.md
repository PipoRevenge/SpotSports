# Assets - Recursos Estáticos

## 📦 Propósito

La carpeta `src/assets` contiene **recursos estáticos** utilizados en la aplicación, incluyendo imágenes, íconos, fuentes, datos de prueba y otros archivos estáticos que no son código.

## 🎯 ¿Qué va en Assets?

Los archivos en esta carpeta deben ser:
- ✅ **Recursos estáticos** - no cambian dinámicamente
- ✅ **Assets empaquetados** - incluidos en el bundle de la app
- ✅ **Archivos compartidos** - usados en múltiples partes de la app

## 📁 Estructura Actual

```
assets/
├── images/         # Imágenes estáticas de la aplicación
└── test_data/      # Datos de prueba para desarrollo
```

## 🖼️ Tipos de Assets

### **Images** 🖼️

**Carpeta**: `images/`

Contiene imágenes estáticas de la aplicación.

**Tipos de imágenes recomendadas:**
- **Logos**: Logo de la app en diferentes tamaños
- **Íconos**: Íconos personalizados (si no se usan librerías)
- **Placeholders**: Imágenes por defecto (avatares, spots)
- **Ilustraciones**: Graphics decorativos
- **Backgrounds**: Fondos de pantalla
- **Splash screens**: Pantallas de carga

**Uso:**
```typescript
import { Image } from 'react-native';

// Imagen local
const logo = require('@/src/assets/images/logo.png');

function LogoComponent() {
  return (
    <Image source={logo} style={{ width: 100, height: 100 }} />
  );
}
```

**Formatos recomendados:**
- PNG para imágenes con transparencia
- JPG para fotografías
- WebP para mejor compresión (soporte en React Native)
- SVG para íconos vectoriales (requiere librería como react-native-svg)

**Optimización:**
- Usar múltiples resoluciones (@1x, @2x, @3x)
- Comprimir imágenes antes de incluirlas
- Considerar usar remote images para contenido dinámico

### **Test Data** 🧪

**Carpeta**: `test_data/`

Contiene datos de prueba para desarrollo y testing.

**Usos típicos:**
- Datos mock para desarrollo sin backend
- Fixtures para pruebas unitarias
- Datos de ejemplo para Storybook
- Seed data para testing

**Ejemplo:**
```typescript
// test_data/mock-spots.json
[
  {
    "id": "1",
    "name": "Polideportivo Central",
    "location": {
      "latitude": 40.4168,
      "longitude": -3.7038
    },
    "availableSports": ["football", "basketball"]
  }
]

// Uso en desarrollo
import mockSpots from '@/src/assets/test_data/mock-spots.json';

if (__DEV__) {
  // Usar datos de prueba
  const spots = mockSpots;
}
```

## 📝 Organización de Assets

### Estructura Recomendada

```
assets/
├── images/
│   ├── logos/
│   │   ├── logo.png
│   │   ├── logo@2x.png
│   │   ├── logo@3x.png
│   │   └── logo-white.png
│   ├── placeholders/
│   │   ├── avatar-placeholder.png
│   │   ├── spot-placeholder.png
│   │   └── no-image.png
│   ├── icons/  (si usas íconos custom)
│   │   ├── sport-football.png
│   │   ├── sport-basketball.png
│   │   └── sport-tennis.png
│   └── backgrounds/
│       ├── splash-screen.png
│       └── onboarding-bg.png
├── fonts/  (si usas fuentes custom)
│   ├── CustomFont-Regular.ttf
│   ├── CustomFont-Bold.ttf
│   └── CustomFont-Italic.ttf
├── animations/  (si usas Lottie)
│   ├── loading.json
│   └── success.json
└── test_data/
    ├── mock-spots.json
    ├── mock-users.json
    ├── mock-reviews.json
    └── mock-sports.json
```

### Convenciones de Nomenclatura

#### Imágenes
- Usar `kebab-case.png`
- Nombres descriptivos
- Incluir resolución para multi-density
- Ejemplos:
  - `logo.png`, `logo@2x.png`, `logo@3x.png`
  - `avatar-placeholder.png`
  - `sport-icon-football.png`

#### Test Data
- Usar `kebab-case.json`
- Prefijo `mock-` para datos de prueba
- Ejemplos:
  - `mock-spots.json`
  - `mock-users.json`
  - `seed-data.json`

## 🎨 Assets Específicos por Plataforma

React Native permite assets específicos por plataforma:

```
images/
├── logo.ios.png       # Solo iOS
├── logo.android.png   # Solo Android
└── logo.web.png       # Solo Web
```

Uso automático:
```typescript
// React Native seleccionará automáticamente según la plataforma
const logo = require('./logo.png');
```

## 📱 Imágenes Multi-Resolución

Para soportar diferentes densidades de pantalla:

```
images/
├── logo.png      # @1x (mdpi)
├── logo@2x.png   # @2x (xhdpi)
└── logo@3x.png   # @3x (xxhdpi)
```

React Native selecciona automáticamente la imagen apropiada:
```typescript
// React Native cargará la resolución adecuada automáticamente
const logo = require('@/src/assets/images/logo.png');
```

## 🔤 Fuentes Personalizadas

Si usas fuentes custom, incluirlas en `fonts/`:

### **Configuración en Expo**

```json
// app.json
{
  "expo": {
    "fonts": {
      "CustomFont-Regular": "./src/assets/fonts/CustomFont-Regular.ttf",
      "CustomFont-Bold": "./src/assets/fonts/CustomFont-Bold.ttf"
    }
  }
}
```

### **Carga de Fuentes**

```typescript
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'CustomFont-Regular': require('./src/assets/fonts/CustomFont-Regular.ttf'),
    'CustomFont-Bold': require('./src/assets/fonts/CustomFont-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return <AppContent />;
}
```

### **Uso**

```typescript
<Text style={{ fontFamily: 'CustomFont-Regular' }}>
  Hello World
</Text>
```

## 🎬 Animaciones (Lottie)

Para animaciones Lottie, guardar archivos `.json` en `animations/`:

```typescript
import LottieView from 'lottie-react-native';

function LoadingAnimation() {
  return (
    <LottieView
      source={require('@/src/assets/animations/loading.json')}
      autoPlay
      loop
      style={{ width: 200, height: 200 }}
    />
  );
}
```

## 📊 Test Data Best Practices

### Estructura de Mock Data

```typescript
// test_data/mock-spots.json
{
  "spots": [
    {
      "id": "spot-1",
      "details": {
        "name": "Polideportivo Central",
        "description": "Instalaciones deportivas completas",
        "location": {
          "latitude": 40.4168,
          "longitude": -3.7038
        },
        "availableSports": ["football", "basketball", "tennis"],
        "media": [
          "https://picsum.photos/400/300?random=1"
        ],
        "overallRating": 4.5,
        "contactInfo": {
          "phone": "+34 123 456 789",
          "email": "info@polideportivo.com",
          "website": "https://polideportivo.com"
        }
      },
      "metadata": {
        "isVerified": true,
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-15T00:00:00Z",
        "createdBy": "user-1"
      },
      "activity": {
        "reviewsCount": 45,
        "visitsCount": 230,
        "favoritesCount": 89
      }
    }
  ]
}
```

### Uso en Desarrollo

```typescript
// En un hook o componente de desarrollo
import mockData from '@/src/assets/test_data/mock-spots.json';

export const useSpotList = () => {
  if (__DEV__ && USE_MOCK_DATA) {
    return {
      spots: mockData.spots,
      isLoading: false,
      error: null,
    };
  }
  
  // Llamada real a la API
  return useRealSpotList();
};
```

### Ventajas de Test Data
- ✅ Desarrollo sin backend activo
- ✅ Testing predecible y consistente
- ✅ Desarrollo offline
- ✅ Demos y presentaciones

## 🚫 Qué NO va en Assets

NO uses `src/assets/` para:

- ❌ **Contenido dinámico** → Cargar desde backend/CDN
- ❌ **Imágenes grandes** → Usar CDN (Cloudinary, imgix)
- ❌ **Videos** → Usar streaming services
- ❌ **Código** → Usar carpetas apropiadas (features, components, etc.)
- ❌ **Configuración** → Usar archivos de configuración o `.env`

## 📏 Optimización de Assets

### Tamaño de Imágenes

**Recomendaciones:**
- Logos: 100-500 KB
- Íconos: < 50 KB
- Placeholders: < 100 KB
- Backgrounds: < 500 KB

### Herramientas de Optimización

- **TinyPNG/TinyJPG**: Compresión de PNG/JPG
- **ImageOptim**: Optimización para macOS
- **Squoosh**: Herramienta web de Google
- **Sharp**: CLI para optimización automática

### Carga Lazy

Para imágenes grandes, considerar carga lazy:

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={require('./placeholder.png')}
  contentFit="cover"
  transition={200}
/>
```

## 🔒 Assets Privados vs Públicos

### Assets Públicos
- Empaquetados con la app
- Siempre disponibles offline
- Incrementan el tamaño del bundle
- Ideales para UI crítico

### Assets Remotos
- Cargados desde CDN/servidor
- Reducen tamaño del bundle
- Requieren conexión
- Ideales para contenido dinámico

```typescript
// Asset local (bundled)
<Image source={require('./logo.png')} />

// Asset remoto
<Image source={{ uri: 'https://cdn.example.com/image.jpg' }} />
```

## 📚 Recursos

- Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- [Expo Assets](https://docs.expo.dev/develop/user-interface/assets/)
- [React Native Image](https://reactnative.dev/docs/image)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Lottie Animations](https://lottiefiles.com/)

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
