# Map Search Feature

## 📦 Status

**Status:** Implemented, production-ready. Componentes y hooks genéricos disponibles y en uso en la app.

Feature genérica y reutilizable para búsqueda de entidades en mapa.

## 📋 Descripción

Esta feature proporciona componentes, hooks y utilidades completamente genéricos para implementar búsqueda de cualquier tipo de entidad en un mapa. Está diseñada siguiendo principios de Clean Architecture y patrones de diseño reutilizables.

## 🎯 Características

- ✅ **Componentes genéricos** con render props y slots
- ✅ **Hook de búsqueda reutilizable** con gestión de estado
- ✅ **Cálculos de distancia** con fórmula de Haversine
- ✅ **Filtrado y ordenamiento** flexible
- ✅ **Vista de mapa y lista** intercambiables
- ✅ **TypeScript** con tipos completamente tipados
- ✅ **Optimizado** para performance
- ✅ **Debouncing** en búsquedas por texto
- ✅ **Círculo de distancia** visual en el mapa
- ✅ **Centrado automático** en ubicación o resultados

## 📁 Estructura

```
map-search/
├── index.ts                    # Exportaciones públicas
├── types/
│   └── map-types.tsx          # Tipos e interfaces genéricas
├── utils/
│   └── map-helpers.ts         # Utilidades de cálculo y transformación
├── hooks/
│   └── use-map-search.ts      # Hook genérico de búsqueda
└── components/
    ├── map-search-bar.tsx             # Barra de búsqueda
    ├── map-search-filter-modal.tsx    # Modal de filtros (slot pattern)
    ├── map-search-map.tsx             # Mapa con marcadores
    ├── map-search-result-item.tsx     # Item de resultado (render props)
    └── map-search-result-list.tsx     # Lista de resultados
```

## 🚀 Uso

### 1. Definir Filtros Específicos

```typescript
import { BaseMapSearchFilters } from "@/src/features/map-search";

interface SpotMapSearchFilters extends BaseMapSearchFilters {
  minRating?: number;
  sportIds?: string[];
  onlyVerified?: boolean;
}
```

### 2. Configurar el Hook de Búsqueda

```typescript
const {
  state,
  filters,
  updateFilters,
  resetFilters,
  search,
  isSearching,
} = useMapSearch<Spot, SpotMapSearchFilters>({
  // Función que obtiene los datos
  searchFunction: async (filters, userLocation) => {
    return await spotRepository.searchSpots(filters, userLocation);
  },
  
  // Funciones de extracción
  getLocation: (spot) => spot.details.location,
  getSearchableFields: (spot) => [
    spot.details.name,
    spot.details.description,
  ],
  
  // Funciones para ordenamiento
  getters: {
    getRating: (spot) => spot.details.overallRating,
    getName: (spot) => spot.details.name,
    getDate: (spot) => spot.metadata.createdAt,
  },
  
  // Configuración inicial
  initialFilters: {
    searchQuery: "",
    maxDistance: 10,
    sortBy: "distance",
    sortOrder: "asc",
  },
  autoSearch: true,
});
```

### 3. Usar los Componentes

#### Barra de Búsqueda

```tsx
<MapSearchBar
  searchQuery={filters.searchQuery}
  onSearchChange={(query) => updateFilters({ searchQuery: query })}
  onFilterPress={() => setShowFilters(true)}
  placeholder="Buscar spots..."
  filterCount={activeFiltersCount}
/>
```

#### Mapa

```tsx
<MapSearchMap
  results={state.results}
  userLocation={userLocation}
  selectedItemId={selectedSpotId}
  onMarkerPress={(spot) => navigate(`/spot/${spot.id}`)}
  getItemId={(spot) => spot.id}
  getItemLocation={(spot) => spot.details.location}
  getItemTitle={(spot) => spot.details.name}
  getItemDescription={(spot) => `⭐ ${spot.details.overallRating}`}
  config={{
    marker: { color: "#ef4444", selectedColor: "#22c55e" },
    distanceCircle: { enabled: true, maxDistance: filters.maxDistance },
  }}
/>
```

#### Lista de Resultados

```tsx
<MapSearchResultList
  results={state.results}
  onItemPress={(spot) => navigate(`/spot/${spot.id}`)}
  selectedItemId={selectedSpotId}
  isLoading={isSearching}
  error={state.error}
  emptyMessage="No se encontraron spots"
  renderItem={(result) => (
    <MapSearchResultItem
      item={result.item}
      distance={result.location.distance}
      onPress={handlePress}
      isSelected={selected}
      renderContent={(spot, distance) => (
        <HStack>
          <Image source={{ uri: spot.details.media[0] }} />
          <VStack>
            <Text>{spot.details.name}</Text>
            <Text>{formatDistance(distance)}</Text>
          </VStack>
        </HStack>
      )}
    />
  )}
/>
```

#### Modal de Filtros (Slot Pattern)

```tsx
<MapSearchFilterModal
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  onApply={search}
  onReset={resetFilters}
  title="Filtros de búsqueda"
>
  {/* Contenido personalizado de filtros */}
  <FormControl>
    <FormControlLabel>
      <FormControlLabelText>Distancia máxima</FormControlLabelText>
    </FormControlLabel>
    <Slider
      value={filters.maxDistance}
      onChange={(value) => updateFilters({ maxDistance: value })}
    />
  </FormControl>
  
  <FormControl>
    <FormControlLabel>
      <FormControlLabelText>Rating mínimo</FormControlLabelText>
    </FormControlLabel>
    <Slider
      value={filters.minRating}
      onChange={(value) => updateFilters({ minRating: value })}
    />
  </FormControl>
</MapSearchFilterModal>
```

## 🎨 Patrones de Diseño

### 1. Render Props Pattern

Los componentes como `MapSearchResultItem` usan render props para permitir contenido completamente personalizado:

```tsx
<MapSearchResultItem
  item={item}
  renderContent={(item) => <CustomContent item={item} />}
  renderActions={(item) => <CustomActions item={item} />}
/>
```

### 2. Slot Pattern

El `MapSearchFilterModal` usa slots (children) para contenido personalizado:

```tsx
<MapSearchFilterModal>
  {/* Tu contenido de filtros aquí */}
</MapSearchFilterModal>
```

### 3. Generic Hook Pattern

El hook `useMapSearch` es completamente genérico y tipado:

```typescript
useMapSearch<EntityType, FiltersType>({ ... })
```

## 🛠️ Utilidades Disponibles

### Cálculos de Distancia

```typescript
import { 
  calculateDistance,
  formatDistance,
  isWithinDistance 
} from "@/src/features/map-search";

const distance = calculateDistance(point1, point2); // En km
const formatted = formatDistance(distance); // "1.5 km" o "500 m"
const isNear = isWithinDistance(point1, point2, 5); // Dentro de 5km?
```

### Cálculos de Región

```typescript
import {
  calculateRegionForLocations,
  calculateRegionForDistance,
} from "@/src/features/map-search";

// Región que abarca múltiples puntos
const region = calculateRegionForLocations([loc1, loc2, loc3]);

// Región basada en distancia
const region = calculateRegionForDistance(center, 10); // 10 km
```

### Filtrado y Ordenamiento

```typescript
import {
  filterByDistance,
  filterByQuery,
  sortResults,
} from "@/src/features/map-search";

// Filtrar por distancia
const nearby = filterByDistance(results, 5); // 5 km

// Filtrar por query
const filtered = filterByQuery(
  results,
  "deporte",
  (item) => [item.name, item.description]
);

// Ordenar
const sorted = sortResults(
  results,
  "distance", // o "rating", "name", "recent"
  "asc",
  { getRating: (item) => item.rating }
);
```

### Transformaciones

```typescript
import { transformToSearchResults } from "@/src/features/map-search";

// Transformar array de entidades a resultados de búsqueda
const results = transformToSearchResults(
  items,
  (item) => item.location,
  userLocation
);
```

### Estadísticas

```typescript
import { calculateStatistics } from "@/src/features/map-search";

const stats = calculateStatistics(results, maxDistance);
// {
//   totalResults: 25,
//   averageDistance: 3.5,
//   closestDistance: 0.8,
//   farthestDistance: 9.2,
//   withinRange: 20
// }
```

## 📦 Tipos Principales

### MapSearchResult<T>
```typescript
interface MapSearchResult<T> {
  item: T;
  location: LocationWithDistance;
  relevanceScore?: number;
}
```

### MapSearchState<T>
```typescript
interface MapSearchState<T> {
  results: MapSearchResult<T>[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  hasMore: boolean;
}
```

### BaseMapSearchFilters
```typescript
interface BaseMapSearchFilters {
  searchQuery: string;
  maxDistance?: number;
  sortBy?: "distance" | "rating" | "name" | "recent";
  sortOrder?: "asc" | "desc";
}
```

## 🎯 Ejemplo Completo

Ver `src/app/home-tabs/search-map.tsx` para un ejemplo completo de implementación con Spots.

## 🔧 Próximas Mejoras

- [ ] Paginación de resultados
- [ ] Cache de búsquedas
- [ ] Clustering de marcadores
- [ ] Búsqueda por área visible
- [ ] Geolocalización en tiempo real
- [ ] Exportar/compartir resultados

## 📝 Notas

- Los componentes son **completamente genéricos** y pueden usarse con cualquier entidad
- La lógica de negocio específica se implementa en la función `searchFunction`
- Los filtros personalizados se pasan como `children` al modal
- El contenido de items se renderiza con render props
- Todos los cálculos de distancia usan la fórmula de Haversine (precisión real)

## 🤝 Contribuir

Para añadir nuevas funcionalidades:

1. Mantén los componentes genéricos
2. Usa TypeScript con tipos estrictos
3. Documenta las funciones públicas
4. Añade ejemplos de uso
5. Sigue los patrones de diseño establecidos
