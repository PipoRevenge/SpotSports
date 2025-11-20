# Lib - Configuraciones de Librerías Externas

## 📦 Propósito

La carpeta `src/lib` contiene **configuraciones y wrappers de librerías externas** utilizadas en la aplicación. Centraliza la inicialización y configuración de servicios de terceros, facilitando su mantenimiento y reutilización.

## 🎯 ¿Qué va en Lib?

Los archivos en esta carpeta deben:
- ✅ **Configurar librerías externas** - Setup y inicialización de servicios
- ✅ **Exportar instancias configuradas** - Listas para usar en toda la app
- ✅ **Centralizar configuración** - Un solo punto de verdad para cada servicio
- ✅ **Manejar entornos** - Configuración diferente para dev/prod

## 📁 Estructura Actual

```
lib/
└── firebase-config.ts    # Configuración de Firebase y servicios relacionados
```

## 🔥 Firebase Configuration

**Archivo**: `firebase-config.ts`

Configuración centralizada de Firebase para autenticación, Firestore, Storage, Functions y Realtime Database.

### **Servicios Exportados**

```typescript
export {
  app,          // Instancia principal de Firebase App
  auth,         // Autenticación
  firestore,    // Cloud Firestore (base de datos)
  database,     // Realtime Database
  functions,    // Cloud Functions
  storage,      // Cloud Storage (archivos)
  localIp,      // IP del emulador (solo desarrollo)
}
```

### **Características**

#### 1. **Configuración por Entorno**
```typescript
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
```

📝 **Nota**: Las variables de entorno se definen en el archivo `.env` en la raíz del proyecto.

#### 2. **Persistencia Multi-Plataforma**
```typescript
const auth = Platform.OS === "web"
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
```

- **Web**: Usa IndexedDB + LocalStorage
- **Mobile**: Usa AsyncStorage de React Native

#### 3. **Emuladores en Desarrollo**
```typescript
if (__DEV__) {
  connectAuthEmulator(auth, `http://${localIp}:9099`);
  connectFirestoreEmulator(firestore, localIp, 8080);
  connectDatabaseEmulator(database, localIp, 9000);
  connectFunctionsEmulator(functions, localIp, 5001);
  connectStorageEmulator(storage, localIp, 9199);
}
```

**Puertos de Emuladores:**
- Authentication: `9099`
- Firestore: `8080`
- Realtime Database: `9000`
- Functions: `5001`
- Storage: `9199`

**IP del Emulador:**
- Android Emulator: `10.0.2.2` (default)
- Custom: Define `EXPO_PUBLIC_EMULATOR_IP` en `.env`

#### 4. **Región de Functions**
```typescript
const functions = getFunctions(app, 'europe-west1');
```

🌍 **Importante**: Las Cloud Functions están configuradas para la región `europe-west1`. Asegúrate de que tus functions estén desplegadas en la misma región.

### **Uso en la Aplicación**

#### **Autenticación**
```typescript
import { auth } from '@/src/lib/firebase-config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Login
const signIn = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

// Logout
const logout = async () => {
  await signOut(auth);
};
```

#### **Firestore (Base de Datos)**
```typescript
import { firestore } from '@/src/lib/firebase-config';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

// Obtener documento
const getSpot = async (spotId: string) => {
  const docRef = doc(firestore, 'spots', spotId);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

// Guardar documento
const saveSpot = async (spotId: string, data: any) => {
  const docRef = doc(firestore, 'spots', spotId);
  await setDoc(docRef, data);
};
```

#### **Storage (Archivos)**
```typescript
import { storage } from '@/src/lib/firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload imagen
const uploadImage = async (uri: string, path: string) => {
  const blob = await fetch(uri).then(r => r.blob());
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};
```

#### **Cloud Functions**
```typescript
import { functions } from '@/src/lib/firebase-config';
import { httpsCallable } from 'firebase/functions';

// Llamar función
const sendNotification = httpsCallable(functions, 'sendNotification');
const result = await sendNotification({ userId: '123', message: 'Hello' });
```

## 🔄 Flujo de Uso

```
.env (Variables de Entorno)
     ↓
lib/firebase-config.ts (Configuración)
     ↓
┌────┴────┬──────────┬──────────┐
│         │          │          │
API    Features   Context    Components
Repositories
```

## 📝 Convenciones

### Nomenclatura de Archivos
- Usar `kebab-case.ts`
- Nombre descriptivo de la librería/servicio
- Ejemplos: `firebase-config.ts`, `analytics-config.ts`, `sentry-config.ts`

### Estructura de Archivo de Configuración
```typescript
// 1. Imports
import { initializeLibrary } from 'external-library';

// 2. Configuración (desde env)
const config = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  // ...
};

// 3. Inicialización
const instance = initializeLibrary(config);

// 4. Configuración adicional (dev/prod)
if (__DEV__) {
  // Configuración de desarrollo
}

// 5. Exports
export { instance, config };
```

### Variables de Entorno
Todas las configuraciones sensibles deben usar variables de entorno:

```bash
# .env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ...
```

⚠️ **Importante**: 
- Usar prefijo `EXPO_PUBLIC_` para variables accesibles en el cliente
- Nunca hacer commit de archivos `.env` con valores reales
- Mantener un `.env.example` con las claves necesarias

## 🎯 Configuraciones Sugeridas

Otras librerías que podrían necesitar configuración:

### **Analytics** (Firebase Analytics / Mixpanel)
```typescript
// lib/analytics-config.ts
import analytics from '@react-native-firebase/analytics';

export const logEvent = (eventName: string, params?: object) => {
  analytics().logEvent(eventName, params);
};

export const setUserId = (userId: string) => {
  analytics().setUserId(userId);
};
```

### **Push Notifications** (Expo Notifications)
```typescript
// lib/notifications-config.ts
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export { Notifications };
```

### **Error Tracking** (Sentry)
```typescript
// lib/sentry-config.ts
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: __DEV__,
});

export { Sentry };
```

### **Maps** (Google Maps / Mapbox)
```typescript
// lib/maps-config.ts
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
```

## 🚫 Qué NO va en Lib

NO uses `src/lib/` para:

- ❌ **Lógica de negocio** → Usar `src/features/` o `src/api/`
- ❌ **Utilidades generales** → Usar `src/utils/`
- ❌ **Componentes** → Usar `src/components/`
- ❌ **Tipos** → Usar `src/types/`
- ❌ **Hooks** → Usar `src/hooks/`

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca hardcodear credenciales**
```typescript
// ❌ INCORRECTO
const apiKey = 'AIzaSyB1234567890';

// ✅ CORRECTO
const apiKey = process.env.EXPO_PUBLIC_API_KEY;
```

2. **Usar diferentes configs para entornos**
```typescript
const config = __DEV__ 
  ? { /* dev config */ }
  : { /* prod config */ };
```

3. **Validar variables de entorno**
```typescript
if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
  throw new Error('Firebase API key not configured');
}
```

4. **Logging seguro**
```typescript
// No loguear información sensible en producción
if (__DEV__) {
  console.log('Firebase config:', firebaseConfig);
}
```

## 📚 Recursos

- Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
