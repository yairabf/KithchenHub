# Chores Feature

## Overview

The Chores feature provides household chore tracking with a visual progress ring, swipeable cards for today's and upcoming chores, and the ability to assign chores to household members. It features a responsive layout that adapts between single-column (mobile) and two-column (tablet) layouts.

## Screenshots

### Main Chores View
![Chores Main](../screenshots/chores/chores-main.png)

### Edit Chore Modal
![Edit Chore Modal](../screenshots/chores/chores-edit-modal.png)

### Quick Add Chore Modal
![Quick Add Modal](../screenshots/chores/chores-quick-add-modal.png)

## Screens

### ChoresScreen

- **File**: `mobile/src/features/chores/screens/ChoresScreen.tsx`
- **Purpose**: Comprehensive chore management with progress tracking
- **Key functionality**:
  - Header with home icon and "HOME CHORES" title
  - Progress ring showing completion percentage for today's chores
  - Responsive layout: single-column (mobile) or two-column (768px+)
  - Two sections: "TODAY'S CHORES" and "UPCOMING CHORES"
  - Swipeable chore cards with edit and delete capabilities
  - Floating action button to add chores
  - **Guest Support**: Loads chores locally for guest users while signed-in users use the API

#### Props Interface

```typescript
interface ChoresScreenProps {
  onOpenChoresModal?: () => void;
  onRegisterAddChoreHandler?: (handler: (newChore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => void) => void;
}
```

#### Code Snippet - Progress Calculation

```typescript
const progress = useMemo(() => {
  const total = todayChores.length;
  const completed = todayChores.filter(c => c.completed).length;
  const progressValue = total > 0 ? (completed / total) * 100 : 0;
  return progressValue;
}, [todayChores]);
```

#### Code Snippet - Service Initialization

```typescript
// Determine data mode based on user authentication state
const { user } = useAuth();
const userMode = useMemo(() => {
  if (config.mockData.enabled) {
    return 'guest' as const;
  }
  return determineUserDataMode(user);
}, [user]);

const choresService = useMemo(
  () => createChoresService(userMode),
  [userMode]
);

useEffect(() => {
  const loadChores = async () => {
    const data = await choresService.getChores();
    setChores(data);
  };
  loadChores();
}, [choresService]);
```

#### Code Snippet - Responsive Layout

```typescript
const { width } = useWindowDimensions();
const isWideScreen = width >= 768;

// Renders different layouts based on isWideScreen
{isWideScreen ? (
  <View style={styles.wideLayout}>
    {/* Two-column layout */}
  </View>
) : (
  <View style={styles.narrowLayout}>
    {/* Single-column layout */}
  </View>
)}
```

## Components

### ProgressRing

- **File**: `mobile/src/features/chores/components/ProgressRing/`
- **Purpose**: Animated circular progress indicator
- **Props**:

```typescript
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showEmoji?: boolean;
}
```

- **Features**:
  - SVG-based progress visualization
  - Dynamic color progression (gray -> yellow -> green)
  - Smooth animations with 1000ms duration
  - Shows percentage and thumbs-up emoji when >= 75%
  - Uses react-native-reanimated for animations

### SwipeableWrapper (from common components)

- **File**: `mobile/src/common/components/SwipeableWrapper/`
- **Purpose**: Reusable gesture-driven wrapper component for swipe-to-delete functionality
- **Usage**: Used in ChoresScreen to wrap chore cards
- **Features**:
  - Pan gesture handler for swipe-to-delete
  - Swipe left or right to delete (30% threshold or high velocity)
  - Animated background reveals trash icon
  - Smooth spring animations
  - Direction locking to prevent multi-directional swipes

### ChoreCard (Internal Component)

- **File**: `mobile/src/features/chores/screens/ChoresScreen.tsx` (defined within ChoresScreen)
- **Purpose**: Individual chore card with sync status indicator
- **Features**:
  - Displays chore icon, name, assignee, and due date
  - Edit and delete actions via swipe gestures
  - **Sync Status Indicator** (signed-in users only):
    - Displays visual indicator in top-right corner of chore icon
    - Shows pending state (clock icon) when chore is queued for sync
    - Shows failed state (warning icon) when sync has permanently failed
    - Hidden when chore is confirmed (synced successfully)
    - Uses `useEntitySyncStatusWithEntity` hook to determine status
    - Integrates with sync queue system for real-time status updates
    - Wrapped with `React.memo()` for performance optimization

### ChoreDetailsModal

- **File**: `mobile/src/features/chores/components/ChoreDetailsModal/`
- **Purpose**: Edit existing chore details
- **Features**:
  - Edit chore name and icon
  - Change assignee selection
  - Update due date and time
  - Date/time picker integration

### ChoresQuickActionModal

- **File**: `mobile/src/features/chores/components/ChoresQuickActionModal/`
- **Purpose**: Quick chore creation form
- **Features**:
  - Chore name input
  - Icon selection
  - Assignee picker
  - Due date and time selection
  - Section selection (today/this week)

## Entity Creation (New)

The feature implementation now uses a Factory Pattern to separate business logic from UI components and ensure TDD compliance.

- **Factory**: `mobile/src/features/chores/utils/choreFactory.ts`
- **Tests**: `mobile/src/features/chores/utils/__tests__/choreFactory.test.ts`
- **Logic**: Generates `localId` using `expo-crypto` UUIDs.

```typescript
// Example usage
import { createChore } from '../utils/choreFactory';
const newChore = createChore(choreData);
```

## Key Types

```typescript
// Chore entity now extends BaseEntity with shared metadata
import type { BaseEntity } from '../../../common/types/entityMetadata';

interface Chore extends BaseEntity {
  // BaseEntity provides: id, localId, createdAt?, updatedAt?, deletedAt?
  name: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  reminder?: string;
  isRecurring?: boolean;
  completed: boolean;
  section: 'today' | 'thisWeek' | 'recurring';
  icon?: string;
}

export type AddChoreHandler = (newChore: {
  name: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  section: 'today' | 'thisWeek';
}) => void;
```

**Entity Metadata (from `BaseEntity`):**
- `id: string` - Legacy/Display ID for UI
- `localId: string` - Stable UUID for sync/merge operations
- `createdAt?: Date | string` - Creation timestamp
- `updatedAt?: Date | string` - Last modification timestamp
- `deletedAt?: Date | string` - Soft-delete timestamp (tombstone pattern)

See [`mobile/src/common/types/entityMetadata.ts`](../../mobile/src/common/types/entityMetadata.ts) for shared entity metadata interfaces and helpers.

## State Management

- **Local state**:
  - `chores` - Array of Chore objects (loaded from service or cache)
  - `selectedChore` - Currently selected chore for editing
  - `showDetailsModal` - Modal visibility for editing chore details
  - `showShareModal` - Modal visibility for sharing chores list
  - `guestChores` - Local state for guest mode (when not using cache)
- **Service**: `createChoresService(mode: 'guest' | 'signed-in')` factory creates service instance based on data mode
  - Mode determined by `determineUserDataMode()`: 'guest' for guest users or when `config.mockData.enabled` is true, 'signed-in' for authenticated users
  - **Service handles mode internally**: Screen handlers always call service methods; service implementation (LocalChoresService vs RemoteChoresService) handles guest vs signed-in logic
- **Cache-Aware Repository Layer** (signed-in users only):
  - **Repository**: `CacheAwareChoreRepository` (`mobile/src/common/repositories/cacheAwareChoreRepository.ts`)
    - Wraps `RemoteChoresService` with cache-first read strategies and write-through caching
    - Implements `ICacheAwareRepository<Chore>` interface
    - **Cache-First Reads**:
      - `findAll()`: Uses `getCached()` for cache-first reads with background refresh
      - Returns cached data immediately if fresh or stale
      - Triggers background refresh for stale data (non-blocking)
      - Blocks for network fetch if cache is expired (when online)
      - Returns cached data if offline (even if expired)
    - **Write-Through Caching**:
      - `create()`, `update()`, `delete()`, `toggle()`: Update cache immediately after successful API operations
      - Cache errors are logged but don't fail operations (server write succeeded)
      - Cache is invalidated on error to force refresh on next read
    - **Offline Write Queue**: All write operations enqueue writes when offline for later sync
    - **Cache Events**: Emits cache change events after writes to trigger UI updates
  - **Reactive Cache Hook**: `useCachedEntities<Chore>('chores')` (`mobile/src/common/hooks/useCachedEntities.ts`)
    - Subscribes to cache change events for automatic UI updates
    - Returns: `data`, `isLoading`, `error`, `refresh`
    - Automatically re-reads cache when change events are emitted
    - Used by `ChoresScreen` for signed-in users
  - **Guest Mode**: Uses service directly (no cache layer)
    - Loads chores via `choresService.getChores()` on mount
    - Updates local state (`guestChores`) directly
- **Computed values**:
  - `todayChores` - Filtered chores for today section
  - `upcomingChores` - Filtered chores for this week/recurring
  - `shareText` - Formatted text for sharing (memoized)
  - `isWideScreen` - Responsive breakpoint detection (>= 768px)
- **Parent communication**:
  - `onOpenChoresModal` - Callback to open quick add modal
  - `onRegisterAddChoreHandler` - Registers add function with parent

## Service Layer

The feature uses a **Strategy Pattern** with a **Factory Pattern** to handle data fetching, switching transparently between local mocks and backend API based on environment configuration.

- **Factory**: `createChoresService(mode: 'guest' | 'signed-in')` (`mobile/src/features/chores/services/choresService.ts`)
  - Returns `LocalChoresService` when mode is 'guest'
  - Returns `RemoteChoresService` when mode is 'signed-in'
  - Validates service compatibility with data mode
- **Entity Factory**: `createChore()` (`mobile/src/features/chores/utils/choreFactory.ts`)
  - Creates new chore objects with required fields
  - **Automatically populates `createdAt` and `updatedAt`** using `withCreatedAtAndUpdatedAt()` helper
- **Interface**: `IChoresService`
  - `getChores(): Promise<Chore[]>` - Returns all chores
  - **CRUD Methods**:
    - `createChore(chore: Partial<Chore>): Promise<Chore>` - Create new chore
    - `updateChore(choreId: string, updates: Partial<Chore>): Promise<Chore>` - Update existing chore
    - `deleteChore(choreId: string): Promise<void>` - Soft-delete chore
    - `toggleChore(choreId: string): Promise<Chore>` - Toggle chore completion status
  - **Service Classes** (extracted into separate files):
    - `LocalChoresService`: 
      - Reads chores from `guestStorage.getChores()` (AsyncStorage) instead of mocks
      - **Filters deleted items**: `getChores()` uses `isEntityActive()` to filter out soft-deleted items (tombstone pattern)
      - Returns empty arrays when no guest data exists (not mock data)
      - Persists chores to AsyncStorage via `guestStorage.saveChores()` on create/update/delete
      - Uses `entityOperations` utility (`findEntityIndex`, `updateEntityInStorage`) to reduce code duplication
      - **Timestamp Management**:
        - `createChore()`: Set both `createdAt` and `updatedAt` (via factory function using `withCreatedAtAndUpdatedAt()`)
        - `updateChore()` and `toggleChore()`: Update `updatedAt` using `withUpdatedAt()` helper
        - `deleteChore()`: Set `deletedAt` and `updatedAt` using `markDeleted()` and `withUpdatedAt()` helpers
      - **ID Matching**: Service methods accept both `id` and `localId` via `findEntityIndex()` which checks both identifiers
    - `RemoteChoresService`: 
      - Calls backend via `api.ts` (`/chores` endpoint), maps DTOs to Chore objects
      - Uses `toSupabaseTimestamps()` for API payloads (converts camelCase to snake_case)
      - Uses `normalizeTimestampsFromApi()` to normalize API responses (handles both camelCase and snake_case)
      - All CRUD operations fetch existing entities before updating to prevent data loss
      - Server timestamps are authoritative and overwrite client timestamps on response
      - **Timestamp Management**:
        - `createChore()`: Set both `createdAt` and `updatedAt` using `withCreatedAtAndUpdatedAt()` helper
        - `updateChore()` and `toggleChore()`: Update `updatedAt` using `withUpdatedAt()` helper
        - `deleteChore()`: Sets `deletedAt` and `updatedAt` using `markDeleted()` and `withUpdatedAt()` helpers
        - **Note**: After create/update operations, fetches full entity from API to get server-assigned timestamps (API returns only `{ id }` on create)
      - **Cache Updates**: All CRUD operations update local cache after successful API calls
        - Uses `addEntityToCache()` for create operations
        - Uses `updateEntityInCache()` for update/delete/toggle operations
        - Cache updates are best-effort (failures are logged but don't throw)
      - **Guest Mode Protection**: Service factory prevents guest mode from creating this service. All methods require authentication (JWT tokens), providing defense-in-depth against guest data syncing.
- **Timestamp Utilities**: `mobile/src/common/utils/timestamps.ts`
  - `withCreatedAtAndUpdatedAt()`: Auto-populates `createdAt` (if missing) and always sets `updatedAt` on entity creation
    - Recommended helper for all create operations
    - Used in `choreFactory.ts` for factory-created chores
    - Used in `LocalChoresService.createChore()` and `RemoteChoresService.createChore()` to ensure service-created chores have timestamps
    - Preserves existing `createdAt` if provided, always sets `updatedAt` to current time
  - `withCreatedAt()`: Auto-populates `createdAt` on entity creation (legacy, use `withCreatedAtAndUpdatedAt()` for new code)
  - `withUpdatedAt()`: Auto-updates `updatedAt` on entity modification
  - `markDeleted()`: Sets `deletedAt` for soft-delete operations
  - `normalizeTimestampsFromApi()`: Centralized utility for normalizing API response timestamps (handles camelCase and snake_case formats)
  - `toSupabaseTimestamps()`: Converts camelCase timestamps to snake_case for API payloads
  - See [`mobile/src/common/types/entityMetadata.ts`](../../mobile/src/common/types/entityMetadata.ts) for serialization helpers
- **Entity Operations Utility**: `mobile/src/common/utils/entityOperations.ts`
  - `findEntityIndex()`: Finds entity by ID or localId with error handling
  - `updateEntityInStorage()`: Centralized helper for updating entities in storage arrays
  - Reduces code duplication across local services
- **Guest Storage**: `mobile/src/common/utils/guestStorage.ts`
  - Storage keys are centrally managed via `getGuestStorageKey(ENTITY_TYPES.*)` from `dataModeStorage.ts`
  - Uses envelope format internally: `{ version: 1, updatedAt: string, data: T[] }` for versioning support
  - `getChores()`: Retrieves chores from AsyncStorage (key: `@kitchen_hub_guest_chores`)
    - Normalizes timestamps from ISO strings to Date objects (shallow normalization)
    - Automatically upgrades legacy array format to envelope format on read
  - `saveChores(chores)`: Persists chores to AsyncStorage as envelope format
    - Serializes timestamps from Date objects to ISO strings (shallow serialization)
    - Creates envelope with version 1 and current timestamp
  - Returns empty arrays when no data exists or on parse errors (graceful degradation)
  - Validates data format and filters invalid entities
  - **Internal Helpers**: Uses `readEntityEnvelope()` and `writeEntityEnvelope()` from `guestStorageHelpers.ts` for type-safe operations
- **Configuration**: `config.mockData.enabled` (`mobile/src/config/index.ts`)
  - Controlled by `EXPO_PUBLIC_USE_MOCK_DATA` environment variable
  - When enabled, forces 'guest' mode regardless of user authentication state
  - Guest users always use 'guest' mode (local service)
- **API Client**: `mobile/src/services/api.ts` - Generic HTTP client wrapper

## Guest User Data Separation

The chores feature implements guest user data separation to ensure guest users use local data while signed-in users use cloud sync, preventing API call failures in production.

### Service Selection Pattern

Service selection is determined by data mode based on user authentication state:

```typescript
const { user } = useAuth();
const userMode = useMemo(() => {
  if (config.mockData.enabled) {
    return 'guest' as const;
  }
  return determineUserDataMode(user);
}, [user]);

const choresService = useMemo(
  () => createChoresService(userMode),
  [userMode]
);
```

**Behavior**:
- **Development** (`config.mockData.enabled = true`): Always uses `LocalChoresService` (guest mode) regardless of auth state
- **Production + Guest User** (`config.mockData.enabled = false` + `user.isGuest = true`): Uses `LocalChoresService` which reads from AsyncStorage (no API calls)
- **Production + Signed-in User** (`config.mockData.enabled = false` + authenticated): Uses `RemoteChoresService` (cloud sync)

### Handler Implementation Pattern

All screen handlers follow a consistent pattern that eliminates userMode branching:

- **Always call service methods**: Handlers never branch on `userMode` - they always call `choresService` methods
- **Service handles mode internally**: `LocalChoresService` writes to AsyncStorage, `RemoteChoresService` calls API
- **ID matching**: Handlers support both `id` and `localId` for consistent entity identification

This pattern is consistent across all features (shopping, chores, recipes) to ensure guest users never attempt remote API calls for private data.

## Conflict Resolution & Sync

The chores feature supports timestamp-based conflict resolution for offline-first sync scenarios.

### Conflict Resolution Utilities

**File**: `mobile/src/common/utils/conflictResolution.ts`

Shared utilities for resolving conflicts between local and remote state:

- **`compareTimestamps()`**: Compares two timestamps (Date or ISO string), normalizes to Date objects
- **`determineConflictWinner()`**: Determines winner based on `updatedAt` (LWW strategy)
  - Returns `'local'` if local is newer, `'remote'` if remote is newer or equal (tie-breaker)
- **`mergeEntitiesLWW()`**: Merges two entities using Last-Write-Wins
  - Winner record wins wholesale (entire entity, not partial field mixing)
  - Preserves local-only fields (e.g., `localId`) from local side
- **`mergeEntitiesWithTombstones()`**: Merges entities with tombstone awareness
  - **Resurrection Policy**: Delete always wins unless recreate (new entity with new ID)
  - Once deleted, always deleted (regardless of timestamp ordering)
  - Returns `null` if both sides agree on deletion
- **`mergeEntityArrays()`**: Merges arrays of entities using LWW + tombstone rules
  - Handles additions (new entities are always added)
  - Handles updates (merged using LWW)
  - Handles deletions (filtered out from result)
  - Time complexity: O(n + m)

### Sync Application

**File**: `mobile/src/common/utils/syncApplication.ts`

Utility for applying remote updates to local cached state:

- **`applyRemoteUpdatesToLocal()`**: Merges remote entities with local cache
  - Reads from signed-in cache (AsyncStorage)
  - Merges using `mergeEntityArrays()` with conflict resolution
  - Persists merged result back to cache
  - Should be called in sync pipeline/repository layer, NOT inside Remote*Service methods
  - **Defense-in-Depth Guardrail**: Validates storage key mode to ensure only signed-in cache keys are used. Throws error if called with guest or unknown storage keys, preventing programming errors.

**Note**: Conflict resolution is client-side. The backend sync endpoint (`POST /auth/sync`) performs simple upsert operations and returns conflicts. Client-side utilities handle timestamp-based merging.

## Key Dependencies

- `react-native-gesture-handler` - GestureDetector for swipe interactions
- `react-native-reanimated` - Smooth animations for progress ring and swipes
- `config` - Application configuration (`mobile/src/config/index.ts`) for mock data toggle
- `createChoresService` - Service factory for selecting guest/signed-in data source based on mode
- `determineUserDataMode` - Utility to determine data mode from user state (`mobile/src/common/types/dataModes.ts`)
- `isEntityActive` - Utility to filter active entities (`mobile/src/common/types/entityMetadata.ts`) - used by `LocalChoresService.getChores()` to filter deleted items
- `useAuth` - Auth context hook for determining user state
- `SwipeableWrapper` - Shared component from `common/components` for swipe-to-delete
- `ScreenHeader` - Shared header component with actions
- `ShareModal` - Shared modal component for sharing functionality
- `formatChoresText` - Utility function for formatting chores for sharing
- `mockChores` - Initial chore data (used by LocalChoresService)
- `api` - HTTP client (`mobile/src/services/api.ts`) for remote service calls
- `pastelColors` - Theme colors for card backgrounds
- `useWindowDimensions` - For responsive layout detection
- `conflictResolution` - Conflict resolution utilities (`mobile/src/common/utils/conflictResolution.ts`)
- `syncApplication` - Sync application utilities (`mobile/src/common/utils/syncApplication.ts`)
- `guestNoSyncGuardrails` - Guest mode sync guardrails (`mobile/src/common/guards/guestNoSyncGuardrails.ts`) - Runtime assertions preventing guest data from syncing remotely
- `CacheAwareChoreRepository` - Cache-aware repository (`mobile/src/common/repositories/cacheAwareChoreRepository.ts`) - Wraps `RemoteChoresService` with cache-first reads and write-through caching. Implements `ICacheAwareRepository<Chore>` interface.
- `useCachedEntities` - Reactive cache hook (`mobile/src/common/hooks/useCachedEntities.ts`) - React hook that subscribes to cache changes and automatically updates UI when cache changes. Used by `ChoresScreen` for signed-in users.
- `cacheAwareRepository` - Cache utilities (`mobile/src/common/repositories/cacheAwareRepository.ts`) - Provides `getCached()`, `setCached()`, `addEntityToCache()`, `updateEntityInCache()`, and `readCachedEntitiesForUpdate()` for cache-first reads and write-through caching
- `cacheEvents` - Cache event bus (`mobile/src/common/utils/cacheEvents.ts`) - Event emitter for cache change notifications. Used to trigger UI updates when cache changes.
- `cacheStorage` - Cache storage utilities (`mobile/src/common/utils/cacheStorage.ts`) - Thin wrapper layer for safe cache access with TTL support. Provides `readCacheArray()`, `writeCacheArray()`, `getCacheState()`, and `shouldRefreshCache()` helpers. Used internally by `cacheAwareRepository`.
- `networkStatus` - Network status singleton (`mobile/src/common/utils/networkStatus.ts`) - Provides `getIsOnline()` for checking network connectivity outside React components
- `syncQueueStorage` - Offline write queue storage (`mobile/src/common/utils/syncQueueStorage.ts`) - Manages queued write operations for offline sync with status tracking (`PENDING`, `RETRYING`, `FAILED_PERMANENT`)
- `syncQueueProcessor` - Queue processor (`mobile/src/common/utils/syncQueueProcessor.ts`) - Background worker loop that continuously drains the sync queue with exponential backoff retry logic. Processes ready items only, respects backoff delays, and handles error classification (network/auth/validation/server errors)
- `useSyncQueue` - Sync queue hook (`mobile/src/common/hooks/useSyncQueue.ts`) - React hook that manages worker loop lifecycle, starting/stopping based on network status and app foreground/background state
- `useEntitySyncStatusWithEntity` - Entity sync status hook (`mobile/src/common/hooks/useSyncStatus.ts`) - React hook that provides sync status (pending/confirmed/failed) for individual entities. Used by ChoreCard to display sync status indicators
- `SyncStatusIndicator` - Sync status indicator component (`mobile/src/common/components/SyncStatusIndicator/`) - Visual indicator component showing pending, confirmed, or failed sync status. Displays clock icon for pending, warning icon for failed, checkmark for confirmed
- `determineIndicatorStatus` - Status determination utility (`mobile/src/common/utils/syncStatusUtils.ts`) - Utility function that determines indicator status from sync status flags (failed > pending > confirmed priority)

## UI Flow

1. User views chores split into "Today" and "Upcoming" sections
2. Progress ring shows percentage of today's chores completed
3. Tap chore card to toggle completion status
4. Tap edit icon on chore to open details modal
5. Swipe chore left/right to delete it
6. Click FAB to open quick add modal for new chores
7. Assign chores to household members (Mom, Dad, Kids, All)

## Responsive Behavior

- **Mobile (< 768px)**: Single column layout
  - Progress ring at top
  - Today's chores below
  - Upcoming chores at bottom

- **Tablet (>= 768px)**: Two column layout
  - Left column: Progress ring + Today's chores
  - Right column: Upcoming chores
