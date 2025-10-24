# Sports Feature - Selector de Deportes

Esta feature proporciona componentes reutilizables para la selección y gestión de deportes en la aplicación, integrada con la API y base de datos.

## Componentes

### `SportsSelector` (SportsSelectorModal)

Componente modal principal para seleccionar deportes disponibles en un spot, con capacidad de cargar deportes desde la API, buscar nuevos deportes y crear deportes personalizados. Abre como modal de pantalla completa con tres modos de vista: selección, búsqueda y creación.

#### Props

- `selectedSports`: Array de IDs de deportes seleccionados
- `onSportsChange`: Callback que se ejecuta cuando cambia la selección
- `error`: Mensaje de error a mostrar (opcional)
- `required`: Si el campo es requerido (opcional, default: false)
- `availableSports`: Lista personalizada de deportes (opcional, si no se proporciona usa la API)
- `allowCreate`: Permite crear nuevos deportes (opcional, default: false)
- `allowSearch`: Permite buscar deportes adicionales (opcional, default: true)
- `onCreateSport`: Función personalizada para crear deportes (opcional)

#### Características del Modal

- **Vista de Selección**: Lista con checkboxes de todos los deportes disponibles
- **Vista de Búsqueda**: Integra `SportSearch` para buscar deportes en la base de datos
- **Vista de Creación**: Integra `CreateSportForm` para crear deportes nuevos
- **Navegación fluida**: Cambia entre vistas sin cerrar el modal
- **Contador de selección**: Muestra cuántos deportes están seleccionados
- **Validación visual**: Indica cuando el campo es requerido y no hay selección

#### Uso básico

```tsx
import { SportsSelector } from "@/src/features/sport";

function MyComponent() {
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  return (
    <SportsSelector
      selectedSports={selectedSports}
      onSportsChange={setSelectedSports}
      required={true}
      allowCreate={true}
      allowSearch={true}
    />
  );
}
```

#### Uso como slot en SpotCreateForm

```tsx
import { SportsSelector } from "@/src/features/sport";
import { SpotCreateForm } from "@/src/features/spot";

function CreateSpotScreen() {
  const SportsSlot = useCallback((props: any) => (
    <SportsSelector
      {...props}
      allowCreate={true}
      allowSearch={true}
    />
  ), []);

  return (
    <SpotCreateForm
      sportsSlot={SportsSlot}
      onSuccess={(spotId) => console.log("Spot creado:", spotId)}
    />
  );
}
```

### `SportSearch`

Componente de búsqueda independiente para encontrar deportes en la base de datos.

#### Props

- `onSportSelect`: Callback que se ejecuta cuando se selecciona un deporte
- `excludeIds`: Array de IDs de deportes a excluir de los resultados (opcional)
- `placeholder`: Placeholder del input de búsqueda (opcional)
- `showAllOnEmpty`: Mostrar todos los deportes cuando no hay búsqueda (opcional, default: true)
- `maxResults`: Número máximo de resultados a mostrar (opcional, default: 10)

#### Uso independiente

```tsx
import { SportSearch } from "@/src/features/sport";

function MySearchComponent() {
  const handleSportSelect = (sport) => {
    console.log("Deporte seleccionado:", sport);
  };

  return (
    <SportSearch
      onSportSelect={handleSportSelect}
      excludeIds={["football", "basketball"]}
      placeholder="Buscar tu deporte favorito..."
      maxResults={5}
    />
  );
}
```

### `CreateSportForm`

Formulario para crear nuevos deportes.

#### Props

- `onSubmit`: Función que se ejecuta al enviar el formulario
- `onCancel`: Función que se ejecuta al cancelar
- `isLoading`: Estado de carga (opcional)
- `error`: Error a mostrar (opcional)

## Hooks

### `useSelectSports`

Hook principal para manejar la lógica de selección de deportes con integración API.

```tsx
import { useSelectSports } from "@/src/features/sport";

function MyComponent() {
  const {
    sportOptions,
    loading,
    error,
    isCreating,
    createError,
    toggleSport,
    getSelectedSports,
    setSelectedSports,
    resetSelection,
    validateSelection,
    createSport,
    clearCreateError
  } = useSelectSports(["football", "basketball"]); // deportes inicialmente seleccionados

  // Crear nuevo deporte
  const handleCreateSport = async () => {
    try {
      const sportId = await createSport({
        name: "Nuevo Deporte",
        description: "Descripción del deporte",
        category: "Categoría"
      });
      console.log("Deporte creado:", sportId);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    // Tu UI aquí
  );
}
```

### `useSearchSports`

Hook para buscar deportes desde la API.

```tsx
import { useSearchSports } from "@/src/features/sport";

function SearchComponent() {
  const {
    sports,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
    loadSports,
    searchSports,
    debouncedSearch,
    clearSearch,
    reload
  } = useSearchSports();

  // Buscar deportes
  const handleSearch = (query: string) => {
    debouncedSearch(query);
  };

  return (
    // Tu UI de búsqueda aquí
  );
}
```

## API Integration

### SportRepository

La feature utiliza el `SportRepository` para interactuar con Firebase:

- `getActiveSports()`: Obtiene todos los deportes activos
- `searchSportsByName(query)`: Busca deportes por nombre
- `createSport(sportData)`: Crea un nuevo deporte
- `getSportById(id)`: Obtiene un deporte por ID
- `updateSport(id, data)`: Actualiza un deporte
- `deactivateSport(id)`: Desactiva un deporte

### Modelo de Datos

Los deportes siguen el modelo de dominio definido en `@/src/entities/sport/model/sport`:

```tsx
interface Sport {
  id: string;
  details: {
    name: string;
    description?: string;
    icon?: string;
    image?: string;
    category?: string;
  };
  metadata?: {
    createdAt?: Date;
    updatedAt?: Date;
  };
  isActive?: boolean;
  activity?: {
    spotsCount?: number;
    usersCount?: number;
    popularity?: number;
  };
}
```

## Tipos

### `Sport` (del dominio)
```tsx
// Re-exporta el tipo Sport completo del modelo de dominio
```

### `SportSimple` (para UI)
```tsx
interface SportSimple {
  id: string;
  name: string;
}
```

### `SportOption`
```tsx
interface SportOption extends SportSimple {
  selected: boolean;
}
```

### `CreateSportData`
```tsx
interface CreateSportData {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
}
```

### `SportsSelectorProps`
```tsx
interface SportsSelectorProps {
  selectedSports: string[];
  onSportsChange: (selectedSports: string[]) => void;
  error?: string;
  required?: boolean;
  availableSports?: SportSimple[];
  allowCreate?: boolean;
  onCreateSport?: (sportData: CreateSportData) => Promise<string>;
}
```

## Funcionalidades

### 🔍 **Búsqueda Inteligente de Deportes**
- **Búsqueda en tiempo real**: Encuentra deportes mientras escribes
- **Búsqueda con debounce**: Optimiza las consultas a la API (300ms)
- **Resultados filtrados**: Excluye deportes ya seleccionados
- **Interfaz intuitiva**: Dropdown con indicadores visuales
- **Estados de carga**: Feedback inmediato durante búsquedas
- **Manejo de errores**: Mensajes descriptivos para problemas de conexión

### ➕ **Creación de Deportes**
- **Formulario integrado**: Crea deportes sin salir del selector
- **Validaciones robustas**: Verifica nombres duplicados y datos requeridos
- **Integración seamless**: El nuevo deporte se agrega y selecciona automáticamente
- **Campos opcionales**: Descripción, categoría e ícono personalizables

### ✅ **Selección Múltiple Avanzada**
- **Interfaz de checkboxes**: Selección múltiple clara e intuitiva
- **Agregar dinámicamente**: Deportes encontrados se agregan a la lista
- **Sincronización automática**: Mantiene consistencia con componentes padre
- **Validaciones de formulario**: Verifica selecciones requeridas

### 🔄 **Estados de Carga Diferenciados**
- **Carga inicial**: Deportes disponibles desde la API
- **Búsqueda en curso**: Indicador durante búsquedas
- **Creación en progreso**: Feedback durante creación de deportes
- **Manejo de errores**: Estados específicos para cada operación

### 🎨 **Experiencia de Usuario**
- **Navegación fluida**: Transiciones entre búsqueda, creación y selección
- **Botones contextuales**: Acciones disponibles según configuración
- **Feedback visual**: Colores y estados que guían al usuario
- **Responsive**: Adapta el diseño según las acciones disponibles

## Arquitectura de Slots

El patrón de slots permite que diferentes features puedan contribuir componentes a otras features de manera desacoplada:

1. **Feature Sport**: Proporciona el componente `SportsSelector` con capacidades API
2. **Feature Spot**: Define un slot `sportsSlot` en `SpotCreateForm`
3. **App Layer**: Conecta ambas features pasando `SportsSelector` como slot con configuración específica

Esto permite:
- **Separación de responsabilidades**: Cada feature maneja su propia lógica y datos
- **Reutilización**: El selector de deportes puede usarse en otros formularios
- **Flexibilidad**: Se pueden crear diferentes configuraciones del selector
- **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar otros componentes

## Personalización

### Selector Personalizado

```tsx
import { SportsSelectorProps } from "@/src/features/sport";

const CustomSportsSelector: React.FC<SportsSelectorProps> = ({
  selectedSports,
  onSportsChange,
  error,
  allowCreate = false
}) => {
  // Tu implementación personalizada
  return (
    <div>
      {/* Tu UI personalizada */}
    </div>
  );
};

// Usar en SpotCreateForm
<SpotCreateForm sportsSlot={CustomSportsSelector} />
```

### Función de Creación Personalizada

```tsx
const customCreateSport = async (sportData: CreateSportData): Promise<string> => {
  // Tu lógica personalizada de creación
  // Por ejemplo, validaciones adicionales, logging, etc.
  
  return await sportRepository.createSport(sportData);
};

<SportsSelector
  selectedSports={selectedSports}
  onSportsChange={setSelectedSports}
  allowCreate={true}
  onCreateSport={customCreateSport}
/>
```

## Performance

- **Carga diferida**: Los deportes se cargan solo cuando es necesario
- **Búsqueda con debounce**: Evita llamadas excesivas a la API
- **Cache automático**: Los deportes se mantienen en memoria durante la sesión
- **Optimizaciones React**: Uso de useCallback y useMemo donde es apropiado