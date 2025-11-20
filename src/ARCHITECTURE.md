# SpotsSports Architecture Guide

> **For AI Agents & Developers**: This document provides a complete reference for developing features and maintaining code in the SpotsSports project.

## 🎯 Project Overview

**SpotsSports** is a React Native mobile application built with Expo that helps users discover, review, and manage sports spots. The app follows a **modified Bulletproof React architecture** adapted for React Native development.

### Technology Stack

- **Framework**: React Native 0.81.5 with Expo ~54
- **Language**: TypeScript 5.9
- **Routing**: Expo Router 6.0 (file-based routing)
- **UI Library**: GluestackUI 3.0 + NativeWind 4.2 (Tailwind CSS)
- **Backend**: Firebase 12.2 (Firestore, Auth, Storage)
- **State Management**: React Context + Custom Hooks
- **Maps**: React Native Maps 1.20
- **Animations**: React Native Reanimated 4.1 + Legendapp Motion
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React Native

## 🏗️ Core Architecture Principles

### 1. **Feature Independence** 🚨 CRITICAL

**Features MUST NOT depend on each other**. This is the most important architectural constraint.

```typescript
// ❌ WRONG - Feature importing from another feature
import { SpotCard } from '@/src/features/spot';

// ✅ CORRECT - Features communicate via app/ pages
// In src/app/spot/[spotId].tsx:
import { SpotDetails } from '@/src/features/spot';
import { ReviewList } from '@/src/features/review';

<SpotDetails spot={spot} reviewsSlot={<ReviewList spotId={spotId} />} />
```

**Why?** Feature independence ensures:
- Features can be developed in parallel
- Code is more maintainable and testable
- Features can be easily removed or replaced
- Clear boundaries prevent tight coupling

**How features communicate:**
- Features expose components with "slots" (props for injecting other components)
- `src/app/` pages compose multiple features together
- Shared business logic goes in `src/entities/`

### 2. **Repository Pattern for API Access**

All Firebase operations are encapsulated in the `src/api/` layer using the repository pattern.

```typescript
// ✅ Features access API ONLY through hooks
// src/features/spot/hooks/use-spot-details.ts
import { spotRepository } from '@/src/api';

export const useSpotDetails = (spotId: string) => {
  const [spot, setSpot] = useState<Spot | null>(null);
  
  useEffect(() => {
    spotRepository.getSpotById(spotId).then(setSpot);
  }, [spotId]);
  
  return { spot };
};
```

**Layers:**
1. **Features** → Use hooks
2. **Hooks** → Call repository functions
3. **Repositories** → Interact with Firebase
4. **Mappers** → Transform data between Firebase and app models

### 3. **Dependency Injection via App Layer**

The `src/app/` folder controls:
- **Routes**: All routing is defined here (features don't control routes)
- **Pages**: Main screens that compose features
- **Dependency Injection**: Injecting feature components via props/callbacks

```typescript
// src/app/search-spots.tsx
export default function SearchSpots() {
  const handleSpotPress = (spotId: string) => {
    router.push(`/spot/${spotId}`);
  };
  
  return (
    <SpotMap 
      spots={spots}
      onSpotPress={handleSpotPress}  // Dependency injection
      filterSlot={<SpotFilters />}   // Component slot
    />
  );
}
```

### 4. **Shared Business Models in Entities**

The `src/entities/` folder contains business models (types/interfaces) used across the app.

**Constraints:**
- ❌ Entities MUST NOT import from any other src/ folder
- ✅ Entities CAN be imported by features, API, and app

```typescript
// src/entities/spot/spot.entity.ts
export interface Spot {
  id: string;
  name: string;
  location: GeoPoint;
  availableSports: string[];
  // ... other fields
}
```

## 📁 Folder Structure

```
src/
├── api/                    # Firebase API layer (Repository pattern)
│   ├── repositories/       # Repository implementations
│   ├── interfaces/         # Repository contracts
│   └── mappers/           # Data transformation
├── app/                    # Pages, routes, dependency injection
│   ├── _layout.tsx        # Root layout with providers
│   ├── auth/              # Authentication pages
│   ├── home-tabs/         # Main tab navigation
│   ├── profile/           # Profile pages
│   └── spot/              # Spot detail pages
├── components/            # Shared components
│   ├── commons/           # Common components (library abstractions)
│   │   ├── map/          # Map components (wraps react-native-maps)
│   │   ├── forms/        # Form components
│   │   └── carousel/     # Carousel components
│   └── ui/               # UI components (buttons, cards, modals)
│       ├── button/
│       ├── card/
│       ├── modal/
│       └── text/
├── context/              # React Contexts (global state)
│   ├── notification/
│   └── user/
├── entities/             # Business models (NO imports allowed)
│   ├── spot/
│   ├── user/
│   ├── review/
│   └── sport/
├── features/             # Feature modules (MUST be independent)
│   ├── auth/
│   ├── spot/
│   ├── spot-collection/
│   ├── user/
│   ├── review/
│   └── sport/
├── hooks/                # Global custom hooks
├── lib/                  # External library configurations
│   └── firebase/
├── types/                # Global TypeScript types
└── utils/                # Global utility functions
```

## 🎨 Feature Structure

Each feature follows this structure (subfolders are optional):

```
feature-name/
├── index.ts              # Public exports ONLY
├── README.md            # Feature documentation
├── components/          # Feature-specific UI components
│   ├── feature-card.tsx
│   └── feature-form.tsx
├── hooks/              # Custom hooks (business logic + API calls)
│   ├── use-feature.ts
│   └── use-feature-mutation.ts
├── types/              # Feature-specific types
│   └── feature-types.ts
├── utils/              # Feature utilities (validation, formatting)
│   └── validations.ts
├── constants/          # Feature constants (if needed)
│   └── categories.ts
└── storage/            # Local storage operations (if needed)
    └── cache.ts
```

**Allowed subfolders:**
- ✅ `components/` - Feature-specific UI components
- ✅ `hooks/` - Business logic and API calls
- ✅ `types/` - TypeScript types
- ✅ `utils/` - Utilities (validation, formatting, transformations)
- ✅ `constants/` - Constants
- ✅ `storage/` - Local/async storage operations

**NOT allowed:**
- ❌ `api/` - Use global `src/api/`
- ❌ `pages/` - Use `src/app/`
- ❌ Feature-to-feature imports

## 🔧 Development Patterns

### Component Pattern

```tsx
// Feature component with slots for composition
interface SpotDetailsProps {
  spot: Spot;
  onEdit?: () => void;
  reviewsSlot?: React.ReactNode;  // Slot for injecting reviews
  collectionsSlot?: React.ReactNode;  // Slot for collections
}

export const SpotDetails: React.FC<SpotDetailsProps> = ({
  spot,
  onEdit,
  reviewsSlot,
  collectionsSlot
}) => {
  return (
    <VStack>
      <SpotHeader spot={spot} onEdit={onEdit} />
      <SpotInfo spot={spot} />
      {collectionsSlot}  {/* Injected from app/ */}
      {reviewsSlot}      {/* Injected from app/ */}
    </VStack>
  );
};
```

### Hook Pattern

```tsx
// hooks/use-create-spot.ts
export const useCreateSpot = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createSpot = async (data: SpotFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate
      const validation = validateSpotData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Call repository
      const spot = await spotRepository.createSpot(data);
      
      return spot;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { createSpot, isLoading, error };
};
```

### Validation Pattern (Zod)

```typescript
import { z } from 'zod';

export const spotSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }),
  availableSports: z.array(z.string()).min(1)
});

export const validateSpot = (data: unknown) => {
  return spotSchema.safeParse(data);
};
```

### Page Pattern (App Layer)

```tsx
// src/app/spot/[spotId].tsx
import { useLocalSearchParams } from 'expo-router';
import { SpotDetails } from '@/src/features/spot';
import { ReviewList } from '@/src/features/review';
import { SpotCollectionButton } from '@/src/features/spot-collection';

export default function SpotPage() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();
  const { spot, isLoading } = useSpotDetails(spotId);
  
  const handleEdit = () => {
    router.push(`/spot/${spotId}/edit`);
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (!spot) return <NotFound />;
  
  return (
    <SafeAreaView>
      <SpotDetails
        spot={spot}
        onEdit={handleEdit}
        collectionsSlot={
          <SpotCollectionButton spotId={spotId} />
        }
        reviewsSlot={
          <ReviewList spotId={spotId} />
        }
      />
    </SafeAreaView>
  );
}
```

## 📦 Component Structure

### `src/components/commons/`

Common components that abstract external libraries or provide reusable functionality:

- **map/** - Wraps react-native-maps
  - `map-view.tsx` - Base map component
  - `point-picker.tsx` - Pick location on map
  - `marker.tsx` - Custom markers
  
- **forms/** - Reusable form components
  - `form-input.tsx`
  - `form-select.tsx`
  - `form-date-picker.tsx`

- **carousel/** - Image/content carousels
- **error-boundary/** - Error handling

### `src/components/ui/`

Pure UI components following GluestackUI patterns:

- `button/` - Button variants
- `card/` - Card components
- `modal/` - Modal/bottom sheet
- `text/` - Text components
- `input/` - Input fields
- `badge/` - Badges
- `avatar/` - Avatar components
- `spinner/` - Loading spinners

## 🔐 Authentication & Context

### User Context

```tsx
// src/context/user/user-context.tsx
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Firebase auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await userRepository.getUserById(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
  }, []);
  
  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
```

## 🎨 Styling Conventions

Using **NativeWind** (Tailwind CSS for React Native):

```tsx
// Tailwind utility classes
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900">
    Title
  </Text>
</View>

// Combining with GluestackUI
import { Button, ButtonText } from '@/components/ui/button';

<Button className="bg-primary-500">
  <ButtonText>Press Me</ButtonText>
</Button>
```

## 📝 Naming Conventions

### Files
- **Components**: `kebab-case.tsx` (e.g., `spot-card.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-spot-details.ts`)
- **Types**: `kebab-case-types.ts` or `entity-name.entity.ts`
- **Utils**: `kebab-case.ts` (e.g., `date-utils.ts`)
- **Pages**: `kebab-case.tsx` or `[param].tsx` for dynamic routes

### Code
- **Components**: `PascalCase` (e.g., `SpotCard`)
- **Hooks**: `camelCase` starting with `use` (e.g., `useSpotDetails`)
- **Functions**: `camelCase` (e.g., `createSpot`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_SPOTS`)
- **Types/Interfaces**: `PascalCase` (e.g., `Spot`, `SpotFormData`)

## 🧪 Testing Guidelines

```tsx
// Component tests
import { render, fireEvent } from '@testing-library/react-native';

describe('SpotCard', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SpotCard spot={mockSpot} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('spot-card'));
    expect(onPress).toHaveBeenCalledWith(mockSpot);
  });
});
```

## 🚀 Common Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Lint code
npm run lint

# Clear cache and restart
npx expo start --clear
```

## 📚 Key Libraries & Their Uses

| Library | Purpose | Documentation |
|---------|---------|---------------|
| Expo Router | File-based routing | [Docs](https://docs.expo.dev/router/introduction/) |
| GluestackUI | UI component library | [Docs](https://gluestack.io/) |
| NativeWind | Tailwind CSS for RN | [Docs](https://www.nativewind.dev/) |
| Firebase | Backend services | [Docs](https://firebase.google.com/docs) |
| React Native Maps | Map components | [Docs](https://github.com/react-native-maps/react-native-maps) |
| Zod | Schema validation | [Docs](https://zod.dev/) |
| Lucide | Icon library | [Docs](https://lucide.dev/) |

## ⚠️ Common Pitfalls to Avoid

1. ❌ **Cross-feature imports** - Features must not import from each other
2. ❌ **Direct Firebase calls in features** - Always use repositories
3. ❌ **Routing logic in features** - Routing belongs in `app/`
4. ❌ **Entity imports from features/app** - Entities can't import anything
5. ❌ **Missing TypeScript types** - Always type your props and state
6. ❌ **Hardcoded strings** - Use constants for repeated values
7. ❌ **Missing loading/error states** - Always handle async operations properly

## 🎯 Quick Reference for AI Agents

**When creating a new feature:**
1. Create folder in `src/features/[feature-name]/`
2. Add `index.ts` with public exports
3. Create `components/` with UI components (use slots for composition)
4. Create `hooks/` for business logic and API calls
5. Add types in `types/` folder
6. Create validations in `utils/` using Zod
7. Document in `README.md`
8. **Never** import from other features
9. Compose features in `src/app/` pages

**When creating a new page:**
1. Add file in `src/app/` following route structure
2. Import feature components
3. Handle navigation callbacks
4. Inject dependencies via props
5. Manage page-level state
6. Wrap in `SafeAreaView`

**When accessing Firebase:**
1. Create repository function in `src/api/repositories/`
2. Create hook in feature's `hooks/` folder
3. Call repository from hook
4. Use hook in components
5. Handle loading/error states

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained by**: SpotsSports Development Team
