# Componentes de Mapa

Esta carpeta contiene los componentes relacionados con la funcionalidad de mapas en la aplicación.

## Componentes

### `MapView` (map-view.tsx)
Componente base para mostrar un mapa usando `react-native-maps`.

### `MapMark` (map-mark.tsx)
Marcador personalizado genérico para mostrar ubicaciones en el mapa.

### `UserLocationMarker` (user-location-marker.tsx)
Marcador especial para la ubicación del usuario. Muestra un punto azul con un anillo para indicar "tú estás aquí".

### `SelectionMarker` (selection-marker.tsx)
Marcador para ubicaciones seleccionadas. Diseño de pin profesional con icono MapPin, ideal para marcar spots y ubicaciones específicas.

### `PointPicker` (point-picker.tsx)
Componente que permite al usuario seleccionar un punto en el mapa arrastrando el marcador central.

### `LocationPickerModal` (location-picker-modal.tsx)
Modal que muestra un mapa a pantalla completa para seleccionar una ubicación haciendo clic. Utiliza la ubicación del usuario como punto inicial y permite navegar libremente por el mapa. Incluye visualización de la ubicación actual del usuario y botón para volver a centrar el mapa.

## Hooks

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
