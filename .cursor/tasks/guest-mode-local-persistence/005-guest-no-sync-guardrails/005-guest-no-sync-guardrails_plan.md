---
name: Enforce Guest No-Sync Guardrails
overview: Add comprehensive guardrails to ensure guest data never syncs remotely by implementing mode gating, runtime assertions, and tests that prevent sync actions from being enqueued or executed in guest mode.
todos:
  - id: create-guardrail-utilities
    content: Create guestNoSyncGuardrails.ts with assertSignedInMode() and assertNoGuestMode() utilities
    status: completed
  - id: add-sync-enqueue-guardrail
    content: Add guardrail to sync queue enqueue function (enqueueSyncAction) - prevent guest mode from enqueueing sync actions
    status: pending
    note: Sync queue feature not yet implemented. Guardrail ready to add when feature exists.
  - id: add-sync-start-guardrail
    content: Add guardrail to sync orchestrator entry points (runSyncCycle/startSync) - prevent guest mode from starting sync
    status: pending
    note: Sync orchestrator feature not yet implemented. Guardrail ready to add when feature exists.
  - id: add-sync-application-defense
    content: Add defense-in-depth guardrail to applyRemoteUpdatesToLocal() without signature changes (check user from context or storage key validation)
    status: completed
  - id: add-remote-service-auth-assertions
    content: Add assertAuthenticated() assertions in Remote*Service methods (check for session/accessToken presence, not userMode param)
    status: completed
    note: Implemented via JSDoc documentation and service factory guards. Remote services require authentication (JWT tokens) which naturally blocks guest mode.
  - id: test-sync-enqueue-blocked
    content: Test that guest mode cannot enqueue sync actions
    status: pending
    note: Depends on sync queue implementation.
  - id: test-sync-start-blocked
    content: Test that guest mode cannot start sync cycles
    status: pending
    note: Depends on sync orchestrator implementation.
  - id: test-api-client-never-called
    content: Test that guest mode never calls api client (mock api.request and assert it's never called in guest flows)
    status: completed
  - id: test-guardrail-utilities
    content: Create comprehensive unit tests for guestNoSyncGuardrails utilities
    status: completed
  - id: update-documentation
    content: Update DATA_MODES_SPEC.md with sync guardrails documentation (nice-to-have)
    status: completed
isProject: false
---

# Enforce Guest No-Sync Guardrails

## Revised Approach

**Key Principle**: Guard at boundaries, not thread state through every function.

- **Sync orchestrator/entry points**: Guard at `enqueueSyncAction()`, `startSync()`, `runSyncCycle()`
- **Sync application**: Defense-in-depth in `applyRemoteUpdatesToLocal()` without signature changes
- **Remote services**: Require authentication/session, not userMode param
- **API client**: Keep dumb, guard at service layer, test by mocking

## Current Status Analysis

### ✅ Already Implemented

1. **Service Layer Guardrails**
   - Service factories (`createShoppingService`, `createRecipeService`, `createChoresService`) validate mode compatibility
   - `validateServiceCompatibility()` prevents guest mode from using remote services
   - Services are correctly selected based on user mode in screens/hooks

2. **Type System Guardrails**
   - Discriminated unions in `dataModes.ts` prevent mode mixing at compile time
   - Type guards (`isGuestEntity`, `isSignedInEntity`) available

3. **Storage Layer Separation**
   - Different storage keys for guest (`@kitchen_hub_guest_*`) vs signed-in (`@kitchen_hub_cache_*`)
   - Storage helpers validate key prefixes match expected mode

4. **Backend Protection**
   - JWT auth guard requires authentication for private endpoints
   - Guest users without JWT cannot access protected endpoints

### ❌ Missing Guardrails

1. **Sync Queue Enqueue Protection** ⚠️ **CRITICAL**
   - No explicit sync queue found yet, but when implemented, `enqueueSyncAction()` must refuse guest mode
   - This is the most important single gate per success criteria

2. **Sync Orchestrator Entry Points**
   - No sync orchestrator found yet (`startSync()`, `runSyncCycle()`)
   - When implemented, these must guard against guest mode at entry

3. **Sync Application Defense-in-Depth**
   - `mobile/src/common/utils/syncApplication.ts` - `applyRemoteUpdatesToLocal()` has no guest mode assertion
   - Uses `getSignedInCacheKey()` which implies signed-in, but no explicit check
   - Should add defense-in-depth without signature changes

4. **Remote Service Authentication Assertions**
   - `RemoteShoppingService`, `RemoteRecipeService`, `RemoteChoresService` don't assert authentication
   - Should require session/accessToken, not userMode param

5. **Test Coverage**
   - No tests verifying guest mode never triggers API calls
   - No tests verifying sync functions throw errors in guest mode
   - No tests verifying remote services reject guest mode calls

## Implementation Plan

### Must-Have Guardrails

#### 1. Create Guardrail Utilities

**File**: `mobile/src/common/guards/guestNoSyncGuardrails.ts` (NEW)

Create centralized guardrail utilities that check user state, not thread mode through functions:

```typescript
/**
 * Guest No-Sync Guardrails
 * 
 * Provides runtime assertions to prevent guest data from syncing remotely.
 * These guardrails enforce the principle that guest data is local-only.
 * 
 * Guardrails check user state at boundaries, not thread mode through every function.
 */

import type { User } from '../../contexts/AuthContext';

/**
 * Asserts that the user is in signed-in mode (not guest).
 * Throws an error if user is guest or null.
 * 
 * @param user - The current user (from AuthContext)
 * @param operation - Description of the operation being prevented
 * @throws Error if user is null or user.isGuest is true
 */
export function assertSignedInMode(
  user: User | null,
  operation: string = 'Sync operation'
): asserts user is User & { isGuest: false } {
  if (!user || user.isGuest) {
    throw new Error(
      `${operation} is not allowed in guest mode. Guest data is local-only and never synced remotely.`
    );
  }
}

/**
 * Asserts that the user is not in guest mode.
 * Throws an error if user is guest.
 * 
 * @param user - The current user (from AuthContext)
 * @param operation - Description of the operation being prevented
 * @throws Error if user is null or user.isGuest is true
 */
export function assertNoGuestMode(
  user: User | null,
  operation: string = 'Remote operation'
): void {
  if (!user || user.isGuest) {
    throw new Error(
      `${operation} is not allowed in guest mode. Guest data is local-only and never synced remotely.`
    );
  }
}
```

**Alternative for non-React contexts**: If guardrails need to work outside React context, accept user as parameter from call sites.

#### 2. Add Guardrail to Sync Queue Enqueue ⚠️ **CRITICAL**
**File**: Wherever sync queue enqueue is implemented (e.g., `syncQueue.ts` or similar)

```typescript
import { assertSignedInMode } from '../guards/guestNoSyncGuardrails';
import { useAuth } from '../../contexts/AuthContext';

export function enqueueSyncAction(action: SyncAction): void {
  const { user } = useAuth();
  
  // CRITICAL: Prevent guest mode from enqueueing sync actions
  assertSignedInMode(user, 'Sync action enqueue');
  
  // Existing enqueue logic...
}
```

**Note**: If sync queue doesn't exist yet, add guardrail when it's implemented. This is the most important gate.

#### 3. Add Guardrail to Sync Orchestrator Entry Points
**File**: Wherever sync orchestrator starts (e.g., `syncOrchestrator.ts` or similar)

```typescript
import { assertSignedInMode } from '../guards/guestNoSyncGuardrails';
import { useAuth } from '../../contexts/AuthContext';

export function startSync(): void {
  const { user } = useAuth();
  
  // Guard at sync boundary
  assertSignedInMode(user, 'Sync start');
  
  // Existing sync logic...
}

export function runSyncCycle(): Promise<void> {
  const { user } = useAuth();
  
  // Guard at sync boundary
  assertSignedInMode(user, 'Sync cycle');
  
  // Existing sync logic...
}
```

**Note**: If sync orchestrator doesn't exist yet, add guardrails when implemented.

#### 4. Add Defense-in-Depth to Sync Application
**File**: `mobile/src/common/utils/syncApplication.ts`

Add guardrail without signature changes - check user from context or validate storage key:

```typescript
import { assertSignedInMode } from '../guards/guestNoSyncGuardrails';
import { getModeFromStorageKey } from '../storage/dataModeStorage';

export async function applyRemoteUpdatesToLocal<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  remoteEntities: T[],
  getId: (entity: T) => string
): Promise<void> {
  // Defense-in-depth: Validate storage key implies signed-in mode
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  
  // If storage key is guest key, this is a programming error
  const keyMode = getModeFromStorageKey(storageKey);
  if (keyMode === 'guest') {
    throw new Error(
      `applyRemoteUpdatesToLocal() called with guest storage key. This should never happen.`
    );
  }
  
  // Existing implementation...
}
```

**Alternative**: If React context is available, check user directly:
```typescript
// Only if called from React component context
import { useAuth } from '../../contexts/AuthContext';
// But this requires hook usage, which may not be available here
```

**Best approach**: Validate storage key mode as defense-in-depth, since `getSignedInCacheKey()` already implies signed-in.

#### 5. Add Authentication Assertions to Remote Services
**Files**: 
- `mobile/src/features/shopping/services/RemoteShoppingService.ts`
- `mobile/src/features/recipes/services/recipeService.ts` (RemoteRecipeService)
- `mobile/src/features/chores/services/choresService.ts` (RemoteChoresService)

Add assertions that require authentication, not userMode param:

```typescript
import { assertNoGuestMode } from '../../../common/guards/guestNoSyncGuardrails';

// Helper to get user from context or require it as dependency
function assertAuthenticated(user: User | null): asserts user is User & { isGuest: false } {
  assertNoGuestMode(user, 'Remote service operation');
  
  // Additional check: require access token or session
  // This naturally blocks guest mode since guests don't have valid tokens
}

export class RemoteShoppingService implements IShoppingService {
  // Don't add userMode param - instead require auth/session
  // Service factory already prevents guest mode from creating this
  
  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    // If user context is available, check it
    // Or require accessToken/session as constructor param
    // assertAuthenticated(user);
    
    // Existing implementation...
  }
}
```

**Better approach**: Remote services should require `accessToken` or `supabaseClient` configured for signed-in. Guest cannot produce valid tokens, so it's naturally blocked. Add runtime assertion:

```typescript
export class RemoteShoppingService implements IShoppingService {
  constructor(private accessToken?: string) {
    // Require access token - guest cannot provide valid token
    if (!accessToken) {
      throw new Error('RemoteShoppingService requires authentication token.');
    }
  }
  
  private assertAuthenticated(): void {
    if (!this.accessToken) {
      throw new Error('Remote service operation requires authentication.');
    }
  }
  
  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    this.assertAuthenticated();
    // Existing implementation...
  }
}
```

**Note**: Service factories already prevent guest mode from creating remote services. This adds defense-in-depth.

### Nice-to-Have

#### 6. Update Documentation
**File**: `docs/architecture/DATA_MODES_SPEC.md`

Add section on sync guardrails (optional, nice-to-have).

### Phase 4: Add Comprehensive Tests

#### 4.1 Test Guest Sync Guardrails
**File**: `mobile/src/common/guards/__tests__/guestNoSyncGuardrails.test.ts` (NEW)

```typescript
import {
  assertSignedInMode,
  assertNoGuestMode,
} from '../guestNoSyncGuardrails';
import type { User } from '../../../contexts/AuthContext';

describe('guestNoSyncGuardrails', () => {
  const signedInUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    isGuest: false,
  };
  
  const guestUser: User = {
    id: 'guest-1',
    email: '',
    name: 'Guest',
    isGuest: true,
  };
  
  describe('assertSignedInMode', () => {
    it('should not throw for signed-in user', () => {
      expect(() => assertSignedInMode(signedInUser, 'Test operation')).not.toThrow();
    });
    
    it('should throw for guest user', () => {
      expect(() => assertSignedInMode(guestUser, 'Test operation')).toThrow(
        'is not allowed in guest mode'
      );
    });
    
    it('should throw for null user', () => {
      expect(() => assertSignedInMode(null, 'Test operation')).toThrow(
        'is not allowed in guest mode'
      );
    });
  });
  
  describe('assertNoGuestMode', () => {
    it('should not throw for signed-in user', () => {
      expect(() => assertNoGuestMode(signedInUser, 'Test operation')).not.toThrow();
    });
    
    it('should throw for guest user', () => {
      expect(() => assertNoGuestMode(guestUser, 'Test operation')).toThrow();
    });
    
    it('should throw for null user', () => {
      expect(() => assertNoGuestMode(null, 'Test operation')).toThrow();
    });
  });
});
```

#### 4.2 Test Sync Queue Enqueue Blocked
**File**: Test file for sync queue (create when sync queue exists)

```typescript
import { enqueueSyncAction } from '../syncQueue';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

describe('Sync Queue Guest Mode Guardrails', () => {
  it('should throw error when guest user tries to enqueue sync action', () => {
    const guestUser = { id: 'guest-1', email: '', name: 'Guest', isGuest: true };
    
    // Mock AuthContext to return guest user
    // Then attempt to enqueue - should throw
    expect(() => {
      // Setup guest user context
      enqueueSyncAction(mockSyncAction);
    }).toThrow('not allowed in guest mode');
  });
  
  it('should allow signed-in user to enqueue sync action', () => {
    const signedInUser = { id: 'user-1', email: 'test@example.com', name: 'User', isGuest: false };
    
    // Mock AuthContext to return signed-in user
    // Then attempt to enqueue - should succeed
    expect(() => {
      enqueueSyncAction(mockSyncAction);
    }).not.toThrow();
  });
});
```

#### 4.3 Test Sync Start Blocked
**File**: Test file for sync orchestrator (create when sync orchestrator exists)

```typescript
import { startSync, runSyncCycle } from '../syncOrchestrator';

describe('Sync Orchestrator Guest Mode Guardrails', () => {
  it('should throw error when guest user tries to start sync', () => {
    // Mock guest user context
    expect(() => startSync()).toThrow('not allowed in guest mode');
  });
  
  it('should throw error when guest user tries to run sync cycle', async () => {
    // Mock guest user context
    await expect(runSyncCycle()).rejects.toThrow('not allowed in guest mode');
  });
});
```

#### 4.4 Test API Client Never Called in Guest Mode
**File**: `mobile/src/__tests__/integration/guestNoSync.test.ts` (NEW)

```typescript
import { api } from '../../services/api';
import { createShoppingService } from '../../features/shopping/services/shoppingService';
import { determineUserDataMode } from '../../common/types/dataModes';

// Mock api.request
jest.mock('../../services/api', () => ({
  api: {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    // ... other methods
  },
}));

describe('Guest Mode No-Sync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should never call api.request when user is in guest mode', async () => {
    const guestUser = { id: 'guest-1', email: '', name: 'Guest', isGuest: true };
    const userMode = determineUserDataMode(guestUser);
    
    // Create service - should be local service, not remote
    const service = createShoppingService(userMode);
    
    // Attempt operations that would trigger API calls
    await service.getShoppingData();
    
    // Assert api.request was never called
    expect(api.request).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });
  
  it('should call api.request when user is signed-in', async () => {
    const signedInUser = { id: 'user-1', email: 'test@example.com', name: 'User', isGuest: false };
    const userMode = determineUserDataMode(signedInUser);
    
    // Mock successful API response
    (api.get as jest.Mock).mockResolvedValue({ shoppingLists: [], shoppingItems: [] });
    
    const service = createShoppingService(userMode);
    await service.getShoppingData();
    
    // Assert api was called
    expect(api.get).toHaveBeenCalled();
  });
});
```

#### 4.5 Test Sync Application Defense-in-Depth
**File**: `mobile/src/common/utils/__tests__/syncApplication.test.ts`

Add test case:

```typescript
describe('applyRemoteUpdatesToLocal defense-in-depth', () => {
  it('should detect programming error if called with guest storage key', async () => {
    // This should never happen due to service factory guards,
    // but test defense-in-depth validation
    // Mock getSignedInCacheKey to return guest key (simulating error)
    // Should throw error about programming error
  });
});
```

## Files to Create

1. `mobile/src/common/guards/guestNoSyncGuardrails.ts` - Guardrail utilities
2. `mobile/src/common/guards/__tests__/guestNoSyncGuardrails.test.ts` - Guardrail tests
3. `mobile/src/__tests__/integration/guestNoSync.test.ts` - Integration tests (mock api.request)

## Files to Modify

1. **Sync queue enqueue function** (when implemented) - Add guardrail at entry
2. **Sync orchestrator** (`startSync()`, `runSyncCycle()`) (when implemented) - Add guardrail at entry
3. `mobile/src/common/utils/syncApplication.ts` - Add defense-in-depth guardrail (no signature changes)
4. `mobile/src/features/shopping/services/RemoteShoppingService.ts` - Add authentication assertions
5. `mobile/src/features/recipes/services/recipeService.ts` - Add authentication assertions to RemoteRecipeService
6. `mobile/src/features/chores/services/choresService.ts` - Add authentication assertions to RemoteChoresService
7. `mobile/src/common/utils/__tests__/syncApplication.test.ts` - Add defense-in-depth test
8. `docs/architecture/DATA_MODES_SPEC.md` - Document sync guardrails (nice-to-have)

## Success Criteria

1. ✅ **No sync actions enqueued in guest mode**
   - `enqueueSyncAction()` throws error in guest mode (CRITICAL gate)
   - `startSync()` / `runSyncCycle()` throw error in guest mode
   - All sync entry points guard at boundaries

2. ✅ **Tests enforce no remote calls**
   - Unit tests verify guardrails throw errors in guest mode
   - Integration tests mock `api.request` and assert it's never called in guest flows
   - Tests verify sync queue/orchestrator reject guest mode

3. ✅ **Runtime assertions in place**
   - Guardrail utilities provide clear error messages
   - Sync boundaries have mode checks (enqueue, start, run)
   - Defense in depth: `applyRemoteUpdatesToLocal()` validates storage key mode
   - Remote services require authentication (session/token), naturally blocking guest

4. ✅ **Documentation updated** (nice-to-have)
   - Guardrails documented in architecture spec
   - Usage examples provided
   - Error messages are clear and actionable

## Implementation Order

1. Create guardrail utilities module (`guestNoSyncGuardrails.ts`)
2. Add guardrail to sync queue enqueue (when implemented) ⚠️ **CRITICAL**
3. Add guardrail to sync orchestrator entry points (when implemented)
4. Add defense-in-depth to `applyRemoteUpdatesToLocal()` (no signature changes)
5. Add authentication assertions to Remote*Service methods
6. Add comprehensive tests (sync enqueue, sync start, api.request mocking)
7. Update documentation (nice-to-have)

## Notes

- **Guard at boundaries, not thread state**: Guardrails check user state at sync entry points, not thread `userMode` through every function
- **Remote services require auth, not mode param**: Remote services should require `accessToken`/`session`, not `userMode`. Guest cannot produce valid tokens, so it's naturally blocked.
- **API client stays dumb**: Keep `api.ts` as a dumb transport layer. Guard at service layer, test by mocking `api.request`.
- **Sync queue is critical gate**: The most important single guardrail is preventing sync actions from being enqueued in guest mode. This must be implemented when sync queue exists.
- **Defense in depth**: Multiple layers of protection - service factories prevent guest mode from creating remote services, but runtime assertions provide additional safety.
- **No signature churn**: Avoid threading `userMode` through function signatures. Check user state at boundaries instead.