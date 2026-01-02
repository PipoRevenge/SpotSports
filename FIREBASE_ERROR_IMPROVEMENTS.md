# Mejoras en Logging y Manejo de Errores de Firebase

## Resumen de Cambios

Se han implementado mejoras exhaustivas en el sistema de logging y manejo de errores para diagnosticar y resolver problemas relacionados con la creación de spots y operaciones de Firebase.

## Problema Original

El error `FirebaseError: INTERNAL` ocurría después de que los archivos se subían correctamente a Firebase Storage, pero la creación del documento del spot en Firestore fallaba. Los logs no proporcionaban suficiente contexto para diagnosticar el problema.

```
LOG  File uploaded successfully. URL: http://...
ERROR  Error creating spot: [FirebaseError: INTERNAL] FirebaseError: INTERNAL
```

## Soluciones Implementadas

### 1. Utilidad de Parseo de Errores de Firebase

**Archivo**: `src/api/repositories/utils/firebase-parsers.ts`

Se agregó la función `parseFirebaseError` que:
- Convierte códigos de error de Firebase en mensajes amigables en español
- Registra información detallada del error (código, mensaje, stack trace)
- Maneja diferentes tipos de errores (FirebaseError, Error, errores desconocidos)

```typescript
export const parseFirebaseError = (error: unknown): {
  message: string;
  code?: string;
  details?: any;
} => {
  // Mapea códigos de error comunes a mensajes en español
  // Registra información completa del error
  // Retorna formato consistente
}
```

**Códigos de error mapeados**:
- `permission-denied`: No tienes permisos
- `unauthenticated`: Debes iniciar sesión
- `internal`: Error interno del servidor
- `unavailable`: Servicio no disponible
- `invalid-argument`: Datos inválidos
- Y más...

### 2. Logging Mejorado en el Repositorio

**Archivo**: `src/api/repositories/implementations/spot-repository-impl.ts`

**Mejoras en `createSpot`**:
```typescript
// ✅ Log al inicio con contexto
console.log('[SpotRepository:createSpot] Starting spot creation', {
  userId,
  spotName: spotData.name,
  mediaCount: spotData.media?.length || 0,
  timestamp: new Date().toISOString(),
});

// ✅ Log de progreso de subida de archivos
console.log('[SpotRepository:createSpot] Media upload completed', {
  count: galleryUrls.length,
  durationMs: uploadDuration,
  urls: galleryUrls,
});

// ✅ Log del payload de la función callable
console.log('[SpotRepository:createSpot] Function payload', {
  ...functionCallData,
  galleryUrls: `${galleryUrls.length} URLs`,
});

// ✅ Log de éxito con métricas de rendimiento
console.log('[SpotRepository:createSpot] Spot created successfully', {
  spotId,
  totalDurationMs: totalDuration,
  functionDurationMs: functionDuration,
});

// ✅ Log de error con contexto completo
console.error('[SpotRepository:createSpot] Failed to create spot', {
  error,
  errorMessage: error instanceof Error ? error.message : 'Unknown error',
  errorCode: (error as any)?.code,
  errorDetails: (error as any)?.details,
  userId,
  spotName: spotData.name,
  durationMs: totalDuration,
});
```

### 3. Logging Mejorado en Storage Service

**Archivo**: `src/api/lib/storage-service.ts`

**Mejoras en funciones de storage**:
```typescript
// ✅ resolveStorageUrl
console.log('[StorageService:resolveStorageUrl] Resolving path:', path);

// ✅ uploadFile con métricas
console.log('[StorageService:uploadFile] Starting upload', {
  path,
  size: file.size,
  type: file.type,
});

console.log('[StorageService:uploadFile] Upload completed', {
  path,
  url,
  size: file.size,
  durationMs: duration,
});

// ✅ Errores parseados
const parsedError = parseFirebaseError(error);
console.error('[StorageService:uploadFile] Upload failed', {
  path,
  size: file.size,
  durationMs: duration,
  error: parsedError,
});
```

### 4. Logging Exhaustivo en Cloud Function

**Archivo**: `firebase-backend/functions/src/domains/spots/callables/createSpot.ts`

**Mejoras**:
```typescript
// ✅ ID de operación único para rastreo
const operationId = `createSpot_${Date.now()}`;

// ✅ Log de inicio con contexto
logInfo(`[${operationId}] Starting spot creation`, {
  hasAuth: !!request.auth,
  userId: request.auth?.uid,
  dataKeys: Object.keys(request.data || {}),
});

// ✅ Log de datos recibidos
logInfo(`[${operationId}] Request data`, {
  userId,
  name,
  description: description?.substring(0, 50) + '...',
  location,
  sportsCount: availableSports?.length,
  mediaCount: galleryUrls?.length,
});

// ✅ Log detallado de validaciones fallidas
logError(`[${operationId}] Missing required fields`, {
  hasName: !!name,
  hasDescription: !!description,
  hasLocation: !!location,
  hasSports: !!availableSports,
});

// ✅ Log de operación de base de datos
logInfo(`[${operationId}] Writing spot document to Firestore`);
const dbStartTime = Date.now();
const spotRef = await db.collection('spots').add(spotData);
const dbDuration = Date.now() - dbStartTime;

// ✅ Log de éxito con métricas
logInfo(`[${operationId}] Spot created successfully`, {
  userId,
  spotId: spotRef.id,
  dbDurationMs: dbDuration,
  totalDurationMs: totalDuration,
});

// ✅ Log de error exhaustivo
logError(`[${operationId}] Failed to create spot`, {
  error: errorMessage,
  errorCode,
  stack: errorStack,
  userId,
  name,
  durationMs: totalDuration,
  location,
  sportsCount: availableSports?.length,
  mediaCount: galleryUrls?.length,
});
```

### 5. Componente de Pantalla de Carga Reutilizable

**Archivo**: `src/components/commons/loading-screen/loading-screen.tsx`

Componente siguiendo la arquitectura del proyecto:
- **Ubicación**: `src/components/commons/` (componente común reutilizable)
- **Props**: visible, message, subMessage, spinnerSize
- **Uso**: Operaciones asíncronas como crear spots, subir archivos

```tsx
<LoadingScreen
  visible={isLoading}
  message="Creando spot..."
  subMessage="Por favor espera, esto puede tomar unos segundos"
/>
```

### 6. Manejo de Errores Mejorado en el Hook

**Archivo**: `src/features/spot/hooks/use-create-spot.ts`

**Mejoras**:
```typescript
// ✅ Logs en cada etapa
console.log('[useCreateSpot] Starting spot creation', {
  hasUser: !!user,
  mediaCount: formData.media?.length || 0,
});

// ✅ Validación con logs
console.error('[useCreateSpot] Form validation failed', validation.errors);

// ✅ Error parsing con parseFirebaseError
onError: (error: unknown) => {
  const parsedError = parseFirebaseError(error);
  console.error('[useCreateSpot] Mutation failed', parsedError);
  
  setState({
    isLoading: false,
    error: parsedError.message,
    success: false
  });
}
```

### 7. UX Mejorada en el Formulario

**Archivo**: `src/features/spot/components/spot-create/spot-create-form.tsx`

**Mejoras**:
```tsx
// ✅ Loading screen integrada
<LoadingScreen
  visible={isLoading}
  message={uploadProgress || "Creando spot..."}
  subMessage="Por favor espera, esto puede tomar unos segundos"
/>

// ✅ Manejo de errores mejorado
try {
  // Mostrar progreso de archivos
  if (formData.media && formData.media.length > 0) {
    setUploadProgress(`Subiendo archivos (0/${formData.media.length})...`);
  }

  const spotId = await createSpot(formData);
  
  if (spotId) {
    showSuccess('El spot ha sido creado correctamente', '¡Éxito!');
    onSuccess?.(spotId);
  } else {
    showError(error || 'No se pudo crear el spot', 'Error');
  }
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
  showError(errorMessage, 'Error al crear spot');
}

// ✅ Errores de validación mostrados con alertas
if (!validation.isValid) {
  const firstError = Object.values(validation.errors)[0];
  if (firstError) {
    showError(firstError, 'Error de validación');
  }
}
```

## Beneficios

### 1. Diagnóstico Mejorado
- **Antes**: `ERROR FirebaseError: INTERNAL` sin contexto
- **Ahora**: Logs detallados en cada capa con timestamp, IDs de operación, y métricas

### 2. Rastreo de Flujo Completo
```
[useCreateSpot] Starting spot creation { hasUser: true, mediaCount: 2 }
[SpotRepository:createSpot] Starting spot creation { userId: "abc", spotName: "Mi Spot" }
[SpotRepository:createSpot] Uploading 2 media files
[StorageService:uploadFile] Starting upload { path: "spots/.../gallery/...", size: 1024000 }
[StorageService:uploadFile] Upload completed { durationMs: 1234 }
[SpotRepository:createSpot] Media upload completed { count: 2, durationMs: 2500 }
[SpotRepository:createSpot] Calling cloud function spots_create
[createSpot_1234567890] Starting spot creation { userId: "abc" }
[createSpot_1234567890] Writing spot document to Firestore
[createSpot_1234567890] Spot created successfully { spotId: "xyz", totalDurationMs: 450 }
[SpotRepository:createSpot] Spot created successfully { spotId: "xyz", totalDurationMs: 3200 }
```

### 3. Métricas de Rendimiento
- Duración de subida de cada archivo
- Duración total de subida de archivos
- Duración de llamada a cloud function
- Duración de operación de Firestore
- Duración total de la operación

### 4. Mensajes de Error Amigables
- **Antes**: "FirebaseError: INTERNAL"
- **Ahora**: "Error interno del servidor. Por favor, intenta nuevamente"

### 5. UX Mejorada
- Loading screen con mensajes contextuales
- Indicación de progreso de subida
- Errores mostrados con alertas amigables
- Validación con feedback inmediato

## Uso del Sistema de Logging

### Formato de Logs

```typescript
// ✅ Logs informativos
console.log('[Component:method] Descripción', {
  param1: value1,
  param2: value2,
  timestamp: new Date().toISOString(),
});

// ✅ Logs de error
console.error('[Component:method] Error description', {
  error: parsedError,
  context: contextData,
  timestamp: new Date().toISOString(),
});
```

### Convenciones
1. **Prefijo**: `[ComponenteName:methodName]`
2. **Contexto**: Siempre incluir datos relevantes
3. **Timestamps**: Para operaciones críticas
4. **Métricas**: Duración cuando sea relevante

## Siguientes Pasos

1. **Monitorear logs** después del deployment para identificar el problema real
2. **Agregar retry logic** si los errores son transitorios
3. **Implementar telemetría** (Firebase Analytics, Crashlytics)
4. **Agregar validación de URLs** antes de crear el documento
5. **Timeout handling** para operaciones largas

## Archivos Modificados

1. ✅ `src/api/repositories/utils/firebase-parsers.ts` - Parser de errores
2. ✅ `src/api/repositories/implementations/spot-repository-impl.ts` - Logging en repositorio
3. ✅ `src/api/lib/storage-service.ts` - Logging en storage
4. ✅ `firebase-backend/functions/src/domains/spots/callables/createSpot.ts` - Logging en backend
5. ✅ `src/components/commons/loading-screen/` - Nuevo componente de carga
6. ✅ `src/features/spot/hooks/use-create-spot.ts` - Hook mejorado
7. ✅ `src/features/spot/components/spot-create/spot-create-form.tsx` - Formulario mejorado

## Ejemplo de Uso del LoadingScreen

```tsx
import { LoadingScreen } from '@/src/components/commons/loading-screen';

// En cualquier componente
<LoadingScreen
  visible={isLoading}
  message="Procesando..."
  subMessage="Esto puede tardar unos segundos"
  spinnerSize="large"
/>
```

## Testing

Para probar las mejoras:
1. Intentar crear un spot con archivos multimedia
2. Revisar los logs en la consola
3. Observar la pantalla de carga
4. Verificar mensajes de error amigables si algo falla

Los logs ahora proporcionarán información completa para diagnosticar cualquier problema.
