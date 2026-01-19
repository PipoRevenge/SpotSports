# Review Feature

## 📦 Status

**Status:** Partial — UI y validaciones implementadas; API/Repository e integración con Storage pendientes (ver checklist abajo).

Feature completa para la gestión de reseñas de spots deportivos.

## 🎯 Estado de Desarrollo

- ✅ **Interfaz completa del formulario**
- ✅ **Validaciones y tipos**
- ✅ **Componentes UI funcionales**
- ⏳ **API/Repository (pendiente implementación)**

## 📋 Estructura

```
review/
├── components/
│   ├── review-create/
│   │   ├── review-create-form.tsx      # Formulario principal de creación
│   │   ├── rating-stars.tsx            # Componente de estrellas para rating
│   │   ├── sport-rating-item.tsx       # Item individual para calificar deporte
│   │   └── add-sport-modal.tsx         # Modal para añadir deportes
│   └── review-view/
│       └── review-card.tsx             # (Pendiente) Card para mostrar review
├── hooks/
│   └── use-review-create.ts            # Hook para crear reviews
├── types/
│   └── review-types.ts                 # Tipos TypeScript
├── utils/
│   ├── review-constants.ts             # Constantes y configuración
│   └── review-validation.ts            # Funciones de validación
└── index.ts                            # Exports públicos
```

## 🎯 Características Implementadas

### CreateReviewForm

Formulario completo para crear una reseña que incluye:

1. **Rating General del Spot** (1-5 estrellas)
   - Obligatorio
   - Componente visual con estrellas interactivas

2. **Contenido de la Review**
   - Texto obligatorio (10-1000 caracteres)
   - Contador de caracteres
   - Validación en tiempo real

3. **Multimedia (Opcional)**
   - Fotos y videos
   - Máximo 10 archivos
   - Usa el componente `MediaPickerCarousel`
   - Soporte para galería y cámara

4. **Calificación de Deportes**
   - Obligatorio al menos 1 deporte
   - Máximo 10 deportes
   - Para cada deporte:
     - Rating de calidad (1-5 estrellas)
     - Nivel de dificultad (Beginner/Intermediate/Advanced/Expert)
   - Buscador integrado para añadir deportes
   - Prevención de duplicados

### Componentes Auxiliares

- **RatingStars**: Componente reutilizable para mostrar/editar ratings
- **SportRatingItem**: Card individual para calificar cada deporte
- **AddSportModal**: Modal con buscador de deportes integrado

## 📝 Uso

### Uso Básico

```tsx
import { CreateReviewForm, useReviewCreate } from '@/src/features/review';

function MyReviewScreen() {
  const { createReview, isLoading, error } = useReviewCreate();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data) => {
    await createReview(data);
    setShowForm(false);
    // Navegar o actualizar UI
  };

  return (
    <CreateReviewForm
      spotId="spot-123"
      spotSports={[]} // Opcional: lista de deportes del spot
      onSubmit={handleSubmit}
      onCancel={() => setShowForm(false)}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### Props del Formulario

```typescript
interface CreateReviewFormProps {
  spotId: string;                    // ID del spot a revisar
  spotSports?: SimpleSport[];        // Deportes disponibles en el spot
  onSubmit: (data: CreateReviewData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}
```

### Datos de Salida

```typescript
interface CreateReviewData {
  spotId: string;
  content: string;
  rating: number;                    // 1-5
  reviewSports: ReviewSportFormData[];
  media?: string[];                  // URIs de medios
}

interface ReviewSportFormData {
  sportId: string;
  name: string;
  sportRating: number;               // 1-5
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}
```

## ✅ Validaciones

El formulario incluye validaciones completas:

- **Contenido**: 10-1000 caracteres
- **Rating**: 1-5 estrellas (obligatorio)
- **Deportes**: 
  - Mínimo 1, máximo 10
  - Cada deporte debe tener rating y dificultad
  - No se permiten duplicados
- **Media**: Máximo 10 archivos

## 🔧 Configuración

Todas las constantes están centralizadas en `review-constants.ts`:

```typescript
export const REVIEW_VALIDATION_LIMITS = {
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 1000,
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_MEDIA_COUNT: 10,
  MIN_SPORTS_COUNT: 1,
  MAX_SPORTS_COUNT: 10,
};
```

## 🎨 Niveles de Dificultad

Los niveles de dificultad tienen colores diferenciados:

- **Beginner**: Verde
- **Intermediate**: Azul
- **Advanced**: Naranja
- **Expert**: Rojo

## 🔌 Integración Pendiente

### API Repository

La interfaz `IReviewRepository` está definida en:
`src/api/repositories/interfaces/i-review-repository.ts`

Métodos disponibles:
- `createReview(reviewData)`: Crear review
- `getReviewById(reviewId)`: Obtener review
- `getReviewsBySpot(spotId)`: Reviews de un spot
- `getReviewsByUser(userId)`: Reviews de un usuario
- `updateReview(reviewId, updates)`: Actualizar
- `deleteReview(reviewId)`: Eliminar (soft delete)
- `likeReview(reviewId, userId)`: Dar like
- `unlikeReview(reviewId, userId)`: Quitar like
- `reportReview(reviewId, userId, reason)`: Reportar

### Implementación Requerida

Para conectar con Firebase u otro backend:

1. Implementar `IReviewRepository` en `src/api/repositories/implementations/`
2. Actualizar el hook `useReviewCreate` para usar el repositorio
3. Implementar subida de archivos multimedia a Storage
4. Añadir integración con React Query para mutaciones y cache invalidation (useMutation, invalidateQueries)
5. Añadir tests unitarios para `useReviewCreate` y pruebas de integración para el repositorio

#### Checklist sugerida
- [ ] Crear `i-review-repository.ts` (contrato) si no existe
- [ ] Implementar `review-repository-impl.ts` en `src/api/repositories/implementations/`
- [ ] Implementar `uploadMedia(files: string[]): Promise<string[]>` en `src/lib` o `src/api` (usa Firebase Storage)
- [ ] Migrar `useReviewCreate` para usar `useMutation` de React Query y llamar al `reviewRepository`
- [ ] Invalidar queries relevantes (`['reviews','spot', spotId]`, `['user','reviews', userId]`) en `onSuccess`
- [ ] Agregar tests: repo tests + hook tests (mock storage and firebase)

#### Ejemplo (useReviewCreate con React Query)
```typescript
// src/features/review/hooks/use-review-create.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewRepository } from '@/src/api';
import { uploadMedia } from '@/src/lib/upload';

export const useReviewCreate = (spotId: string) => {
  const qc = useQueryClient();

  return useMutation(async (data: CreateReviewData) => {
    const mediaUrls = data.media && data.media.length > 0
      ? await uploadMedia(data.media)
      : [];

    return await reviewRepository.createReview({ ...data, media: mediaUrls });
  }, {
    onSuccess: () => {
      qc.invalidateQueries(['reviews','spot', spotId]);
      qc.invalidateQueries(['user','reviews']);
    }
  });
};
```

**Notas:**
- Usa `@tanstack/react-query` para manejar la mutación y el comportamiento optimista si procede.
- Centraliza la subida de archivos en `src/lib/upload` para reutilización y testabilidad.

## 📌 Nuevas utilidades agregadas

- `useUserReviews(userId)`: Hook para recuperar las reviews de un usuario junto con los datos de los spots referenciados. Ideal para mostrar la actividad de un perfil.
- `UserReviewList`: Componente de lista que renderiza las reviews de un usuario y muestra información del spot en la cabecera de cada review; permite navegación hacia el spot (a través de callbacks) y eliminación de la review si corresponde.


## 🚀 Próximos Pasos

1. Implementar el repositorio de Firebase
2. Añadir subida de multimedia a Firebase Storage
3. Implementar `review-card.tsx` para mostrar reviews
4. Añadir edición de reviews existentes
5. Implementar likes/dislikes
6. Añadir sistema de comentarios
7. Implementar reportes

## 📱 Capturas de Funcionalidad

El formulario incluye:
- ✅ Rating visual con estrellas
- ✅ Selector de multimedia con preview
- ✅ Buscador de deportes integrado
- ✅ Gestión de múltiples deportes
- ✅ Selector de dificultad con colores
- ✅ Validación en tiempo real
- ✅ Mensajes de error claros
- ✅ Estados de carga

## 🐛 Notas de Desarrollo

- El formulario usa el componente `MediaPickerCarousel` existente
- Integra el buscador de deportes de la feature `sport`
- Todos los estilos usan Tailwind CSS (NativeWind)
- Componentes UI de gluestack-ui
- Validaciones centralizadas y reutilizables
