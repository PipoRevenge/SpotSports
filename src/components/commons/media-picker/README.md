# Media Picker Components

Componentes para seleccionar y mostrar archivos multimedia (fotos y videos).

## MediaPickerCarousel

Componente de selección múltiple de fotos y videos con vista de carrusel.

### Características

- ✅ Selección múltiple de imágenes y videos desde la galería
- ✅ Captura de fotos con la cámara
- ✅ Vista en carrusel de archivos seleccionados
- ✅ Miniaturas navegables
- ✅ Preview en pantalla completa
- ✅ Límite configurable de archivos
- ✅ Eliminación individual y en lote
- ✅ Validación obligatoria de al menos un archivo
- ✅ Indicadores visuales para videos (icono y duración)

### Uso

```tsx
import { MediaPickerCarousel, MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';

const [media, setMedia] = useState<MediaItem[]>([]);

<MediaPickerCarousel
  media={media}
  onMediaChange={setMedia}
  error={formErrors.media}
  maxCount={10} // Opcional, por defecto 10
/>
```

### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `media` | `MediaItem[]` | Sí | - | Array de archivos multimedia |
| `onMediaChange` | `(media: MediaItem[]) => void` | Sí | - | Callback cuando cambian los archivos |
| `error` | `string` | No | - | Mensaje de error a mostrar |
| `maxCount` | `number` | No | `10` | Número máximo de archivos permitidos |

### MediaItem Type

```typescript
interface MediaItem {
  uri: string;           // URI del archivo
  type: "image" | "video"; // Tipo de archivo
  thumbnail?: string;     // URI de la miniatura (opcional)
  duration?: number;      // Duración en ms para videos (opcional)
}
```

### Restricciones

- Máximo 10 archivos por defecto (configurable)
- Videos: máximo 60 segundos de duración
- Formatos soportados: Los permitidos por Expo Image Picker

### Permisos

El componente solicita automáticamente los permisos necesarios:
- `MEDIA_LIBRARY` para seleccionar desde la galería
- `CAMERA` para tomar fotos

### Ejemplo completo en formulario

```tsx
import { MediaPickerCarousel, MediaItem } from '@/src/components/commons/media-picker/media-picker-carousel';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/src/components/ui/form-control';

const MyForm = () => {
  const [formData, setFormData] = useState({
    media: [] as MediaItem[]
  });
  const [errors, setErrors] = useState({});

  const handleMediaChange = (newMedia: MediaItem[]) => {
    setFormData(prev => ({ ...prev, media: newMedia }));
    // Limpiar error si existía
    if (errors.media) {
      setErrors(prev => ({ ...prev, media: undefined }));
    }
  };

  return (
    <FormControl isInvalid={!!errors.media} isRequired>
      <FormControlLabel>
        <FormControlLabelText>Fotos y Videos</FormControlLabelText>
      </FormControlLabel>
      <MediaPickerCarousel
        media={formData.media}
        onMediaChange={handleMediaChange}
        error={errors.media}
        maxCount={5}
      />
    </FormControl>
  );
};
```

## Integración con validaciones

Función de validación para uso con formularios:

```typescript
export const validateMedia = (media: MediaItem[]): string | null => {
  if (!media || media.length === 0) {
    return "Debe añadir al menos una foto o video";
  }
  return null;
};
```
