# Componentes de Mapa

Esta carpeta contiene los componentes relacionados con la funcionalidad de mapas en la aplicación. Proporciona una **abstracción de react-native-maps** para facilitar su uso en toda la aplicación.

## Arquitectura

Los componentes en esta carpeta siguen el patrón **Adapter** para abstraer `react-native-maps` y proporcionar una API consistente y reutilizable. Todos los componentes están diseñados para ser genéricos y pueden ser utilizados en cualquier feature de la aplicación.

## Componentes Core

### `MapView` (map-view.tsx)
Componente base para mostrar un mapa usando `react-native-maps`.

**Características:**
- Configuración por defecto (proveedor Google)
- Estilos personalizados
- Soporte para bordes redondeados
- Forwardea ref para acceder a la API del mapa

**Uso:**
```tsx
import { MapView } from '@/src/components/commons/map';

<MapView
  ref={mapRef}
  initialRegion={region}
  onRegionChangeComplete={(region) => console.log(region)}
  containerStyle={{ flex: 1 }}
>
  {/* Marcadores y overlays */}
</MapView>
```

### `MapMarker` (map-marker.tsx)
Marcador genérico y personalizable para el mapa.

**Características:**
- Soporte para render props (contenido personalizado)
- Callouts personalizados mediante `renderCallout`
- Estados de selección
- Icono por defecto configurable
- Integración con `MapCallout`

**Uso:**
```tsx
import { MapMarker } from '@/src/components/commons/map';

// Marcador simple
<MapMarker
  coordinate={{ latitude: 40.4168, longitude: -3.7038 }}
  data={spot}
  color="#ef4444"
  onPress={() => handlePress(spot)}
/>

// Marcador con contenido personalizado
<MapMarker
  coordinate={{ latitude: 40.4168, longitude: -3.7038 }}
  data={spot}
  isSelected={selectedId === spot.id}
  renderMarkerContent={(spot, isSelected) => (
    <View className={`p-2 ${isSelected ? 'bg-green-500' : 'bg-red-500'}`}>
      <Text>🏀</Text>
    </View>
  )}
  renderCallout={(spot) => (
    <View className="bg-white p-3 rounded-lg">
      <Text>{spot.name}</Text>
    </View>
  )}
/>
```

### `MapCallout` (map-callout.tsx)
Componente de callout genérico que abstrae `Callout` de react-native-maps.

**Características:**
- Render prop pattern para contenido personalizado
- Soporte para modo tooltip
- Manejo de eventos de press

**Uso:**
```tsx
import { MapCallout } from '@/src/components/commons/map';

<MapCallout
  data={spot}
  tooltip={true}
  onPress={(spot) => navigate(`/spot/${spot.id}`)}
  renderContent={(spot) => (
    <View className="bg-white p-3 rounded-lg">
      <Text>{spot.name}</Text>
      <Text>{spot.rating} ⭐</Text>
    </View>
  )}
/>
```

### `MapCircle` (map-circle.tsx)
Componente para mostrar círculos en el mapa (áreas, rangos de distancia, etc.).

**Características:**
- Configuración de colores y bordes
- Radio en metros
- Útil para rangos de búsqueda

**Uso:**
```tsx
import { MapCircle } from '@/src/components/commons/map';

<MapCircle
  center={{ latitude: 40.4168, longitude: -3.7038 }}
  radius={5000} // 5km en metros
  strokeColor="rgba(59, 130, 246, 0.8)"
  fillColor="rgba(59, 130, 246, 0.1)"
  strokeWidth={2}
/>
```

## Marcadores Especializados

### `UserLocationMarker` (user-location-marker.tsx)
Marcador especial para la ubicación del usuario. Muestra un punto azul con un anillo para indicar "tú estás aquí".

**Uso:**
```tsx
import { UserLocationMarker } from '@/src/components/commons/map';

<UserLocationMarker
  latitude={userLocation.latitude}
  longitude={userLocation.longitude}
  size={24}
/>
```

### `SelectionMarker` (selection-marker.tsx)
Marcador para ubicaciones seleccionadas. Diseño de pin profesional con icono MapPin, ideal para marcar spots y ubicaciones específicas.

### `MapMark` (map-mark.tsx) ⚠️ **DEPRECATED**
Marcador legacy. Usar `MapMarker` en su lugar para nuevas implementaciones.

## Utilidades

### `PointPicker` (point-picker.tsx)
Componente que permite al usuario seleccionar un punto en el mapa arrastrando el marcador central.

### `LocationPickerModal` (location-picker-modal.tsx)
Modal que muestra un mapa a pantalla completa para seleccionar una ubicación haciendo clic. Utiliza la ubicación del usuario como punto inicial y permite navegar libremente por el mapa. Incluye visualización de la ubicación actual del usuario y botón para volver a centrar el mapa.

## Tipos

### `types.ts`
Archivo con todos los tipos TypeScript compartidos:

- **Coordenadas:** `Coordinates`, `Location`, `MapRegion`
- **Marcadores:** `BaseMarkerProps`, `CustomMarkerProps`
- **Callouts:** `BaseCalloutProps`, `CustomCalloutProps`
- **Configuración:** `MapConfig`, `MapMarkerConfig`, `MapRegionConfig`, `MapCircleProps`
- **Estilos:** `MapTheme`, `MapStyleConfig`

## Hooks Relacionados

### `useUserLocation` (src/hooks/use-user-location.ts)
Hook para obtener la ubicación actual del usuario usando `expo-location`.

```typescript
const { location, isLoading, error, requestLocation } = useUserLocation();
```

## Ejemplo de Uso

### LocationPickerModal

```tsx
import { LocationPickerModal } from '@/src/components/commons/map/location-picker-modal';
import { useState } from 'react';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationConfirm = (location) => {
    setSelectedLocation(location);
    console.log('Ubicación seleccionada:', location);
  };

  return (
    <>
      <Button onPress={() => setIsModalOpen(true)}>
        Seleccionar Ubicación
      </Button>

      <LocationPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={selectedLocation}
        title="Seleccionar Ubicación"
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </>
  );
}
```

## Características

- ✅ Obtiene automáticamente la ubicación del usuario
- ✅ Solicita permisos de ubicación
- ✅ **Visualiza tu ubicación actual con diseño claro** (punto azul con anillo indicador)
- ✅ Permite seleccionar un punto haciendo clic en el mapa
- ✅ Navegación libre por el mapa (zoom, pan)
- ✅ **Botón flotante para volver a centrar en tu ubicación**
- ✅ **Marcadores diferenciados y profesionales**:
  - 📍 Punto azul con anillo: Tu ubicación
  - 📍 Pin rojo con icono MapPin: Ubicación seleccionada
- ✅ Muestra coordenadas de ambas ubicaciones en tiempo real
- ✅ Maneja errores de permisos denegados
- ✅ Ubicación por defecto si no se obtienen permisos
- ✅ Modal a pantalla completa con mejor UX
- ✅ Animaciones suaves al centrar el mapa

## Permisos

Para usar la funcionalidad de ubicación, asegúrate de tener configurados los permisos en `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Permitir que $(PRODUCT_NAME) use tu ubicación."
        }
      ]
    ]
  }
}
```
