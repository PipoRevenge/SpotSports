# Spot Collection Feature

Feature independiente para gestionar las colecciones de spots guardados por el usuario.

## Estructura

```
spot-collection/
├── hooks/
│   └── use-spot-collection.ts    # Hook principal para operaciones CRUD
├── components/
│   ├── spot-collection-button.tsx    # Botón para abrir selector
│   └── spot-collection-modal.tsx     # Modal/ActionSheet para seleccionar categorías
├── constants/
│   └── categories.ts             # Configuración de categorías (Favorites, Visited, WantToVisit)
└── index.ts                      # Exportaciones públicas
```

## Uso

### Hook useSpotCollection

```typescript
import { useSpotCollection } from "@/src/features/spot-collection";

const { 
  categories,           // Categorías del spot actual
  savedSpots,          // Spots guardados cargados
  isLoading,
  hasCategories,       // Booleano si tiene categorías
  loadSavedSpots,      // Cargar spots de una categoría
  addToCategories,     // Añadir a categorías
  removeFromCategories,// Quitar de categorías
  toggleCategory       // Toggle categoría
} = useSpotCollection(spotId);
```

### Componentes

```typescript
import { 
  SpotCollectionButton, 
  SpotCollectionModal,
  showSpotCollectionActionSheet 
} from "@/src/features/spot-collection";

// Botón
<SpotCollectionButton 
  hasCategories={hasCategories} 
  onPress={handleOpen}
  disabled={isLoading}
/>

// Modal Android
<SpotCollectionModal
  visible={modalVisible}
  categories={categories}
  isLoading={isLoading}
  onToggleCategory={toggleCategory}
  onClose={() => setModalVisible(false)}
/>

// ActionSheet iOS
showSpotCollectionActionSheet(categories, toggleCategory);
```

## Principios

- ✅ Independencia total de otras features
- ✅ Solo usa la API global (userRepository)
- ✅ No contiene páginas, solo componentes reutilizables
- ✅ Sin utils ni types innecesarios (usa los de entities)
- ✅ Sigue patrón bullet-proof-react
