---
name: Offline UX Pill Optimistic States
overview: Implement offline pill component and pending/confirmed UI states to visually expose offline state and pending sync operations to users. This builds on the existing sync queue infrastructure to provide clear visual feedback about sync status.
todos:
  - id: sync-status-utilities
    content: Create sync status utilities (syncStatusUtils.ts) with functions to check entity sync state
    status: pending
  - id: sync-status-hooks
    content: Create useSyncStatus hook (useSyncStatus.ts) to provide sync queue statistics and entity sync status
    status: pending
  - id: offline-pill-component
    content: "Build OfflinePill component with states: offline, pending count, syncing, hidden"
    status: pending
  - id: sync-status-indicator
    content: Build SyncStatusIndicator component for pending/confirmed/failed visual indicators
    status: pending
  - id: integrate-recipe-components
    content: Add SyncStatusIndicator to RecipeCard components
    status: pending
  - id: integrate-shopping-components
    content: Add SyncStatusIndicator to ShoppingListPanel and GroceryCard components
    status: pending
  - id: integrate-chore-components
    content: Add SyncStatusIndicator to ChoresScreen chore cards
    status: pending
  - id: main-navigation-integration
    content: Add OfflinePill to MainTabsScreen alongside OfflineBanner
    status: pending
  - id: cache-event-integration
    content: Verify and enhance cache event integration for immediate UI updates
    status: pending
isProject: false
---

# 006 - Offline UX: Offline Pill + Optimistic States

**Epic:** Signed-In Cache and Offline Sync  
**Task:** 006 - Offline UX Pill + Optimistic States  
**Status:** Planning

## Current Status Analysis

### ✅ Already Implemented

1. **Network State Detection** (`NetworkContext.tsx`):
   - `isOffline` boolean tracks network connectivity
   - `useNetwork()` hook provides network state to components
   - Network status exposed via context

2. **Offline Banner** (`OfflineBanner.tsx`):
   - Full-width banner at top of screen when offline
   - Shows "You're offline. Some features may be unavailable."
   - Currently used in `MainTabsScreen.tsx`

3. **Sync Queue Infrastructure**:
   - `syncQueueStorage.ts` - Queue storage with status tracking (`PENDING`, `RETRYING`, `FAILED_PERMANENT`)
   - `syncQueueProcessor.ts` - Worker loop that processes queue
   - `useSyncQueue.ts` - Hook that manages worker lifecycle
   - Queue tracks `localId` and `serverId` for entities

4. **Optimistic Updates**:
   - Repositories update cache immediately (write-through)
   - Entities created offline have `localId` but may not have `serverId` yet
   - Cache events emit immediately for instant UI updates

5. **Entity Metadata**:
   - Entities have `localId` (UUID, always present)
   - Entities have `id` (may be `localId` or `serverId`)
   - Entities have `serverId` (optional, filled after sync)

### ❌ Missing Implementation

1. **Offline Pill Component**:
   - No compact, non-intrusive offline indicator
   - Current `OfflineBanner` is full-width banner at top
   - Need smaller "pill" component that can be placed flexibly

2. **Pending/Confirmed State Tracking**:
   - No way to check if an entity is pending sync
   - No visual indicators on entities showing sync status
   - No hook/utility to determine entity sync state

3. **Sync Status Hooks**:
   - No hook to check if entity is in sync queue
   - No hook to check pending sync count
   - No hook to check if sync worker is processing

4. **UI State Indicators**:
   - No visual feedback on entities (pending/confirmed states)
   - No indication when writes are queued vs synced
   - No feedback when sync completes

## Architecture Overview

### Offline Pill Component

A compact, dismissible component that shows:
- **Offline state**: "Offline" with icon
- **Pending sync count**: "3 pending" when items are queued
- **Syncing state**: "Syncing..." when worker is processing
- **Position**: Floating, non-intrusive (bottom-right or top-right)

### Pending/Confirmed State System

Entities can be in one of three sync states:
1. **Confirmed**: Entity has `serverId` and is not in queue (fully synced)
2. **Pending**: Entity has `localId` but no `serverId`, OR entity is in queue with status `PENDING` or `RETRYING`
3. **Failed**: Entity is in queue with status `FAILED_PERMANENT`

### Visual Indicators

- **Pending entities**: Show subtle indicator (e.g., clock icon, grayed out, "Pending" badge)
- **Confirmed entities**: No indicator (normal state)
- **Failed entities**: Show error indicator (e.g., warning icon, red badge)

## Implementation Plan

### Phase 1: Sync Status Utilities and Hooks

**File**: `mobile/src/common/hooks/useSyncStatus.ts` (NEW)

**Purpose**: Provide hooks to check sync queue state and entity sync status.

**Implementation**:

```typescript
/**
 * Hook to get sync queue statistics
 * Returns: pendingCount, retryingCount, failedCount, isProcessing
 */
export function useSyncQueueStatus(): {
  pendingCount: number;
  retryingCount: number;
  failedCount: number;
  isProcessing: boolean;
  totalPending: number;
}

/**
 * Hook to check if a specific entity is pending sync
 * Checks if entity is in queue or has localId but no serverId
 */
export function useEntitySyncStatus(
  entityType: SyncEntityType,
  entityId: string,
  localId?: string
): {
  isPending: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
  queueStatus?: QueuedWriteStatus;
}
```

**Dependencies**:
- `syncQueueStorage.getAll()` - Get all queue items
- `syncQueueProcessor.isProcessing()` - Check if worker is processing
- Entity metadata (`localId`, `serverId`) from cache

**File**: `mobile/src/common/utils/syncStatusUtils.ts` (NEW)

**Purpose**: Utility functions to check entity sync status synchronously.

**Implementation**:

```typescript
/**
 * Check if entity is in sync queue
 */
export async function isEntityInQueue(
  entityType: SyncEntityType,
  localId: string
): Promise<boolean>

/**
 * Get queue status for entity
 */
export async function getEntityQueueStatus(
  entityType: SyncEntityType,
  localId: string
): Promise<QueuedWriteStatus | null>

/**
 * Check if entity is pending (has localId but no serverId)
 */
export function isEntityPending(entity: { localId?: string; id?: string }): boolean
```

### Phase 2: Offline Pill Component

**File**: `mobile/src/common/components/OfflinePill.tsx` (NEW)

**Purpose**: Compact, dismissible offline indicator with sync status.

**Props**:
```typescript
interface OfflinePillProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  dismissible?: boolean;
  showPendingCount?: boolean;
}
```

**States**:
- **Offline**: Shows "Offline" with WiFi-off icon
- **Online + Pending**: Shows "X pending" with sync icon
- **Syncing**: Shows "Syncing..." with spinner
- **Online + No Pending**: Hidden

**Implementation Details**:
- Uses `useNetwork()` for offline state
- Uses `useSyncQueueStatus()` for pending count and processing state
- Animated appearance/disappearance
- Dismissible option (stores dismissal in AsyncStorage)
- Position configurable (default: bottom-right)

**Styling**:
- Compact pill shape (rounded corners)
- Semi-transparent background
- Icon + text layout
- Subtle shadow for depth
- Non-intrusive positioning

**File**: `mobile/src/common/components/OfflinePill/styles.ts` (NEW)

**File**: `mobile/src/common/components/OfflinePill/types.ts` (NEW)

**File**: `mobile/src/common/components/OfflinePill/index.ts` (NEW)

### Phase 3: Entity Sync Status Indicators

**File**: `mobile/src/common/components/SyncStatusIndicator.tsx` (NEW)

**Purpose**: Small visual indicator for entity sync status.

**Props**:
```typescript
interface SyncStatusIndicatorProps {
  status: 'pending' | 'confirmed' | 'failed';
  size?: 'small' | 'medium';
  showLabel?: boolean;
}
```

**Visual Design**:
- **Pending**: Clock icon (gray) + optional "Pending" label
- **Confirmed**: No indicator (or subtle checkmark)
- **Failed**: Warning icon (red) + optional "Failed" label

**File**: `mobile/src/common/components/SyncStatusIndicator/styles.ts` (NEW)

**File**: `mobile/src/common/components/SyncStatusIndicator/types.ts` (NEW)

**File**: `mobile/src/common/components/SyncStatusIndicator/index.ts` (NEW)

### Phase 4: Integration with Entity Components

**Files to Modify**:

1. **Recipe Components**:
   - `mobile/src/features/recipes/components/RecipeCard/RecipeCard.tsx`
   - Add `SyncStatusIndicator` to show pending/confirmed state

2. **Shopping Components**:
   - `mobile/src/features/shopping/components/ShoppingListPanel/ShoppingListPanel.tsx`
   - `mobile/src/common/components/GroceryCard/GroceryCardContent.tsx`
   - Add `SyncStatusIndicator` to lists and items

3. **Chore Components**:
   - `mobile/src/features/chores/screens/ChoresScreen.tsx`
   - Add `SyncStatusIndicator` to chore cards

**Integration Pattern**:
```typescript
// In component
const { isPending, isConfirmed, isFailed } = useEntitySyncStatus(
  'recipes',
  recipe.id,
  recipe.localId
);

// In render
{isPending && <SyncStatusIndicator status="pending" size="small" />}
{isFailed && <SyncStatusIndicator status="failed" size="small" />}
```

### Phase 5: Main Navigation Integration

**File**: `mobile/src/navigation/MainTabsScreen.tsx` (MODIFY)

**Changes**:
- Add `OfflinePill` component alongside `OfflineBanner`
- Position pill in bottom-right (non-overlapping with navigation)
- Keep `OfflineBanner` for full-width offline notification
- Pill shows when online but has pending syncs

**Layout**:
```
┌─────────────────────────┐
│ OfflineBanner (if offline) │
├─────────────────────────┤
│                         │
│   Screen Content        │
│                         │
│              [Pill]     │ ← OfflinePill (bottom-right)
├─────────────────────────┤
│   Bottom Navigation     │
└─────────────────────────┘
```

### Phase 6: Cache Event Integration

**File**: `mobile/src/common/utils/cacheEvents.ts` (CHECK/MODIFY)

**Purpose**: Ensure cache events trigger UI updates when sync completes.

**Verification**:
- Cache events emit after successful sync
- Components using `useEntitySyncStatus` re-check status on cache events
- Pending indicators clear when entities get `serverId`

**Potential Enhancement**:
- Add specific event for sync completion: `emitSyncComplete(entityType, entityId)`
- Components can listen for this event to update indicators immediately

## File Structure

```
mobile/src/
├── common/
│   ├── components/
│   │   ├── OfflinePill/
│   │   │   ├── OfflinePill.tsx          # NEW
│   │   │   ├── styles.ts                # NEW
│   │   │   ├── types.ts                 # NEW
│   │   │   └── index.ts                 # NEW
│   │   └── SyncStatusIndicator/
│   │       ├── SyncStatusIndicator.tsx  # NEW
│   │       ├── styles.ts                # NEW
│   │       ├── types.ts                 # NEW
│   │       └── index.ts                # NEW
│   ├── hooks/
│   │   ├── useSyncStatus.ts             # NEW
│   │   └── useSyncQueue.ts              # EXISTS (no changes)
│   └── utils/
│       ├── syncStatusUtils.ts           # NEW
│       └── syncQueueStorage.ts          # EXISTS (no changes)
├── features/
│   ├── recipes/
│   │   └── components/
│   │       └── RecipeCard/
│   │           └── RecipeCard.tsx       # MODIFY (add indicator)
│   ├── shopping/
│   │   └── components/
│   │       └── ShoppingListPanel/
│   │           └── ShoppingListPanel.tsx # MODIFY (add indicator)
│   └── chores/
│       └── screens/
│           └── ChoresScreen.tsx         # MODIFY (add indicator)
└── navigation/
    └── MainTabsScreen.tsx                # MODIFY (add OfflinePill)
```

## Implementation Details

### Sync Status Detection Logic

**Entity is Pending if**:
1. Entity has `localId` but `id === localId` (no serverId assigned yet), OR
2. Entity is in sync queue with status `PENDING` or `RETRYING`

**Entity is Confirmed if**:
1. Entity has `serverId` (or `id !== localId`), AND
2. Entity is NOT in sync queue

**Entity is Failed if**:
1. Entity is in sync queue with status `FAILED_PERMANENT`

### Performance Considerations

1. **Queue Reading**: `useSyncQueueStatus()` should read queue once and cache result
2. **Entity Status Checks**: `useEntitySyncStatus()` should memoize queue lookups
3. **Re-renders**: Use `useMemo` and `useCallback` to prevent unnecessary re-renders
4. **Polling**: Consider polling queue status every 2-3 seconds when online (or use cache events)

### Cache Event Strategy

**Option 1: Polling** (Simpler):
- Poll queue status every 2-3 seconds when online
- Update indicators when status changes

**Option 2: Event-Driven** (More Efficient):
- Listen to cache events for entity updates
- Check queue status when cache event fires
- Update indicators immediately

**Recommendation**: Start with Option 1 (polling), optimize to Option 2 if needed.

## Success Criteria

1. ✅ **Offline pill works correctly**:
   - Shows "Offline" when device is offline
   - Shows "X pending" when online with queued items
   - Shows "Syncing..." when worker is processing
   - Hides when online with no pending items

2. ✅ **Pending states clear after sync**:
   - Pending indicators disappear when entity gets `serverId`
   - Queue status updates reflect sync completion
   - UI updates immediately after successful sync

3. ✅ **Visual indicators are clear**:
   - Pending entities show subtle indicator
   - Failed entities show error indicator
   - Confirmed entities show no indicator (normal state)

4. ✅ **Performance is acceptable**:
   - No noticeable lag when checking sync status
   - Queue reads are efficient
   - UI updates are smooth

## Testing Strategy

### Unit Tests

1. **`useSyncStatus.ts`**:
   - Test `useSyncQueueStatus()` returns correct counts
   - Test `useEntitySyncStatus()` detects pending/confirmed/failed states
   - Test status updates when queue changes

2. **`syncStatusUtils.ts`**:
   - Test `isEntityInQueue()` correctly identifies queued entities
   - Test `getEntityQueueStatus()` returns correct status
   - Test `isEntityPending()` detects pending entities

3. **`OfflinePill.tsx`**:
   - Test renders correctly for each state (offline, pending, syncing, hidden)
   - Test dismissible functionality
   - Test position prop

4. **`SyncStatusIndicator.tsx`**:
   - Test renders correct icon for each status
   - Test size and label props

### Integration Tests

1. **Entity Status Updates**:
   - Create entity offline → verify pending indicator
   - Sync completes → verify indicator clears
   - Sync fails → verify failed indicator

2. **Offline Pill Updates**:
   - Go offline → verify pill shows "Offline"
   - Queue items → verify pill shows count
   - Sync starts → verify pill shows "Syncing..."
   - Sync completes → verify pill hides

### Manual Testing

1. **Offline Flow**:
   - Create recipe/shopping item/chore while offline
   - Verify pending indicator appears
   - Verify offline pill shows pending count
   - Go online and wait for sync
   - Verify indicators clear after sync

2. **Sync Failure**:
   - Create entity that will fail sync (invalid data)
   - Verify failed indicator appears
   - Verify offline pill shows failed count

3. **Multiple Entities**:
   - Create multiple entities offline
   - Verify all show pending indicators
   - Verify offline pill shows correct count
   - Sync all → verify all indicators clear

## Dependencies

- ✅ `NetworkContext` - Network state (already exists)
- ✅ `syncQueueStorage` - Queue storage (already exists)
- ✅ `syncQueueProcessor` - Queue processor (already exists)
- ✅ `useSyncQueue` - Sync queue hook (already exists)
- ✅ `cacheEvents` - Cache event system (already exists)
- ✅ Entity metadata (`localId`, `serverId`) - Already in entities

## Implementation Order

1. **Phase 1**: Sync status utilities and hooks
2. **Phase 2**: Offline pill component
3. **Phase 3**: Entity sync status indicator component
4. **Phase 4**: Integration with entity components
5. **Phase 5**: Main navigation integration
6. **Phase 6**: Cache event integration (verification/enhancement)

## Out of Scope

- ❌ Manual retry UI (automatic retry only)
- ❌ Detailed sync error messages in UI (log only)
- ❌ Sync progress percentage (pending count only)
- ❌ Background sync notifications (in-app indicators only)
- ❌ Queue management UI (automatic only)

## Future Enhancements

These are minor enhancements that could be added in future iterations:

### 1. Retry Button for Failed Syncs

**When to Consider**: If failed syncs become rare but users need explicit control.

**Implementation**:
- Add "Retry" button to `SyncStatusIndicator` when status is `failed`
- Button triggers manual retry via `syncQueueProcessor.processQueue()`
- Could be shown in:
  - Failed entity indicators (small retry icon)
  - Offline pill when `failedCount > 0` (expandable to show retry option)
  - Settings screen with failed syncs list

**Design Considerations**:
- Keep automatic retry as primary mechanism
- Manual retry should be secondary, for edge cases
- Only show when `FAILED_PERMANENT` items exist

### 2. Background Sync Status

**When to Consider**: If background sync is implemented, show passive sync status.

**Implementation**:
- Add `lastSyncedAt` timestamp tracking to sync queue processor
- Update timestamp after successful sync completion
- Show in `OfflinePill` when online with no pending items:
  - "Synced 3 min ago" (passive state)
  - Updates automatically as time passes
  - Subtle, non-intrusive indicator

**Design Considerations**:
- Only show when online and queue is empty
- Use relative time formatting ("just now", "2 min ago", "1 hour ago")
- Consider hiding after extended period (e.g., > 1 hour) to avoid clutter
- Could be dismissible or auto-hide after showing for a few seconds

## Notes

- **Offline Banner vs Pill**: Keep both - banner for full-width offline notification, pill for compact sync status
- **Performance**: Start with polling, optimize to event-driven if needed
- **Visual Design**: Keep indicators subtle to avoid UI clutter
- **Accessibility**: Ensure indicators have proper labels for screen readers
