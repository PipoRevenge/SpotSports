# Rating Components

Componentes profesionales y reutilizables para mostrar y editar ratings en la aplicación.

## Componentes

### RatingStars

Componente para mostrar y editar ratings con estrellas (1-5 o personalizado). Soporta ratings decimales y visualización del valor numérico.

#### Props

```typescript
interface RatingStarsProps {
  value?: number;              // Rating actual (0-max) - prop principal
  rating?: number;             // Alias de value (para compatibilidad)
  max?: number;                // Máximo de estrellas (default: 5)
  maxStars?: number;           // Alias de max (para compatibilidad)
  onChange?: (value: number) => void;  // Callback al cambiar
  onRatingChange?: (value: number) => void;  // Alias (compatibilidad)
  size?: number | "sm" | "md" | "lg";  // Tamaño en pixeles o preset
  color?: string;              // Color estrellas llenas (default: #fbbf24)
  emptyColor?: string;         // Color estrellas vacías (default: #d1d5db)
  disabled?: boolean;          // Si está deshabilitado (default: false)
  editable?: boolean;          // Opuesto de disabled (compatibilidad)
  showValue?: boolean;         // Mostrar valor numérico entre paréntesis
  allowHalf?: boolean;         // Permitir medio rating (default: true)
}
```

#### Ejemplos

```tsx
// Solo lectura con valor numérico
<RatingStars rating={4.5} showValue={true} />

// Editable con selección de medio en medio
<RatingStars 
  value={rating} 
  onChange={setRating}
  size="lg"
  showValue={true}
/>

// Personalizado sin valor visible
<RatingStars 
  rating={8}
  maxStars={10}
  size={32}
  showValue={false}
  disabled
/>

// Tamaños predefinidos
<RatingStars rating={4.5} size="sm" showValue={true} />
<RatingStars rating={4.5} size="md" showValue={true} />
<RatingStars rating={4.5} size="lg" showValue={true} />
```

---

### RatingDifficulty

Componente para mostrar y editar niveles de dificultad.

#### Props

```typescript
type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

interface RatingDifficultyProps {
  difficulty: DifficultyLevel | number;  // Nivel o valor 1-10
  onDifficultyChange?: (difficulty: DifficultyLevel) => void;
  editable?: boolean;          // Si es editable (default: false)
  variant?: "badge" | "bar" | "buttons";  // Variante
  size?: "sm" | "md" | "lg";   // Tamaño
  showLabel?: boolean;         // Mostrar etiqueta (default: true)
}
```

#### Ejemplos

```tsx
// Badge simple
<RatingDifficulty difficulty="Intermediate" />

// Barra de progreso
<RatingDifficulty 
  difficulty={7} 
  variant="bar" 
/>

// Selector editable
<RatingDifficulty 
  difficulty={difficulty}
  onDifficultyChange={setDifficulty}
  editable
  variant="buttons"
/>
```

## Características

✅ **Totalmente tipado** con TypeScript
✅ **Accesible** con roles y labels
✅ **Responsivo** con múltiples tamaños
✅ **Personalizable** con props flexibles
✅ **Reutilizable** en toda la app
✅ **Profesional** con diseño limpio

## Uso en la App

### Reviews
- Rating general del spot
- Rating de calidad de cada deporte
- Nivel de dificultad de cada deporte

### Spots
- Tabla de deportes con ratings
- Vista de métricas de deportes

### Cualquier lugar
Los componentes son independientes y pueden usarse en cualquier parte de la app.
