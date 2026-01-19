# Authentication Feature

## 📦 Status

**Status:** Implemented and production-ready — session management, secure storage and token refresh implemented.

Secure authentication system with session management, token refresh, and automatic session restoration.

## 🎯 Overview

This feature provides a complete authentication solution using Firebase Auth with:

- ✅ **Secure session storage** using expo-secure-store (platform-native Keychain/Keystore)
- ✅ **Automatic token refresh** before expiration (5-minute threshold)
- ✅ **Session restoration** on app restart
- ✅ **Race condition prevention** during registration
- ✅ **Session monitoring** with app state awareness
- ✅ **Professional error handling** with localized messages

## 🏗️ Architecture

```
auth/
├── components/           # UI components
│   ├── auth-selector.tsx
│   ├── sign-in-form.tsx
│   ├── sign-out.tsx
│   └── sign-up-form.tsx
├── hooks/               # Business logic hooks
│   ├── use-sign-in.ts          # Login orchestration
│   ├── use-sign-out.ts         # Logout orchestration
│   ├── use-sign-up.ts          # Registration orchestration
│   ├── use-session-monitor.ts  # Session validation & refresh
│   └── use-username-validation.ts
├── storage/             # Secure storage layer
│   └── token-storage.ts        # expo-secure-store wrapper
├── types/
│   └── auth-types.ts
└── utils/
    └── auth-validations.ts
```

## 🔐 Security Features

### 1. Secure Token Storage

All session data is stored using `expo-secure-store`:

- **iOS**: Uses Keychain with kSecAttrAccessibleAfterFirstUnlock
- **Android**: Uses EncryptedSharedPreferences (AES-256)
- **Web**: Uses browser's secure storage APIs

```typescript
interface SessionData {
  userId: string;
  token: string;           // Firebase ID token
  refreshToken?: string;   // Firebase refresh token
  expiresAt: number;       // Unix timestamp (ms)
}
```

### 2. Automatic Token Refresh

Tokens are automatically refreshed when:
- Time remaining < 5 minutes
- App resumes from background
- Periodic check (every 2 minutes when authenticated)

### 3. Session Validation

Sessions are validated:
- On app startup (session restoration)
- When app becomes active/foreground
- Periodically while authenticated
- Before navigation

## 📱 Authentication Flows

### Sign-Up Flow

```
1. Validate username availability
   ↓
2. Create Firebase Auth user (email/password)
   ↓
3. Upload profile photo (optional)
   ↓
4. Create Firestore user document
   ↓
5. Wait for document creation (polling with timeout)
   ↓
6. Get session data (token + expiration)
   ↓
7. Save session to secure store
   ↓
8. UserContext detects auth state change
   ↓
9. App navigates to home
```

**Key Features:**
- ✅ No race conditions - waits for Firestore document
- ✅ Photo upload is non-blocking
- ✅ Comprehensive error handling
- ✅ Session saved before navigation

### Sign-In Flow

```
1. Authenticate with Firebase (email/password)
   ↓
2. Get session data (token + expiration + refresh token)
   ↓
3. Save session to secure store
   ↓
4. UserContext detects auth state change
   ↓
5. Load user data from Firestore
   ↓
6. App navigates to home
```

### Session Restoration Flow

```
App Launch
   ↓
Check secure store for session
   ↓
Session exists? ──No──> Navigate to /auth
   ↓ Yes
Check expiration
   ↓
Expired? ──Yes──> Clear session → Navigate to /auth
   ↓ No
Expiring soon (< 5min)? ──Yes──> Refresh token
   ↓ No
Load user data from Firestore
   ↓
Navigate to /home-tabs/my-feed
```

## 🔧 Usage

### Sign Up

```tsx
import { useSignUp } from '@/src/features/auth';

function SignUpScreen() {
  const { signUp, isLoading, error } = useSignUp();

  const handleSignUp = async () => {
    await signUp(
      'user@example.com',
      'password123',
      'username',
      photoUri,      // optional
      birthDate,     // optional
      'Full Name',   // optional
      'Bio text'     // optional
    );
  };

  return (
    <SignUpForm 
      onSubmit={handleSignUp}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### Sign In

```tsx
import { useSignIn } from '@/src/features/auth';

function SignInScreen() {
  const { signIn, isLoading, error } = useSignIn();

  const handleSignIn = async () => {
    const result = await signIn('user@example.com', 'password123');
    
    if (result.success) {
      // Navigation handled automatically by UserContext
    }
  };

  return (
    <SignInForm 
      onSubmit={handleSignIn}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### Sign Out

```tsx
import { useSignOut } from '@/src/features/auth';

function ProfileScreen() {
  const { signOut, isSigningOut } = useSignOut();

  return (
    <Button onPress={signOut} disabled={isSigningOut}>
      Sign Out
    </Button>
  );
}
```

### Session Monitoring

Session monitoring is automatic when added to `_layout.tsx`:

```tsx
// src/app/_layout.tsx
import { useSessionMonitor } from '@/src/features/auth';

function SessionMonitor() {
  useSessionMonitor();
  return null;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <SessionMonitor />
      {/* ... rest of app */}
    </UserProvider>
  );
}
```

## 🗄️ Storage API

### Session Management

```typescript
import { 
  saveSession, 
  getSession, 
  clearSession, 
  isSessionValid,
  getSessionTimeRemaining 
} from '@/src/features/auth/storage/token-storage';

// Save session
await saveSession({
  userId: 'user123',
  token: 'eyJhbGc...',
  refreshToken: 'refresh_token',
  expiresAt: Date.now() + 3600000 // 1 hour
});

// Get session
const session = await getSession(); // SessionData | null

// Check validity
const isValid = await isSessionValid(); // boolean

// Time remaining
const timeLeft = await getSessionTimeRemaining(); // milliseconds

// Clear session
await clearSession();
```

## 🔄 Repository Methods

### Auth Repository

```typescript
interface IAuthRepository {
  // Authentication
  login(email: string, password: string): Promise<string>;
  register(email: string, password: string): Promise<string>;
  logout(): Promise<void>;
  
  // Session management
  getSessionData(): Promise<AuthSessionData | null>;
  refreshToken(): Promise<string | null>;
  getCurrentUserId(): string | null;
  
  // Auth state
  onAuthStateChanged(callback: (userId: string | null) => void): () => void;
  checkAuth(): Promise<boolean>;
  
  // Token management
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  
  // Registration support
  waitForUserDocument(
    userId: string, 
    maxAttempts?: number, 
    delayMs?: number
  ): Promise<boolean>;
}
```

### Key Methods

#### `waitForUserDocument(userId, maxAttempts, delayMs)`

Polls Firestore until user document exists, preventing race conditions.

**Parameters:**
- `userId`: User ID to wait for
- `maxAttempts`: Max retry attempts (default: 5)
- `delayMs`: Delay between attempts (default: 500ms)

**Returns:** `true` if document exists, `false` if timeout

**Example:**
```typescript
const exists = await authRepository.waitForUserDocument('user123', 5, 500);
// Total max wait: 2.5 seconds (5 × 500ms)
```

#### `getSessionData()`

Gets complete session data for current authenticated user.

**Returns:**
```typescript
{
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
}
```

#### `refreshToken()`

Forces token refresh for current user.

**Returns:** New token string or `null` if failed

## 🎛️ Configuration

### Token Refresh Timing

```typescript
// src/features/auth/hooks/use-session-monitor.ts

const FIVE_MINUTES = 5 * 60 * 1000;  // Refresh threshold
const CHECK_INTERVAL = 2 * 60 * 1000; // Check every 2 minutes
```

### Polling Configuration

```typescript
// src/features/auth/hooks/use-sign-up.ts

await authRepository.waitForUserDocument(
  userId,
  5,    // maxAttempts
  500   // delayMs (milliseconds)
);
// Total max wait: 2.5 seconds
```

## 🚨 Error Handling

All authentication errors are localized and user-friendly:

### Registration Errors

- `auth/email-already-in-use` → "Esta dirección de correo ya está registrada..."
- `auth/weak-password` → "La contraseña es muy débil..."
- `auth/invalid-email` → "Por favor, ingresa una dirección de correo válida."
- `auth/network-request-failed` → "No se pudo conectar al servidor..."

### Login Errors

- `auth/invalid-credential` → "Invalid email or password"
- `auth/network-request-failed` → "Network connection error..."

### Session Errors

When session expires or becomes invalid:
1. Clear session from secure store
2. Logout from Firebase
3. Clear user state
4. Show alert: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
5. Navigate to `/auth/authentication`

## 🧪 Testing Considerations

### Manual Testing

1. **Registration Flow:**
   - Create account with valid credentials
   - Verify user document created in Firestore
   - Verify session stored securely
   - Check navigation to home

2. **Login Flow:**
   - Login with existing credentials
   - Verify session restored
   - Check navigation

3. **Session Restoration:**
   - Login, close app, reopen
   - Verify automatic login without credentials
   - Check token refresh if needed

4. **Token Refresh:**
   - Reduce `FIVE_MINUTES` to 10 seconds for testing
   - Login and wait
   - Verify token refresh logs

5. **Session Expiration:**
   - Manually set `expiresAt` to past timestamp
   - Reopen app
   - Verify logout and navigation to auth

## 📊 Performance

- **Session restoration:** < 100ms (secure store read)
- **Token refresh:** ~ 500-1000ms (network request)
- **User document polling:** Max 2.5s (5 × 500ms)
- **Periodic checks:** Every 2 minutes (minimal battery impact)

## 🔒 Security Best Practices

✅ **Implemented:**
- Secure token storage (platform-native encryption)
- Automatic token refresh
- Session expiration handling
- No tokens in AsyncStorage or plain text
- Proper logout clears all session data

⚠️ **Recommendations:**
1. Enable Firebase App Check for additional security
2. Implement rate limiting on backend
3. Add biometric authentication (Face ID/Touch ID) for quick unlock
4. Consider implementing absolute session timeout (e.g., 30 days max)

## 🔗 Dependencies

- `firebase` (^12.2.1) - Authentication & Firestore
- `expo-secure-store` (~15.0.8) - Secure storage
- `@react-native-async-storage/async-storage` (2.2.0) - Firebase persistence

## 📝 Migration Notes

### Deprecated Methods

Old token storage methods are deprecated but still available:

```typescript
// ❌ Old (deprecated)
await saveAuthToken(token);
const token = await getAuthToken();
await clearAuthToken();

// ✅ New (recommended)
await saveSession({ userId, token, refreshToken, expiresAt });
const session = await getSession();
await clearSession();
```

Deprecated methods will be removed in a future version.

## 🐛 Troubleshooting

### "User document not found" after registration

**Cause:** Firestore write latency  
**Solution:** Already handled by `waitForUserDocument()` - increases `maxAttempts` if needed

### Session not persisting after app restart

**Cause:** expo-secure-store not available  
**Solution:** Check device compatibility and Expo configuration

### Token refresh fails repeatedly

**Cause:** Network issues or Firebase Auth error  
**Solution:** Check network connectivity and Firebase console

### Navigation loops (auth ↔ home)

**Cause:** Race condition in UserContext  
**Solution:** Verify session restoration completes before navigation

---

**Version:** 2.0.0  
**Last Updated:** December 2025  
**Breaking Changes:** Session storage format changed from single token to SessionData object
