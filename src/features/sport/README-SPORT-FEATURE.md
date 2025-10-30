# 🏃 Sport Feature - SpotsSports

## 🎯 Descripción General

La feature **Sport** gestiona todo lo relacionado con deportes en la aplicación SpotsSports. Implementa la arquitectura **Bullet-Proof React** con separación clara entre lógica de negocio (hooks) y componentes de UI. Incluye sistema completo de **filtros por categoría** y búsqueda avanzada.

## 🏗️ Arquitectura

### **Principios Implementados**
- ✅ **Separación de responsabilidades**: Hooks contienen lógica de negocio, componentes solo UI
- ✅ **Composición sobre herencia**: Hooks especializados que se pueden combinar
- ✅ **Abstracción de dependencias**: Los componentes no conocen repositorios directamente
- ✅ **Validación centralizada**: Utilidades reutilizables para validaciones
- ✅ **Estados tipados**: TypeScript estricto para todos los contratos

## 📁 Estructura de Archivos

```
sport/
├── index.ts                          # 📤 Exportaciones públicas
├── README.md                         # 📖 Documentación (este archivo)
├── components/                       # 🧩 Componentes de UI
│   ├── create-sport-form.tsx        # Formulario de creación con selector de categorías
│   ├── sport-search.tsx             # Búsqueda con filtros por categoría
│   ├── category-filter.tsx          # Filtro horizontal de categorías
│   └── sports-selector-modal.tsx    # Modal selector múltiple con filtros
├── hooks/                           # 🎣 Hooks de lógica de negocio
│   ├── use-search-sports.ts         # Búsqueda y carga de deportes
│   ├── use-select-sports.ts         # Selección múltiple de deportes
│   └── use-create-sport.ts          # Creación de nuevos deportes
├── types/                           # 📝 Definiciones de tipos
│   └── sport-types.ts               # Interfaces y tipos TypeScript
└── utils/                           # 🛠️ Utilidades y helpers
    ├── sport-validations.ts         # Esquemas de validación
    ├── sport-constants.ts           # Constantes y configuración
    └── sport-helpers.ts             # Funciones auxiliares
```

## 🎣 Hooks Disponibles

### **`useSearchSports`**
Maneja la búsqueda y carga de deportes desde la API con **filtros por categoría**.

```typescript
const {
  sports,           // SportSimple[] - Lista de todos los deportes
  loading,          // boolean - Estado de carga inicial
  error,            // string | null - Error de carga
  searchResults,    // SportSimple[] - Resultados de búsqueda filtrados
  searchLoading,    // boolean - Estado de búsqueda
  searchError,      // string | null - Error de búsqueda
  filters,          // SportFilters - Filtros actuales (query + category)
  loadSports,       // (category?: SportCategory) => Promise<void> - Cargar deportes
  searchSports,     // (query: string) => Promise<void> - Buscar por texto
  searchWithFilters,// (filters: SportFilters) => Promise<void> - Buscar con filtros
  setCategory,      // (category?: SportCategory) => void - Filtrar por categoría
  setQuery,         // (query?: string) => void - Filtrar por texto
  clearSearch,      // () => void - Limpiar búsqueda
  reload           // () => void - Recargar deportes
} = useSearchSports({
  autoLoad: true,           // boolean - Cargar automáticamente
  searchDelay: 300,        // number - Delay para debounce
  defaultFilters: {}       // SportFilters - Filtros iniciales
});
```

### **`useSelectSports`**
Maneja la selección múltiple de deportes con caché global.

```typescript
const {
  sportOptions,         // SportOption[] - Deportes con estado de selección
  loading,             // boolean - Estado de carga
  error,               // string | null - Error
  availableSports,     // SportSimple[] - Deportes disponibles
  toggleSport,         // (sportId: string) => void - Alternar selección
  addAndSelectSport,   // (sport: SportSimple) => void - Añadir y seleccionar
  getSelectedSports,   // () => string[] - Obtener IDs seleccionados
  setSelectedSports,   // (ids: string[]) => void - Establecer selección
  resetSelection,      // () => void - Resetear a estado inicial
  validateSelection,   // () => boolean - Validar que hay selección
  reloadSports        // () => Promise<void> - Recargar datos
} = useSelectSports(
  initialSelectedSports,  // string[] - IDs inicialmente seleccionados
  availableSports        // SportSimple[] - Deportes específicos (opcional)
);
```

### **`useCreateSport`**
Maneja la creación de nuevos deportes.

```typescript
const {
  isCreating,        // boolean - Estado de creación
  createError,       // string | null - Error de creación
  createSport,       // (data: CreateSportData) => Promise<string> - Crear deporte
  clearCreateError,  // () => void - Limpiar error
  reset             // () => void - Resetear estado
} = useCreateSport();
```

## 🧩 Componentes Disponibles

### **`<SportSearch />`**
Componente de búsqueda de deportes con **filtros por categoría** y resultados filtrados.

```tsx
<SportSearch
  onSportSelect={(sport) => console.log('Seleccionado:', sport)}
  excludeIds={['sport1', 'sport2']}     // IDs a excluir
  placeholder="Buscar deportes..."       // Placeholder personalizado
  showAllOnEmpty={true}                  // Mostrar todos si búsqueda vacía
  maxResults={10}                        // Límite de resultados
  showCategoryFilter={true}              // 🆕 Mostrar filtro de categorías
/>
```

### **`<CreateSportForm />`**
Formulario para crear nuevos deportes con **selector visual de categorías**.

```tsx
<CreateSportForm
  onSubmit={async (data) => {
    const sportId = await createSport(data);
    console.log('Deporte creado:', sportId);
  }}
  onCancel={() => setShowForm(false)}
  isLoading={isCreating}
  error={createError}
/>

// 🆕 Incluye selector horizontal de categorías:
// Outdoor, Team, Fitness, Water, Winter, Precision, Wellness, Urban
```

### **`<CategoryFilter />`** 🆕
Componente horizontal para filtrar deportes por categoría.

```tsx
<CategoryFilter
  selectedCategory={selectedCategory}
  onCategoryChange={(category) => setSelectedCategory(category)}
  showLabel={true}                      // Mostrar etiqueta "Filtrar por categoría"
/>
```

### **`<SportsSelectorModal />`**
Modal completo para selección múltiple con **búsqueda por categoría** y creación.

```tsx
const selectorRef = useRef<SportsSelectorRef>(null);

<SportsSelectorModal
  ref={selectorRef}
  selectedSports={selectedSportIds}
  onSportsChange={setSelectedSportIds}
  allowCreate={true}
  allowSearch={true}
  required={true}
  onCreateSport={handleCreateSport}     // Función personalizada (opcional)
/>

// 🆕 Incluye automáticamente:
// - Búsqueda por texto + filtro por categoría
// - Formulario de creación con selector de categorías
// - Filtros combinados (texto + categoría simultáneamente)

// Métodos disponibles via ref:
selectorRef.current?.validate()        // Validar selección
selectorRef.current?.getSelectedSports() // Obtener seleccionados
selectorRef.current?.reset()           // Resetear selección
```

## 🛠️ Utilidades Disponibles

### **Validaciones**
All validations use **Zod schemas** with English messages:

```typescript
import { 
  validateCreateSport,
  validateSportName, 
  validateSportDescription,
  validateSportSelection,
  createSportSchema
} from '@/features/sport';

// Validate complete data with Zod
const { success, errors } = validateCreateSport(sportData);

// Use Zod schema directly
const result = createSportSchema.safeParse(sportData);

// Individual validations
const nameError = validateSportName("Football");
const descError = validateSportDescription("Team sport played with...");
const hasSelection = validateSportSelection(['sport1', 'sport2']);
```

### **Helpers**
```typescript
import {
  toSimpleSport,
  filterSportsExcluding,
  formatSelectedCount,
  formatResultsCount
} from '@/features/sport';

// Convertir deporte del dominio a UI
const simpleSport = toSimpleSport(domainSport);

// Filtrar deportes excluyendo IDs
const filtered = filterSportsExcluding(sports, ['exclude1', 'exclude2']);

// Formatear textos de conteo
const selectedText = formatSelectedCount(3); // "3 deportes seleccionados"
const resultsText = formatResultsCount(5);   // "5 deportes encontrados"
```

### **Constantes**
```typescript
import { 
  SPORT_VALIDATION_LIMITS,
  SPORT_ERROR_MESSAGES,
  SPORT_PLACEHOLDERS,
  SPORT_CATEGORIES,        // 🆕 Categorías
  SPORT_CATEGORIES_LIST,   // 🆕 Lista para componentes
  LOADING_STATES
} from '@/features/sport';

// 🆕 Constantes de categorías
SPORT_CATEGORIES.OUTDOOR              // "Outdoor"
SPORT_CATEGORIES.TEAM                 // "Team"
SPORT_CATEGORIES.FITNESS              // "Fitness"
// ... todas las 8 categorías

// 🆕 Lista para selectors/filtros
SPORT_CATEGORIES_LIST                 // [{ value: "Outdoor", label: "Outdoor" }, ...]

// Límites de validación
SPORT_VALIDATION_LIMITS.NAME_MAX_LENGTH        // 50
SPORT_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH // 200

// Mensajes de error estandardizados
SPORT_ERROR_MESSAGES.REQUIRED_NAME    // "El nombre del deporte es requerido"
SPORT_ERROR_MESSAGES.CREATE_ERROR     // "Error al crear el deporte"

// 🆕 Placeholders para categorías
SPORT_PLACEHOLDERS.NAME               // "Ej: Padel, Rugby, Crossfit..."
SPORT_PLACEHOLDERS.SEARCH             // "Buscar deportes..."
SPORT_PLACEHOLDERS.CATEGORY           // "Selecciona una categoría..."
SPORT_PLACEHOLDERS.FILTER_CATEGORY    // "Filtrar por categoría"

// Estados de carga
LOADING_STATES.CREATING               // "Creando..."
LOADING_STATES.SEARCHING              // "Buscando deportes..."
```

## 🏷️ Sistema de Categorías (Nuevo)

### **Categorías Disponibles**
El sistema incluye **8 categorías preestablecidas**:

| Categoría | Valor | Descripción | Ejemplos |
|-----------|-------|-------------|----------|
| 🤝 **Team** | `"Team"` | Deportes de equipo | Football, Basketball, Volleyball |
| 🏞️ **Outdoor** | `"Outdoor"` | Deportes al aire libre | Hiking, Mountain Biking, Rock Climbing |
| 🌊 **Water** | `"Water"` | Deportes acuáticos | Swimming, Surfing, Kayaking |
| 💪 **Fitness** | `"Fitness"` | Deportes de acondicionamiento | CrossFit, Running, Functional Training |
| 🎯 **Precision** | `"Precision"` | Deportes de precisión | Archery, Golf, Pool |
| ❄️ **Winter** | `"Winter"` | Deportes de invierno | Alpine Skiing, Snowboarding |
| 🧘 **Wellness** | `"Wellness"` | Deportes de bienestar | Yoga, Pilates, Tai Chi |
| 🏙️ **Urban** | `"Urban"` | Deportes urbanos | Skateboarding, Parkour, Street Workout |

### **Funcionalidades del Sistema**
- ✅ **Filtro Visual**: Selector horizontal con scroll
- ✅ **Búsqueda Combinada**: Texto + categoría simultáneamente  
- ✅ **Deselección Intuitiva**: Click en categoría activa para deseleccionar
- ✅ **Queries Optimizadas**: Firebase queries con `where('category', '==', value)`
- ✅ **Creación Obligatoria**: Categoría requerida para crear nuevos deportes
- ⚠️ **Categorías Predefinidas**: Sistema actual con 8 categorías fijas

### **🔮 Roadmap Futuro**
> **⏳ Refactorización Planificada**: El sistema actual usa categorías predefinidas por simplicidad y consistencia. En futuras versiones se planea:
> - 🆕 **Categorías Dinámicas**: Administrador podrá crear/editar categorías
> - 🗂️ **Gestión Avanzada**: CRUD completo de categorías con validaciones
> - 🎨 **Iconos Personalizables**: Asociar iconos/colores a cada categoría
> - 🏷️ **Subcategorías**: Jerarquía de categorías para mejor organización

## 📝 Tipos TypeScript

```typescript
// 🆕 Tipos de categorías
type SportCategory = 
  | "Outdoor" | "Team" | "Fitness" | "Water" 
  | "Winter" | "Precision" | "Wellness" | "Urban";

interface SportFilters {
  query?: string;
  category?: SportCategory;
}

// Tipos principales
interface SportSimple {
  id: string;
  name: string;
  category?: SportCategory;  // 🆕 Categoría incluida
}

interface SportOption extends SportSimple {
  selected: boolean;
}

interface CreateSportData {
  name: string;
  description: string;
  category: SportCategory;   // 🔴 OBLIGATORIO - Categoría requerida
  icon?: string;
}

// Tipos de hooks con resultados tipados
type UseSearchSportsResult = { /* ... */ };
type UseSelectSportsResult = { /* ... */ };
type UseCreateSportResult = { /* ... */ };
```

## 🔄 Flujos de Uso Comunes

### **Búsqueda Simple**
```tsx
function SportSearchExample() {
  const { sports, searchSports, searchResults } = useSearchSports();
  
  return (
    <SportSearch
      onSportSelect={(sport) => {
        console.log('Deporte seleccionado:', sport);
      }}
    />
  );
}
```

### **🆕 Búsqueda con Filtros por Categoría**
```tsx
function CategoryFilterExample() {
  const { 
    searchResults, 
    filters, 
    searchWithFilters,
    setCategory 
  } = useSearchSports();
  
  const handleCategoryFilter = (category?: SportCategory) => {
    setCategory(category);
    // Automáticamente busca deportes de esa categoría
  };
  
  return (
    <div>
      <CategoryFilter 
        selectedCategory={filters.category}
        onCategoryChange={handleCategoryFilter}
      />
      
      <SportSearch
        showCategoryFilter={true}  // Incluye filtro integrado
        onSportSelect={(sport) => console.log('Seleccionado:', sport)}
      />
    </div>
  );
}
```

### **🆕 Filtros Combinados (Texto + Categoría)**
```tsx
function CombinedFiltersExample() {
  const { searchWithFilters, searchResults } = useSearchSports();
  
  const handleSearch = async () => {
    await searchWithFilters({
      query: "foot",           // Buscar deportes que contengan "foot"
      category: "Team"         // Solo en la categoría Team
    });
    // Resultado: ["Football"] (si existe)
  };
  
  return (
    <SportSearch 
      showCategoryFilter={true}
      onSportSelect={handleSportSelect}
    />
  );
}
```

### **Selección Múltiple**
```tsx
function MultiSelectExample() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const {
    sportOptions,
    toggleSport,
    getSelectedSports,
    validateSelection
  } = useSelectSports(selectedIds);
  
  const handleSave = () => {
    if (validateSelection()) {
      const selected = getSelectedSports();
      setSelectedIds(selected);
    }
  };
  
  return (
    <div>
      {sportOptions.map(sport => (
        <button 
          key={sport.id}
          onClick={() => toggleSport(sport.id)}
          className={sport.selected ? 'selected' : ''}
        >
          {sport.name}
        </button>
      ))}
      <button onClick={handleSave}>Guardar Selección</button>
    </div>
  );
}
```

### **Modal Completo con Categorías**
```tsx
function CompleteModalExample() {
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const { createSport } = useCreateSport();
  
  return (
    <SportsSelectorModal
      selectedSports={selectedSports}
      onSportsChange={setSelectedSports}
      allowCreate={true}
      required={true}
      onCreateSport={createSport}
    />
    // 🆕 Automáticamente incluye:
    // - Filtro por categorías en la búsqueda
    // - Selector de categoría en creación de deportes
    // - Búsqueda combinada texto + categoría
  );
}
```

### **🆕 Creación de Deporte con Categoría**
```tsx
function CreateSportWithCategory() {
  const { createSport, isCreating } = useCreateSport();
  
  const handleSubmit = async (data: CreateSportData) => {
    const newSport = {
      name: "Padel",
      description: "Deporte de raqueta jugado en parejas...",
      category: "Outdoor" as SportCategory,  // 🔴 OBLIGATORIO - Categoría requerida
      icon: "🎾"
    };
    
    const sportId = await createSport(newSport);
    console.log('Deporte creado con categoría:', sportId);
  };
  
  return (
    <CreateSportForm
      onSubmit={handleSubmit}
      isLoading={isCreating}
    />
    // Formulario incluye selector visual de categorías
  );
}
```

## 🚀 Características Destacadas

- **🏪 Caché Global**: Los deportes seleccionados se mantienen entre navegaciones
- **⚡ Debounced Search**: Búsqueda optimizada con retraso configurable  
- **🏷️ Filtros por Categoría**: Sistema completo de 8 categorías preestablecidas
- **🔍 Búsqueda Combinada**: Texto + categoría funcionando simultáneamente
- **🎯 Firebase Optimizado**: Queries eficientes con filtros de categoría
- **🎨 Selector Visual**: Componente horizontal de categorías con scroll
- **🔴 Categoría Obligatoria**: Todos los deportes deben tener una categoría asignada
- **✅ Validación Robusta**: Validación tanto en tiempo real como en envío
- **🔄 Sincronización Automática**: Los hooks se mantienen sincronizados automáticamente
- **📱 Responsive**: Componentes optimizados para móvil y desktop
- **♿ Accesible**: Implementación con buenas prácticas de accesibilidad
- **🎨 Themeable**: Estilos consistentes con el design system
- **🆕 Sin Campo Active**: Modelo simplificado sin soft delete

## � Datos de Prueba

### **Carga Automática de Deportes**
El sistema incluye **26 deportes de prueba** distribuidos en las 8 categorías:

```typescript
import { uploadTestSports, runTestUpload } from '@/src/hooks/test-data-upload';

// Opción 1: Función async
const result = await uploadTestSports();
console.log('Deportes cargados:', result); // { successCount: 26, errorCount: 0 }

// Opción 2: Función con manejo automático
runTestUpload();
```

### **Distribución por Categorías**
| Categoría | Cantidad | Deportes Incluidos |
|-----------|----------|-------------------|
| **Team** | 4 | Football, Basketball, Volleyball, Rugby |
| **Outdoor** | 4 | Hiking, Mountain Biking, Rock Climbing, Trail Running |
| **Water** | 4 | Swimming, Surfing, Kayaking, Paddle Boarding |
| **Fitness** | 3 | CrossFit, Running, Functional Training |
| **Precision** | 3 | Archery, Golf, Pool |
| **Wellness** | 3 | Yoga, Pilates, Tai Chi |
| **Urban** | 3 | Skateboarding, Parkour, Street Workout |
| **Winter** | 2 | Alpine Skiing, Snowboarding |

**Total: 26 deportes** con nombres en inglés, descripciones detalladas y emojis representativos.

## �🐛 Depuración

Todos los hooks incluyen logging detallado en desarrollo:

```javascript
// Console logs automáticos en desarrollo
[sports-abc123] Sports initialized with cache: ['sport1', 'sport2']
[sports-abc123] Sport toggled: sport3, now true
[sports-abc123] New sport created and selected: Padel (sport4)

// 🆕 Logs de filtros por categoría
🔍 searchWithFilters called with: { category: "Team", query: undefined }
📡 Calling repository with filters: { category: "Team" }
✅ Search results received: 4 sports
```

---

**📋 Registro de Cambios Recientes**
- ✅ **v2.1**: Categoría obligatoria para crear deportes
- ✅ **v2.1**: Validación estricta de categorías requeridas
- ✅ **v2.0**: Sistema completo de filtros por categoría
- ✅ **v2.0**: 26 deportes de prueba con distribución estratégica  
- ✅ **v2.0**: Búsqueda combinada texto + categoría
- ✅ **v2.0**: Eliminación del campo `active` del modelo
- ✅ **v2.0**: Componente CategoryFilter con UI horizontal
- ✅ **v2.0**: Queries Firebase optimizadas por categoría
- ✅ **v2.0**: Formulario de creación con selector visual

**Mantenido por**: Equipo de Frontend SpotsSports  
**Última actualización**: Octubre 2025  
**Versión**: 2.1 - Categorías Obligatorias