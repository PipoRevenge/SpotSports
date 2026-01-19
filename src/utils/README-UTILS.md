# Utils - Funciones Utilitarias Globales

## 📦 Propósito

La carpeta `src/utils` contiene **funciones utilitarias globales** que son reutilizables en toda la aplicación y no pertenecen a ninguna feature específica. Estas funciones proporcionan helpers comunes para transformación de datos, formateo y operaciones frecuentes.

## 🎯 ¿Qué va en Utils?

Las utilidades en esta carpeta deben ser:
- ✅ **Funciones puras** - sin efectos secundarios, entrada → salida
- ✅ **Genéricas y reutilizables** - usadas en múltiples features
- ✅ **Independientes del dominio** - no contienen lógica de negocio específica
- ✅ **Testeables** - fáciles de probar de forma aislada

## 🚨 Restricción Importante

**Las utilidades específicas de una feature deben ir en** `src/features/[feature]/utils/`

```typescript
// ❌ INCORRECTO - Validación específica de spot en utils globales
src/utils/spot-validations.ts  // Esto va en src/features/spot/utils/

// ✅ CORRECTO - Función de formato genérica en utils globales
src/utils/date-utils.ts  // Función reutilizable en toda la app
```

## 📁 Estructura Actual

```
utils/
├── date-utils.ts    # Utilidades para manejo de fechas
└── color-utils.ts   # Utilidades para colores y paletas
```

## 🛠️ Utilidades Disponibles

### **Date Utils** 📅

**Archivo**: `date-utils.ts`

Funciones para formateo y manipulación de fechas.

#### **formatDate**
Formatea una fecha a formato dd/mm/yyyy.

```typescript
formatDate(date: Date): string

// Ejemplo:
formatDate(new Date(2025, 0, 15)) // "15/01/2025"
```

#### **formatRelativeDate**
Formatea una fecha a formato relativo (hace X tiempo).

```typescript
formatRelativeDate(date: Date): string

// Ejemplos:
formatRelativeDate(new Date()) // "Hace un momento"
formatRelativeDate(new Date(Date.now() - 86400000)) // "Hace 1 día"
formatRelativeDate(new Date(Date.now() - 7200000)) // "Hace 2 horas"
```

**Comportamiento:**
- Menos de 1 minuto: "Hace un momento"
- Menos de 1 hora: "Hace X minuto(s)"
- Menos de 1 día: "Hace X hora(s)"
- Menos de 1 mes: "Hace X día(s)"
- Menos de 1 año: "Hace X mes(es)"
- 1 año o más: "Hace X año(s)"

#### **getInitials**
Genera las iniciales de un nombre (máximo 2 caracteres).

```typescript
getInitials(name?: string): string

// Ejemplos:
getInitials("Juan Pérez") // "JP"
getInitials("María") // "MA"
getInitials("") // "U"
getInitials() // "U"
```

**Uso en la Aplicación:**

```typescript
import { formatDate, formatRelativeDate, getInitials } from '@/src/utils/date-utils';

// Formatear fecha de creación
const createdDate = formatDate(spot.createdAt); // "15/01/2025"

// Mostrar tiempo relativo en reviews
const reviewTime = formatRelativeDate(review.createdAt); // "Hace 2 días"

// Avatar con iniciales
const initials = getInitials(user.fullName); // "JP"
<Avatar>{initials}</Avatar>
```

## 🔄 Flujo de Uso

```
Utils (src/utils)
      ↓
┌─────┼─────┬─────┬─────┐
│     │     │     │     │
Features Components API  App
```

**Ejemplo de flujo:**

1. **Utilidad definida** en `src/utils/date-utils.ts`:
```typescript
export const formatRelativeDate = (date: Date): string => {
  // Implementación
};
```

2. **Usada en Feature** (`src/features/review/components/review-card.tsx`):
```typescript
import { formatRelativeDate } from '@/src/utils/date-utils';

const ReviewCard = ({ review }) => (
  <Text>{formatRelativeDate(review.createdAt)}</Text>
);
```

3. **Usada en múltiples lugares** sin duplicación de código.

## ✅ Cuándo Crear una Utility

Crea una nueva utilidad en `src/utils/` cuando:

- ✅ La función es **genérica y reutilizable** en múltiples features
- ✅ Es una **función pura** sin efectos secundarios
- ✅ No contiene **lógica de negocio específica**
- ✅ Se necesita en **2+ features diferentes**

**Ejemplos válidos:**
- Formateo de fechas, números, moneda
- Validaciones genéricas (email, URL, teléfono)
- Transformaciones de strings (capitalize, truncate, slug)
- Manipulación de arrays (groupBy, unique, sortBy)
- Helpers de objetos (deepClone, merge)
- Conversiones de unidades

## 🚫 Qué NO va en Utils Globales

NO uses `src/utils/` para:

- ❌ **Lógica de negocio** → Usar hooks en features
- ❌ **Utilidades específicas de feature** → Usar `src/features/[feature]/utils/`
- ❌ **Validaciones de dominio** → Usar `src/features/[feature]/utils/validations.ts`
- ❌ **Componentes** → Usar `src/components/`
- ❌ **Hooks** → Usar `src/hooks/`

**Ejemplos de lo que NO debe estar aquí:**
```typescript
// ❌ Estos van en features, NO en utils globales
calculate-spot-distance.ts    // → src/features/spot/utils/
validate-spot-form.ts         // → src/features/spot/utils/
format-review-rating.ts       // → src/features/review/utils/
```

## 📝 Convenciones

### Nomenclatura de Archivos
- Usar `kebab-case.ts`
- Sufijo `-utils.ts` para claridad
- Ejemplos: `date-utils.ts`, `string-utils.ts`, `array-utils.ts`

### Nomenclatura de Funciones
- Usar `camelCase`
- Nombres descriptivos y verbosos
- Ejemplos: `formatDate`, `capitalizeFirstLetter`, `groupByKey`

### Estructura de Archivo
```typescript
// date-utils.ts

/**
 * Utilidades para el manejo de fechas en la aplicación
 */

/**
 * Formatea una fecha a formato dd/mm/yyyy
 * @param date - Fecha a formatear
 * @returns String con formato dd/mm/yyyy
 * 
 * @example
 * ```ts
 * formatDate(new Date(2025, 0, 15)) // "15/01/2025"
 * ```
 */
export const formatDate = (date: Date): string => {
  // Implementación
};

/**
 * Otra función relacionada con fechas
 */
export const formatRelativeDate = (date: Date): string => {
  // Implementación
};
```

### Documentación
- Incluir JSDoc para todas las funciones públicas
- Documentar parámetros y valor de retorno
- Incluir ejemplos de uso
- Especificar edge cases si existen

## 🎯 Categorías de Utilidades Sugeridas

### **String Utils**
```typescript
// string-utils.ts

/**
 * Capitaliza la primera letra de un string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Trunca un string a un largo máximo
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Convierte un string a slug (URL-friendly)
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

/**
 * Remueve espacios en blanco extras
 */
export const normalizeWhitespace = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};
```

### **Number Utils**
```typescript
// number-utils.ts

/**
 * Formatea un número como moneda
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'EUR'
): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES').format(num);
};

/**
 * Redondea un número a N decimales
 */
export const roundTo = (num: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Clamp: limita un número entre min y max
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};
```

### **Array Utils**
```typescript
// array-utils.ts

/**
 * Agrupa array por una key
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Remueve duplicados de un array
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Ordena array por una key
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Chunka un array en grupos de tamaño N
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
```

### **Validation Utils**
```typescript
// validation-utils.ts

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida número de teléfono (formato español)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
```

### **Object Utils**
```typescript
// object-utils.ts

/**
 * Deep clone de un objeto
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge profundo de objetos
 */
export const deepMerge = <T extends object>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      result[key] = deepMerge(
        targetValue as any,
        sourceValue as any
      );
    } else {
      result[key] = sourceValue as any;
    }
  }
  
  return result;
};

/**
 * Remueve propiedades undefined/null de un objeto
 */
export const compact = <T extends object>(obj: T): Partial<T> => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key as keyof T];
    if (value !== undefined && value !== null) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
};
```

### **Storage Utils**
```typescript
// storage-utils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Guarda un valor en AsyncStorage con tipado
 */
export const saveToStorage = async <T>(
  key: string,
  value: T
): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

/**
 * Obtiene un valor de AsyncStorage con tipado
 */
export const getFromStorage = async <T>(
  key: string
): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
};

/**
 * Remueve un valor de AsyncStorage
 */
export const removeFromStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
};
```

## 🧪 Testing de Utilidades

Las funciones utilitarias son ideales para testing por ser funciones puras:

```typescript
// __tests__/date-utils.test.ts
import { formatDate, formatRelativeDate, getInitials } from '../date-utils';

describe('date-utils', () => {
  describe('formatDate', () => {
    it('should format date as dd/mm/yyyy', () => {
      const date = new Date(2025, 0, 15);
      expect(formatDate(date)).toBe('15/01/2025');
    });
  });
  
  describe('formatRelativeDate', () => {
    it('should return "Hace un momento" for recent dates', () => {
      const now = new Date();
      expect(formatRelativeDate(now)).toBe('Hace un momento');
    });
    
    it('should return correct format for days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoDaysAgo)).toBe('Hace 2 días');
    });
  });
  
  describe('getInitials', () => {
    it('should return initials from full name', () => {
      expect(getInitials('Juan Pérez')).toBe('JP');
    });
    
    it('should return first two letters for single name', () => {
      expect(getInitials('María')).toBe('MA');
    });
    
    it('should return "U" for empty name', () => {
      expect(getInitials('')).toBe('U');
      expect(getInitials()).toBe('U');
    });
  });
});
```

## 📚 Recursos

- Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para contexto completo de arquitectura
- Ver [src/features/README-FEATURES.md](../features/README-FEATURES.md) para utilidades de features
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Lodash Documentation](https://lodash.com/docs/) - Referencia de utilidades comunes

---

**Versión**: 1.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenido por**: Equipo SpotsSports
