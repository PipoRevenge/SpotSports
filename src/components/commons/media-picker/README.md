# Media Picker Components

Componente flexible y reutilizable para seleccionar, visualizar y gestionar archivos multimedia (fotos y videos).

## MediaPickerCarousel

### Características

- ✅ **Selector de galería** - Múltiples archivos
- ✅ **Cámara** - Tomar fotos directamente
- ✅ **Preview modal** - Vista completa de imágenes/videos
- ✅ **Carrusel interactivo** - Navegación suave
- ✅ **Miniaturas** - Vista rápida de todos los archivos
- ✅ **Límites configurables** - Min/max personalizables
- ✅ **Validación** - Mensajes de error
- ✅ **Responsive** - Adapta al tamaño de pantalla

### Props

```typescript
interface MediaPickerCarouselProps {
  media: MediaItem[];                    // Array de archivos multimedia
  onMediaChange: (media: MediaItem[]) => void;  // Callback al cambiar
  error?: string;                        // Mensaje de error
  maxCount?: number;                     // Máximo de archivos (default: 10)
  minCount?: number;                     // Mínimo de archivos (default: 0)
  required?: boolean;                    // Si es obligatorio (default: false)
  title?: string;                        // Título del componente
  emptyMessage?: string;                 // Mensaje cuando está vacío
  emptyDescription?: string;             // Descripción cuando está vacío
}

interface MediaItem {
  uri: string;                           // URI del archivo
  type: "image" | "video";               // Tipo de archivo
  thumbnail?: string;                    // Miniatura (opcional)
  duration?: number;                     // Duración del video (opcional)
}
```

### Ejemplos de Uso

#### Spots (Requerido, 1-10 archivos)

```tsx
<MediaPickerCarousel
  media={formData.media}
  onMediaChange={handleMediaChange}
  error={formErrors.media}
  maxCount={10}
  minCount={1}
  required
  title="Fotos y Videos del Spot"
  emptyMessage="No hay archivos multimedia"
  emptyDescription="Añade fotos o videos del spot"
/>
```

#### Reviews (Opcional, 0-5 archivos)

```tsx
<MediaPickerCarousel
  media={formData.media}
  onMediaChange={handleMediaChange}
  maxCount={5}
  minCount={0}
  required={false}
  title="Photos & Videos"
  emptyMessage="No media added yet"
  emptyDescription="Add photos or videos of your experience"
/>
```

#### Perfil de Usuario (1 archivo obligatorio)

```tsx
<MediaPickerCarousel
  media={formData.profilePicture ? [formData.profilePicture] : []}
  onMediaChange={(media) => setProfilePicture(media[0])}
  maxCount={1}
  minCount={1}
  required
  title="Foto de Perfil"
  emptyMessage="No tienes foto de perfil"
  emptyDescription="Añade una foto de perfil"
/>
```
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
import { z } from 'zod';

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

const mediaItemSchema = z.object({
  uri: z.string().min(1, 'Media URI is required'),
  type: z.enum(['image', 'video']),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
});

export const mediaArraySchema = z.array(mediaItemSchema)
  .min(1, 'At least one photo or video must be added');

export const validateMedia = (media: MediaItem[]): string | null => {
  const result = mediaArraySchema.safeParse(media);
  return result.success ? null : result.error.errors[0].message;
};
```
