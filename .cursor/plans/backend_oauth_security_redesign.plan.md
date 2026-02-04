---
name: ""
overview: ""
todos: []
isProject: false
---

# Backend OAuth & Security Redesign Plan

**Created:** 2026-02-02  
**Status:** Planning  
**Goal:** Move OAuth flows to backend, add security best practices, enable extensibility for Apple sign-in and email/password registration.

---

## Executive Summary

This plan moves all OAuth/authentication flows to the **backend**, eliminating client-side OAuth complexity and redirect URI mismatches. The backend becomes the single source of truth for authentication, authorization, and input validation. The architecture is designed to easily add Apple sign-in and email/password registration later.

---

## Current State

### What We Have

- **Backend:** POST `/auth/google` accepts `idToken` from client and verifies it
- **Mobile:** Uses `expo-auth-session` to get Google `id_token` client-side, then POSTs to backend
- **Problem:** Client needs `EXPO_PUBLIC_GOOGLE_CLIENT_ID` and redirect URI in Google Cloud Console → `redirect_uri_mismatch` issues

### Pain Points

1. OAuth configuration split between client and backend
2. Redirect URI management for each client (web, iOS, Android)
3. Client-side token handling before it reaches the backend
4. Adding new providers (Apple) requires client-side SDK integration

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           MOBILE APP                                 │
├─────────────────────────────────────────────────────────────────────┤
│  1. User taps "Sign in with Google"                                 │
│  2. App opens: WebBrowser.openAuthSessionAsync(                     │
│       "https://api.example.com/api/v1/auth/google/start"            │
│     )                                                                │
│  3. App receives deep link: kitchen-hub://auth/callback?token=JWT   │
│  4. App stores JWT, sets API auth, loads user                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND API                                │
├─────────────────────────────────────────────────────────────────────┤
│  GET /auth/google/start                                             │
│    → Generate state, store in signed cookie/session                 │
│    → Redirect to Google with redirect_uri=.../auth/google/callback  │
│                                                                      │
│  GET /auth/google/callback?code=...&state=...                       │
│    → Validate state (CSRF protection)                               │
│    → Exchange code for tokens (using GOOGLE_CLIENT_SECRET)          │
│    → Verify id_token, extract user info                             │
│    → Create/find user, create household if needed                   │
│    → Generate JWT (access + refresh tokens)                         │
│    → Redirect to: kitchen-hub://auth/callback?token=JWT             │
│                   (or error URL if failed)                          │
│                                                                      │
│  POST /auth/google (KEEP for backward compat / API clients)         │
│    → Accepts idToken directly (existing flow)                       │
│                                                                      │
│  POST /auth/apple/start, GET /auth/apple/callback (FUTURE)          │
│  POST /auth/register, POST /auth/login (FUTURE - email/password)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Principles

### 1. Authentication

- **All OAuth secrets on backend only** — no client IDs/secrets in the mobile app
- **State parameter** for CSRF protection on all OAuth flows
- **Signed/encrypted state** (HMAC or encrypted cookie) to prevent tampering
- **Short-lived access tokens** (15-30 min), long-lived refresh tokens (7-30 days)
- **Secure token storage** — mobile uses `expo-secure-store` (native) or secure cookies (web)

### 2. Authorization

- **JWT claims** include `userId`, `householdId`, roles/permissions
- **Household-scoped access** — backend guards check user belongs to household
- **Rate limiting** on auth endpoints (prevent brute force)
- **Token revocation** support (blacklist or short expiry + refresh rotation)

### 3. Input Validation

- **DTOs with class-validator** on all endpoints (already in place)
- **Sanitize** all user inputs before storage
- **Parameterized queries** via Prisma (already in place)
- **Content-Type enforcement** — reject non-JSON bodies

### 4. Transport Security

- **HTTPS only** in production
- **Secure cookies** for web (HttpOnly, Secure, SameSite)
- **Deep link validation** — only accept tokens from expected callback URL

---

## Implementation Phases

### Phase 1: Backend OAuth for Google (Priority: High)

#### 1.1 Configuration Updates

**File:** `backend/src/config/configuration.ts`

Add:

```typescript
auth: {
  google: {
    clientId: string;
    clientSecret: string;
  };
  // Base URL for OAuth callbacks (e.g. https://api.kitchenhub.app)
  backendBaseUrl: string;
  // App deep link scheme (e.g. kitchen-hub)
  appScheme: string;
  // State signing secret for CSRF protection
  stateSecret: string;
}
```

**File:** `backend/src/config/env.validation.ts`

Add:

```typescript
AUTH_BACKEND_BASE_URL: z.string().url(),
AUTH_APP_SCHEME: z.string().default('kitchen-hub'),
AUTH_STATE_SECRET: z.string().min(32),
```

#### 1.2 OAuth State Service

**New file:** `backend/src/modules/auth/services/oauth-state.service.ts`

```typescript
@Injectable()
export class OAuthStateService {
  /**
   * Generates a signed state token for CSRF protection.
   * Contains: random nonce, timestamp, optional metadata (e.g. householdId for join flow)
   */
  generateState(metadata?: { householdId?: string }): string;

  /**
   * Validates and decodes a state token.
   * Throws if expired (5 min TTL) or signature invalid.
   */
  validateState(state: string): { nonce: string; metadata?: { householdId?: string } };
}
```

#### 1.3 New OAuth Controller Endpoints

**File:** `backend/src/modules/auth/controllers/oauth.controller.ts` (new)

```typescript
@Controller({ path: 'auth', version: '1' })
export class OAuthController {
  
  /**
   * GET /auth/google/start?householdId=xxx (optional)
   * 
   * Initiates Google OAuth flow.
   * - Generates state token with CSRF nonce
   * - Redirects to Google authorization URL
   */
  @Get('google/start')
  @Public()
  @Redirect()
  startGoogleAuth(@Query('householdId') householdId?: string);

  /**
   * GET /auth/google/callback?code=...&state=...
   * 
   * Handles Google OAuth callback.
   * - Validates state (CSRF check)
   * - Exchanges code for tokens
   * - Creates/finds user
   * - Generates app JWT
   * - Redirects to app deep link with token
   */
  @Get('google/callback')
  @Public()
  @Redirect()
  handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
  );
}
```

#### 1.4 Auth Service Updates

**File:** `backend/src/modules/auth/services/auth.service.ts`

Add method:

```typescript
/**
 * Exchanges Google authorization code for tokens and authenticates user.
 * Called by OAuth callback handler.
 */
async authenticateGoogleWithCode(
  code: string,
  redirectUri: string,
  metadata?: { householdId?: string }
): Promise<AuthResponseDto>;
```

This method:

1. Exchanges `code` for `access_token` + `id_token` using `GOOGLE_CLIENT_SECRET`
2. Verifies `id_token`
3. Calls existing `findOrCreateGoogleUser()` and household logic
4. Returns `AuthResponseDto` with JWT

#### 1.5 Google Cloud Console Setup

**Required redirect URI:**

```
https://api.kitchenhub.app/api/v1/auth/google/callback
```

(or localhost for dev: `http://localhost:3000/api/v1/auth/google/callback`)

**Only one redirect URI** — the backend callback. No client redirect URIs needed.

---

### Phase 2: Mobile App Updates (Priority: High)

#### 2.1 New OAuth Hook

**Replace:** `mobile/src/features/auth/hooks/useGoogleIdToken.ts`  
**With:** `mobile/src/features/auth/hooks/useOAuthSignIn.ts`

```typescript
export interface UseOAuthSignInResult {
  signInWithGoogle: (options?: { householdId?: string }) => Promise<OAuthResult>;
  signInWithApple: () => Promise<OAuthResult>; // Future
  isLoading: boolean;
}

export interface OAuthResult {
  success: boolean;
  token?: string;
  error?: string;
  isNewHousehold?: boolean;
}

export function useOAuthSignIn(): UseOAuthSignInResult {
  const signInWithGoogle = async (options) => {
    const url = `${config.api.baseUrl}/auth/google/start${
      options?.householdId ? `?householdId=${options.householdId}` : ''
    }`;
    
    const result = await WebBrowser.openAuthSessionAsync(
      url,
      `${config.auth.appScheme}://auth/callback`
    );
    
    if (result.type === 'success') {
      // Parse token from URL: kitchen-hub://auth/callback?token=...
      const params = parseCallbackUrl(result.url);
      return { success: true, token: params.token, isNewHousehold: params.isNewHousehold };
    }
    return { success: false, error: 'Cancelled or failed' };
  };
  
  return { signInWithGoogle, signInWithApple: notImplemented, isLoading };
}
```

#### 2.2 Deep Link Configuration

**File:** `mobile/app.json`

Already has:

```json
"scheme": "kitchen-hub"
```

Expo handles `kitchen-hub://` deep links automatically.

#### 2.3 AuthContext Updates

**File:** `mobile/src/contexts/AuthContext.tsx`

Change `signInWithGoogle`:

```typescript
// OLD: signInWithGoogle({ idToken, householdId? })
// NEW: signInWithGoogle({ householdId? }) — no idToken, uses OAuth flow

const signInWithGoogle = async (params?: { householdId?: string }) => {
  const result = await oauthSignIn.signInWithGoogle(params);
  if (!result.success) {
    throw new Error(result.error || 'Sign in failed');
  }
  
  // Store token
  await saveTokens(result.token!);
  setAuthToken(result.token!);
  
  // Decode or fetch user info
  const user = await fetchCurrentUser(); // GET /auth/me
  
  if (result.isNewHousehold) {
    setPendingAuth({ user, ... });
  } else {
    setUser(user);
    await saveUser(user);
  }
};
```

#### 2.4 Screen Updates

**Files to update:**

- `LoginScreen.tsx` — remove `useGoogleIdToken`, use new flow
- `EnterInviteCodeScreen.tsx` — pass `householdId` to `signInWithGoogle`
- `SettingsScreen.tsx` — use new flow for guest→Google upgrade

Changes are minimal: remove `idToken` handling, call `signInWithGoogle()` directly.

#### 2.5 Remove Client OAuth Config

**Files to update:**

- `mobile/src/config/index.ts` — remove `googleClientId`
- `mobile/.env` — remove `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- Delete `mobile/src/features/auth/hooks/useGoogleIdToken.ts`
- Delete `mobile/src/services/authApi.ts` `authenticateGoogle` (or keep for API clients)

---

### Phase 3: Add /auth/me Endpoint (Priority: High)

**File:** `backend/src/modules/auth/controllers/auth.controller.ts`

```typescript
/**
 * GET /auth/me
 * 
 * Returns current authenticated user info.
 * Used by mobile after OAuth callback to get full user object.
 */
@Get('me')
@HttpCode(HttpStatus.OK)
async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
  return this.authService.getCurrentUser(user.userId);
}
```

This avoids putting full user data in the callback URL (security) and provides fresh data.

---

### Phase 4: Apple Sign-In (Priority: Medium, Future)

#### 4.1 Configuration

Add to `AppConfig`:

```typescript
apple: {
  clientId: string;      // Service ID (e.g. com.kitchenhub.app)
  teamId: string;        // Apple Developer Team ID
  keyId: string;         // Key ID for Sign in with Apple
  privateKey: string;    // .p8 private key contents
}
```

#### 4.2 Endpoints

```typescript
// Similar pattern to Google
@Get('apple/start')
@Public()
startAppleAuth();

@Post('apple/callback')  // Apple uses POST for callback
@Public()
handleAppleCallback(@Body() body: AppleCallbackDto);
```

#### 4.3 Notes

- Apple sends user info only on **first** sign-in; store it
- Apple uses `nonce` for replay protection
- Server-to-server token validation required

---

### Phase 5: Email/Password Registration (Priority: Low, Future)

#### 5.1 Endpoints

```typescript
@Post('register')
@Public()
async register(@Body() dto: RegisterDto) {
  // Validate email format
  // Check email not already registered
  // Hash password (bcrypt, Argon2)
  // Create user
  // Send verification email
  // Return success (don't auto-login until verified)
}

@Post('login')
@Public()
async login(@Body() dto: LoginDto) {
  // Find user by email
  // Verify password hash
  // Check email verified
  // Generate tokens
  // Return AuthResponseDto
}

@Post('verify-email')
@Public()
async verifyEmail(@Body() dto: VerifyEmailDto);

@Post('forgot-password')
@Public()
async forgotPassword(@Body() dto: ForgotPasswordDto);

@Post('reset-password')
@Public()
async resetPassword(@Body() dto: ResetPasswordDto);
```

#### 5.2 Security Considerations

- **Password hashing:** Argon2id (preferred) or bcrypt with cost ≥12
- **Email verification:** Required before login
- **Rate limiting:** On login, register, forgot-password (e.g. 5/min)
- **Account lockout:** After N failed attempts
- **Password requirements:** Min 8 chars, complexity optional but recommended

---

## Environment Variables Summary

### Backend (Required for Phase 1)

```env
# Existing
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# New
AUTH_BACKEND_BASE_URL=https://api.kitchenhub.app  # or http://localhost:3000 for dev
AUTH_APP_SCHEME=kitchen-hub
AUTH_STATE_SECRET=<random-32-char-string>
```

### Mobile (Simplified)

```env
# Existing
EXPO_PUBLIC_API_URL=https://api.kitchenhub.app
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Removed
# EXPO_PUBLIC_GOOGLE_CLIENT_ID  ← no longer needed
```

---

## Testing Strategy

### Backend Tests

1. **Unit tests** for `OAuthStateService` (generate, validate, expiry, tampering)
2. **Unit tests** for `authenticateGoogleWithCode` (mock Google token exchange)
3. **Integration tests** for OAuth flow (mock Google endpoints)
4. **E2E tests** for full redirect flow (if feasible)

### Mobile Tests

1. **Unit tests** for `useOAuthSignIn` (mock WebBrowser)
2. **Unit tests** for callback URL parsing
3. **Integration tests** for AuthContext with new flow

### Manual Testing

1. Web: Sign in with Google → redirect → callback → app
2. iOS Simulator: Same flow with deep link
3. Android Emulator: Same flow with deep link
4. Error cases: Cancel, invalid state, expired code

---

## Migration Checklist

### Backend

- Add new env vars to `env.validation.ts` and `configuration.ts`
- Create `OAuthStateService`
- Create `OAuthController` with `/auth/google/start` and `/auth/google/callback`
- Add `authenticateGoogleWithCode` to `AuthService`
- Add `/auth/me` endpoint
- Add tests for new code
- Update API documentation

### Mobile

- Create `useOAuthSignIn` hook
- Update `AuthContext.signInWithGoogle`
- Update `LoginScreen`, `EnterInviteCodeScreen`, `SettingsScreen`
- Remove `useGoogleIdToken` hook
- Remove `EXPO_PUBLIC_GOOGLE_CLIENT_ID` from config and .env
- Update tests
- Test on web, iOS, Android

### Ops

- Add `AUTH_BACKEND_BASE_URL`, `AUTH_STATE_SECRET` to production env
- Update Google Cloud Console: single redirect URI to backend callback
- Deploy backend first, then mobile

---

## Rollback Plan

Keep `POST /auth/google` (accepts `idToken`) working during transition. If issues arise:

1. Mobile can revert to old flow by restoring `useGoogleIdToken` and `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
2. Backend continues accepting both flows

---

## Success Criteria

1. **Security:** No OAuth secrets in mobile app; state-based CSRF protection working
2. **Functionality:** Google sign-in works on web, iOS, Android
3. **Simplicity:** Only one redirect URI configured in Google Cloud
4. **Extensibility:** Adding Apple sign-in follows the same pattern with minimal effort
5. **No regressions:** Existing users can still sign in; data preserved

---

## Appendix: Callback URL Format

Backend redirects to:

```
kitchen-hub://auth/callback?token=<JWT>&isNewHousehold=true|false
```

On error:

```
kitchen-hub://auth/callback?error=<error_code>&message=<url_encoded_message>
```

App parses URL, handles success/error appropriately.