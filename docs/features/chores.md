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
const { user } = useAuth();
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest;
const choresService = useMemo(
  () => createChoresService(shouldUseMockData),
  [shouldUseMockData]
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
  - `chores` - Array of Chore objects (loaded from service)
  - `selectedChore` - Currently selected chore for editing
  - `showDetailsModal` - Modal visibility for editing chore details
  - `showShareModal` - Modal visibility for sharing chores list
- **Service**: `createChoresService(isMockEnabled)` factory creates service instance
  - Loads chores via `choresService.getChores()` on mount
  - Switches between mock and API based on `config.mockData.enabled` or guest status
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
  - **Legacy**: `createChoresServiceLegacy(isMockEnabled: boolean)` for backward compatibility
- **Entity Factory**: `createChore()` (`mobile/src/features/chores/utils/choreFactory.ts`)
  - Creates new chore objects with required fields
  - **Automatically populates `createdAt`** using `withCreatedAt()` helper
- **Interface**: `IChoresService`
  - `getChores(): Promise<Chore[]>` - Returns all chores
  - **CRUD Methods**:
    - `createChore(chore: Partial<Chore>): Promise<Chore>` - Create new chore
    - `updateChore(choreId: string, updates: Partial<Chore>): Promise<Chore>` - Update existing chore
    - `deleteChore(choreId: string): Promise<void>` - Soft-delete chore
    - `toggleChore(choreId: string): Promise<Chore>` - Toggle chore completion status
- **Strategies**:
  - `LocalChoresService`: 
    - Reads chores from `guestStorage.getChores()` (AsyncStorage) when data exists
    - Falls back to mock data from `mockChores` when no guest data exists
    - Persists chores to AsyncStorage via `guestStorage.saveChores()` on create/update/delete
    - Uses `entityOperations` utility (`findEntityIndex`, `updateEntityInStorage`) to reduce code duplication
    - All CRUD operations apply timestamps using `withCreatedAt()`, `withUpdatedAt()`, and `markDeleted()` helpers
  - `RemoteChoresService`: 
    - Calls backend via `api.ts` (`/chores` endpoint), maps DTOs to Chore objects
    - Uses `toSupabaseTimestamps()` for API payloads (converts camelCase to snake_case)
    - Uses `normalizeTimestampsFromApi()` to normalize API responses (handles both camelCase and snake_case)
    - Fetches updated entities after mutations to get authoritative server timestamps
    - Server timestamps are authoritative and overwrite client timestamps on response
- **Timestamp Utilities**: `mobile/src/common/utils/timestamps.ts`
  - `withCreatedAt()`: Auto-populates `createdAt` on entity creation (used in `choreFactory.ts`)
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
  - `getChores()`: Retrieves chores from AsyncStorage key `@kitchen_hub_guest_chores`
    - Normalizes timestamps from ISO strings to Date objects (shallow normalization)
  - `saveChores(chores)`: Persists chores to AsyncStorage
    - Serializes timestamps from Date objects to ISO strings (shallow serialization)
  - Returns empty arrays when no data exists or on parse errors
  - Validates data format (ensures array and required fields)
- **Configuration**: `config.mockData.enabled` (`mobile/src/config/index.ts`)
  - Controlled by `EXPO_PUBLIC_USE_MOCK_DATA` environment variable
  - Guest users always use local data regardless of the flag
- **API Client**: `mobile/src/services/api.ts` - Generic HTTP client wrapper

## Guest User Data Separation

The chores feature implements guest user data separation to ensure guest users use local data while signed-in users use cloud sync, preventing API call failures in production.

### Service Selection Pattern

Service selection is determined by both the mock data toggle and user authentication state:

```typescript
const { user } = useAuth();
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest;
const choresService = useMemo(
  () => createChoresService(shouldUseMockData),
  [shouldUseMockData]
);
```

**Behavior**:
- **Development** (`config.mockData.enabled = true`): Always uses `LocalChoresService` regardless of auth state
- **Production + Guest User** (`config.mockData.enabled = false` + `user.isGuest = true`): Uses `LocalChoresService` (no API calls)
- **Production + Signed-in User** (`config.mockData.enabled = false` + authenticated): Uses `RemoteChoresService` (cloud sync)

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

**Note**: Conflict resolution is client-side. The backend sync endpoint (`POST /auth/sync`) performs simple upsert operations and returns conflicts. Client-side utilities handle timestamp-based merging.

## Key Dependencies

- `react-native-gesture-handler` - GestureDetector for swipe interactions
- `react-native-reanimated` - Smooth animations for progress ring and swipes
- `config` - Application configuration (`mobile/src/config/index.ts`) for mock data toggle
- `createChoresService` - Service factory for selecting mock/real data source
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
