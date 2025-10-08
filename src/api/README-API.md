# API Layer - SpotsSports

## 📋 Descripción General

Esta capa API implementa el patrón Repository con inyección de dependencias para gestionar todas las operaciones de datos de la aplicación SpotsSports. Utiliza Firebase como backend y sigue principios SOLID para mantener un código limpio, testeable y escalable.

## 🏗️ Arquitectura

### Estructura de Directorios
```
src/api/
├── config/
│   └── firebase-config.ts      # Configuración de Firebase
├── repositories/
│   ├── interfaces/             # Contratos de repositorios (IUserRepository, IAuthRepository, ...)
│   │   ├── i-auth-repository.ts
│   │   └── i-user-repository.ts
│   ├── implementations/        # Implementaciones concretas
│   │   ├── auth-repository-impl.ts
│   │   └── user-repository-impl.ts
│   └── mappers/                # Transformadores entre modelos (DTOs, domain, firestore)
│       └── user-mapper.ts
└── index.ts                   # Punto de entrada y exportación
```

### Patrones Implementados

- **Repository Pattern**: Abstrae la lógica de acceso a datos
- **Dependency Injection**: Permite fácil testing y cambio de implementaciones
- **Interface Segregation**: Cada repositorio tiene una responsabilidad específica
- **Error Handling**: Manejo consistente de errores con mensajes descriptivos

## 🔁 ¿Qué son los Mappers?

Los mappers son funciones/objetos responsables de transformar datos entre distintas representaciones usadas en la aplicación. En este proyecto se usan para:

- Mapear datos crudos de Firestore a modelos de dominio (domain models).
- Convertir modelos de dominio a DTOs para envío por red o almacenamiento.
- Normalizar/parsear campos (fechas, ids, flags, relaciones).

Beneficios:
- Evitan lógica de transformación dispersa en los repositorios o componentes.
- Centralizan validaciones y conversiones.
- Hacen más fácil testear las transformaciones.

## 🧭 Convenciones de Mappers

- Carpeta: `src/api/repositories/mappers/`
- Archivo por entidad: `[entity]-mapper.ts` (por ejemplo `user-mapper.ts`).
- Exportar funciones puras y fáciles de testear:
  - `toDomain(raw: any): DomainModel`
  - `toFirestore(domain: DomainModel): FirestoreData`
  - `toDTO(domain: DomainModel): DTO`
- Manejar valores opcionales de forma explícita.
- No realizar llamadas a servicios externos desde un mapper.

## 🔨 Contrato (mini "contract") para un Mapper de User

- Inputs/outputs:
  - toDomain(raw: any) -> User
  - toFirestore(user: User) -> Record<string, any>
  - toDTO(user: User) -> UserDTO
- Errores esperados:
  - Entrada inválida (null/undefined) -> lanzar Error o devolver null según convención del repositorio.
  - Formato inesperado de campos (fecha como número/ string) -> intentar parsear y documentar el comportamiento.
- Criterios de éxito:
  - La estructura devuelta cumple con los tipos esperados en `src/types`.

## 📌 Ejemplo: `user-mapper.ts`

Este ejemplo ilustra un mapper sencillo para usuarios.

```typescript
// user-mapper.ts (ejemplo)
export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export type UserDTO = {
  id: string;
  displayName: string;
  email: string;
  createdAt: string; // ISO
};

export const userMapper = {
  toDomain(raw: any): User {
    if (!raw) throw new Error('Invalid raw user');

    return {
      id: raw.id || raw._id || '',
      name: raw.name || raw.displayName || '',
      email: raw.email || '',
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(0),
    };
  },

  toFirestore(user: User): Record<string, any> {
    return {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  },

  toDTO(user: User): UserDTO {
    return {
      id: user.id,
      displayName: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  },
};
```

### Uso típico en un repositorio

Dentro de `user-repository-impl.ts`:

```typescript
import { userMapper } from '../mappers/user-mapper';

const raw = await firestore.doc(`users/${id}`).get();
const domainUser = userMapper.toDomain({ id: raw.id, ...raw.data() });
```

## 🔧 Normas de Desarrollo

### 1. Creación de Nuevos Repositorios

#### Paso 1: Definir la Interfaz
Crear la interfaz en `repositories/interfaces/`:

```typescript
// i-[entity]-repository.ts
export interface I[Entity]Repository {
  // Operaciones CRUD básicas
  create[Entity](data: [Entity]Data): Promise<string>;
  get[Entity]ById(id: string): Promise<[Entity]>;
  update[Entity](id: string, data: Partial<[Entity]>): Promise<[Entity]>;
  delete[Entity](id: string): Promise<void>;
  
  // Operaciones específicas del dominio
  [customOperation](params: any): Promise<any>;
}
```

#### Paso 2: Implementar el Repositorio
Crear la implementación en `repositories/implementations/`:

```typescript
// [entity]-repository-impl.ts
import { I[Entity]Repository } from '../interfaces/i-[entity]-repository';

export class [Entity]RepositoryImpl implements I[Entity]Repository {
  async create[Entity](data: [Entity]Data): Promise<string> {
    try {
      // Implementación con Firebase
      // Incluir validaciones necesarias
      // Manejar errores específicos
    } catch (error: any) {
      // Manejo de errores estandarizado
      throw this.handleError(error, 'create[Entity]');
    }
  }
  
  private handleError(error: any, operation: string): Error {
    // Lógica de manejo de errores consistente
    return error;
  }
}
```

#### Paso 3: Registrar en index.ts
```typescript
// index.ts
import { [Entity]RepositoryImpl } from "./repositories/implementations/[entity]-repository-impl";
import { I[Entity]Repository } from "./repositories/interfaces/i-[entity]-repository";

export const [entity]Repository: I[Entity]Repository = new [Entity]RepositoryImpl();
```

### 2. Convenciones de Nomenclatura

#### Interfaces
- **Prefijo**: `I` (e.g., `IUserRepository`)
- **Sufijo**: `Repository`
- **Formato**: PascalCase

#### Implementaciones
- **Sufijo**: `RepositoryImpl`
- **Formato**: PascalCase

#### Métodos
- **CRUD**: `create`, `get`, `update`, `delete` + `EntityName`
- **Consultas**: `get` + descripción (e.g., `getUsersByStatus`)
- **Acciones**: verbo + objeto (e.g., `addFavoriteSpot`)

### 3. Manejo de Errores

#### Estructura Estándar
```typescript
async methodName(params: any): Promise<any> {
  try {
    // Validaciones de entrada
    if (!params) {
      throw new Error('Invalid parameters');
    }
    
    // Lógica principal
    const result = await firebaseOperation();
    return result;
    
  } catch (error: any) {
    // Logging para debugging
    console.error(`Error in ${operation}:`, error);
    
    // Manejo específico de errores de Firebase
    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('Access denied. Please check your permissions.');
        case 'not-found':
          throw new Error('Resource not found.');
        default:
          throw new Error(`Operation failed: ${error.message}`);
      }
    }
    
    throw error;
  }
}
```

### 4. Validaciones

#### Validaciones de Entrada
```typescript
// Validar parámetros requeridos
if (!userId || typeof userId !== 'string') {
  throw new Error('Valid userId is required');
}

// Validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}
```

#### Validaciones de Salida
```typescript
// Verificar que el resultado existe
if (!result) {
  throw new Error('Operation completed but no data returned');
}

// Validar estructura de datos
if (!result.id || !result.name) {
  throw new Error('Invalid data structure returned');
}
```

## 🧪 Testing

#### Estructura de Tests (Sugerida)
```typescript
// __tests__/[entity]-repository.test.ts
describe('[Entity]Repository', () => {
  let repository: I[Entity]Repository;
  
  beforeEach(() => {
    repository = new [Entity]RepositoryImpl();
  });
  
  describe('create[Entity]', () => {
    it('should create entity successfully', async () => {
      // Test implementation
    });
    
    it('should handle validation errors', async () => {
      // Test error cases
    });
  });
});
```

## 🚀 Guía de Uso

### Para Desarrolladores

#### Agregar un Nuevo Repositorio
```bash
# 1. Crear la interfaz
echo "Creando interfaz para [Entity]Repository..."

# 2. Implementar el repositorio
echo "Implementando [Entity]RepositoryImpl..."

# 3. Registrar en index.ts
echo "Registrando nuevo repositorio..."

# 4. Actualizar tipos si es necesario
echo "Actualizando tipos en src/types/..."
```

#### Usar un Repositorio Existente
```typescript
// En un componente o hook
import { userRepository } from '@/src/api';

const MyComponent = () => {
  const handleCreateUser = async (userData: UserData) => {
    try {
      const userId = await userRepository.createUser('user-id', userData);
      console.log('User created:', userId);
    } catch (error) {
      console.error('Error creating user:', error.message);
    }
  };
};
```

### Prompts Sugeridos para IA

#### Para Crear un Nuevo Repositorio
```
"Necesito crear un repositorio para la entidad [Entity] siguiendo el patrón Repository implementado en src/api/. 

La entidad debe tener las siguientes operaciones:
- [Operación 1]: [descripción]
- [Operación 2]: [descripción]

Por favor:
1. Crea la interfaz I[Entity]Repository en repositories/interfaces/
2. Implementa [Entity]RepositoryImpl en repositories/implementations/ 
3. Registra el repositorio en index.ts
4. Sigue las convenciones de manejo de errores y validaciones establecidas
5. Usa Firebase Firestore para las operaciones de datos"
```

#### Para Extender un Repositorio Existente
```
"Necesito agregar las siguientes operaciones al [Entity]Repository existente:
- [Nueva operación 1]: [descripción detallada]
- [Nueva operación 2]: [descripción detallada]

Por favor:
1. Actualiza la interfaz I[Entity]Repository
2. Implementa los nuevos métodos en [Entity]RepositoryImpl
3. Mantén el patrón de manejo de errores existente
4. Añade validaciones apropiadas"
```

#### Para Debugging
```
"Estoy teniendo un problema con el método [methodName] del [Entity]Repository. 
El error es: [error message]

Por favor ayuda a debuggear siguiendo las normas de manejo de errores establecidas en el README del API."
```

## 📚 Recursos Adicionales

### Firebase Documentation
- [Firestore SDK](https://firebase.google.com/docs/firestore)
- [Authentication](https://firebase.google.com/docs/auth)
- [Storage](https://firebase.google.com/docs/storage)

### TypeScript Best Practices
- [Interfaces vs Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Error Handling](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## 🔄 Changelog

### v1.0.0 (Actual)
- ✅ AuthRepository implementado
- ✅ UserRepository implementado
- ✅ Configuración de Firebase
- ✅ Manejo de errores estandarizado
- ✅ Mappers: añadida carpeta y ejemplo para User

### Próximas Funcionalidades
- [ ] SpotRepository
- [ ] ReviewRepository  
- [ ] SportRepository
- [ ] CommentRepository
- [ ] Tests unitarios
- [ ] Cache layer
- [ ] Offline support

---

**Nota**: Este README debe actualizarse cada vez que se agreguen nuevos repositorios o se modifiquen las normas de desarrollo.