---
name: Signed-In Sync Worker
overview: Implement a reliable sync worker that continuously drains the sync queue on reconnect with exponential backoff retry logic. The worker will process queued writes in a loop when online, automatically retrying failed items with increasing delays.
todos:
  - id: backoff-utilities
    content: Add exponential backoff calculation utilities to syncQueueProcessor.ts
    status: completed
  - id: worker-loop-infrastructure
    content: Implement worker loop infrastructure (start/stop/isRunning methods)
    status: completed
  - id: retry-timestamp-tracking
    content: Add lastAttemptAt timestamp tracking, status field, and lastError to QueuedWrite schema and storage
    status: completed
  - id: error-classification
    content: Implement classifySyncError() to decide retry vs stop vs dead-letter based on error type
    status: completed
  - id: backoff-filtering
    content: Update processor to filter readyItems and ensure processQueue only processes filtered items (don't re-read queue)
    status: completed
  - id: next-attempt-scheduling
    content: Compute nextAttemptAt per item and sleep until the earliest nextAttemptAt in worker loop
    status: completed
  - id: worker-integration
    content: Integrate worker loop start/stop with network status in useSyncQueue hook (stop on background, restart on foreground)
    status: completed
isProject: false
---

# Signed-In Sync Worker Implementation Plan

## Current Status Analysis

### ✅ Already Implemented

1. **Sync Queue Storage** (`syncQueueStorage.ts`):
   - Complete queue storage with compaction
   - Retry count tracking (`attemptCount` field)
   - Queue operations (enqueue, getAll, remove, incrementRetry)
   - Thread-safe operations with lock mechanism

2. **Sync Queue Processor** (`syncQueueProcessor.ts`):
   - Basic `processQueue()` method that processes queue on-demand
   - Batch-state sync strategy (sends latest entity state to `/auth/sync`)
   - Conflict handling
   - Network error detection
   - Retry count incrementing (MAX_RETRY_ATTEMPTS = 3)
   - Cache invalidation after successful sync

3. **Network Integration** (`useSyncQueue.ts`):
   - Hook that triggers queue processing on network reconnection
   - Processes queue when app comes to foreground
   - Integrated in `MainNavigator.tsx`

4. **Backend Sync Endpoint**:
   - `POST /auth/sync` endpoint exists and handles batch sync
   - Returns sync result with status and conflicts

### ❌ Missing Implementation

1. **Worker Loop**:
   - Current implementation only processes queue on-demand (network change, app foreground)
   - No continuous worker loop that keeps draining queue until empty
   - If processing fails, queue won't be retried automatically until next network event

2. **Exponential Backoff**:
   - No delay between retry attempts
   - Failed items are immediately retried on next `processQueue()` call
   - No backoff calculation based on `attemptCount`

3. **Retry Scheduling**:
   - Failed items increment `attemptCount` but aren't scheduled for retry
   - No mechanism to wait before retrying failed items
   - Items with high `attemptCount` should wait longer before retry

4. **Reliable Queue Draining**:
   - Queue may not drain completely if processing fails partway through
   - No mechanism to continue processing remaining items after partial failure
   - No loop that ensures all items are processed

## Architecture Overview

The sync worker will implement a continuous processing loop that:

1. **Monitors queue state** - Checks if queue has items to process
2. **Processes queue** - Attempts to sync all queued writes
3. **Applies backoff** - Waits before retrying failed items based on attempt count
4. **Continues until empty** - Keeps processing until queue is drained or max retries reached
5. **Handles network changes** - Starts/stops worker based on network status

```
┌─────────────────────────────────────────────────────────┐
│              Network Status Change                       │
│              (Offline → Online)                          │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   Worker Loop Start   │
         │   (if online)         │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Check Queue Empty?   │
         └───────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                          │
    ┌───▼───┐              ┌──────▼──────┐
    │ Empty │              │ Has Items    │
    └───┬───┘              └──────┬──────┘
        │                          │
        │              ┌───────────▼───────────┐
        │              │  Process Queue       │
        │              │  (batch sync)        │
        │              └───────────┬───────────┘
        │                          │
        │              ┌───────────▼───────────┐
        │              │  Success?             │
        │              └───────────┬───────────┘
        │                          │
        │        ┌─────────────────┴─────────────────┐
        │        │                                   │
        │  ┌─────▼─────┐                    ┌──────▼──────┐
        │  │  Success   │                    │  Failed     │
        │  └─────┬─────┘                    └──────┬──────┘
        │        │                                   │
        │        │                    ┌──────────────▼──────────────┐
        │        │                    │  Calculate Backoff Delay    │
        │        │                    │  (exponential: 2^attemptCount)│
        │        │                    └──────────────┬──────────────┘
        │        │                                   │
        │        │                    ┌──────────────▼──────────────┐
        │        │                    │  Wait for Backoff Period    │
        │        │                    └──────────────┬──────────────┘
        │        │                                   │
        │        └───────────────────┬───────────────┘
        │                            │
        │              ┌─────────────▼─────────────┐
        │              │  Continue Loop            │
        │              │  (check queue again)      │
        │              └───────────────────────────┘
        │
        └──────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Add Exponential Backoff Utilities

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: Add backoff calculation and delay utilities.

**Implementation**:

```typescript
/**
 * Calculate exponential backoff delay in milliseconds
 * Formula: baseDelay * (2 ^ attemptCount)
 * 
 * @param attemptCount - Number of previous attempts (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000ms = 1s)
 * @param maxDelayMs - Maximum delay cap (default: 30000ms = 30s)
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(
  attemptCount: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number {
  const delay = baseDelayMs * Math.pow(2, attemptCount);
  return Math.min(delay, maxDelayMs);
}

/**
 * Wait for specified delay (non-blocking for UI)
 */
function waitForDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Constants**:
- `BASE_BACKOFF_DELAY_MS = 1000` (1 second)
- `MAX_BACKOFF_DELAY_MS = 30000` (30 seconds)
- `MAX_RETRY_ATTEMPTS = 3` (already exists)

### Phase 2: Implement Worker Loop

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: Add continuous worker loop that drains queue until empty.

**Interface Changes**:

```typescript
export interface SyncQueueProcessor {
  start(): void;  // Start worker loop
  stop(): void;   // Stop worker loop
  processQueue(): Promise<void>;  // Process queue once (existing)
  isProcessing(): boolean;  // Check if currently processing
  isRunning(): boolean;  // NEW: Check if worker loop is running
}
```

**Worker Loop Implementation**:

```typescript
class SyncQueueProcessorImpl implements SyncQueueProcessor {
  private processing = false;
  private processingPromise: Promise<void> | null = null;
  private workerRunning = false;  // NEW: Worker loop state
  private workerStopRequested = false;  // NEW: Stop flag
  private workerPromise: Promise<void> | null = null;  // NEW: Worker loop promise

  /**
   * Start the worker loop
   * Continuously processes queue until empty or stopped
   */
  start(): void {
    if (this.workerRunning) {
      return; // Already running
    }

    this.workerRunning = true;
    this.workerStopRequested = false;
    this.workerPromise = this.runWorkerLoop();
  }

  /**
   * Stop the worker loop
   */
  stop(): void {
    this.workerStopRequested = true;
    this.workerRunning = false;
  }

  /**
   * Check if worker loop is running
   */
  isRunning(): boolean {
    return this.workerRunning;
  }

  /**
   * Worker loop that continuously processes queue
   */
  private async runWorkerLoop(): Promise<void> {
    while (this.workerRunning && !this.workerStopRequested) {
      // Check if online
      if (!getIsOnline()) {
        // Wait and check again
        await waitForDelay(5000); // Check every 5 seconds when offline
        continue;
      }

      // Check if queue has items
      const queue = await syncQueueStorage.getAll();
      
      if (queue.length === 0) {
        // Queue empty, stop worker
        this.workerRunning = false;
        break;
      }

      // Filter items that are ready for retry (respect backoff)
      const readyItems = await this.filterItemsReadyForRetry(queue);
      
      if (readyItems.length === 0) {
        // All items are in backoff, compute time until next attempt
        const nextAttemptTime = this.calculateEarliestNextAttempt(queue);
        if (nextAttemptTime === null) {
          // No items waiting, stop worker
          this.workerRunning = false;
          break;
        }
        
        const now = Date.now();
        const waitTime = Math.max(0, nextAttemptTime - now);
        await waitForDelay(waitTime);
        continue;
      }

      // Process only ready items (pass filtered set to avoid re-reading queue)
      try {
        await this.processReadyItems(readyItems);
      } catch (error) {
        console.error('Worker loop error:', error);
        // Continue loop even if processing fails
      }

      // If there are ready items, process immediately (no extra sleep)
      // Loop will check again on next iteration
    }

    this.workerRunning = false;
    this.workerPromise = null;
  }

  /**
   * Calculate earliest next attempt time from queue items
   * Returns timestamp in milliseconds, or null if no items waiting
   */
  private calculateEarliestNextAttempt(queue: QueuedWrite[]): number | null {
    const now = Date.now();
    const nextAttempts: number[] = [];
    
    for (const item of queue) {
      // Skip items that are permanently failed
      if (item.status === 'FAILED_PERMANENT') {
        continue;
      }
      
      // Items with attemptCount === 0 are ready immediately
      if (item.attemptCount === 0) {
        return now; // Ready now
      }
      
      // Calculate next attempt time
      if (item.lastAttemptAt) {
        const lastAttempt = new Date(item.lastAttemptAt).getTime();
        const backoffDelay = calculateBackoffDelay(item.attemptCount);
        const nextAttempt = lastAttempt + backoffDelay;
        nextAttempts.push(nextAttempt);
      }
    }
    
    if (nextAttempts.length === 0) {
      return null; // No items waiting
    }
    
    return Math.min(...nextAttempts);
  }
}
```

### Phase 3: Add Retry Timestamp Tracking and Status

**File**: `mobile/src/common/utils/syncQueueStorage.ts`

**Purpose**: Track when items were last attempted, status, and errors to enforce backoff delays and handle dead-letter items.

**Schema Change**:

```typescript
export type QueuedWriteStatus = 'PENDING' | 'RETRYING' | 'FAILED_PERMANENT';

export type QueuedWrite = {
  id: string;
  entityType: SyncEntityType;
  op: SyncOp;
  target: QueueTargetId;
  payload: unknown;
  clientTimestamp: string;
  attemptCount: number;
  lastAttemptAt?: string;  // NEW: ISO timestamp of last attempt
  status: QueuedWriteStatus;  // NEW: Item status
  lastError?: string;  // NEW: Last error message (for debugging)
};
```

**Storage Changes**:
- Update `incrementRetry()` to set `lastAttemptAt` timestamp and update status
- Update `enqueue()` to initialize `lastAttemptAt` and `status: 'PENDING'`
- Add `markAsFailedPermanent(id: string, error: string)` method
- Add `updateLastAttempt(id: string)` method
- Add `updateStatus(id: string, status: QueuedWriteStatus)` method

### Phase 3.5: Add Error Classification

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: Classify errors to decide retry strategy (retry, stop worker, or dead-letter).

**Implementation**:

```typescript
type ErrorClassification = 
  | { type: 'RETRY'; shouldIncrement: boolean }  // Retry with/without incrementing attemptCount
  | { type: 'STOP_WORKER'; reason: string }  // Stop worker (e.g., auth error)
  | { type: 'DEAD_LETTER'; reason: string };  // Mark as permanently failed

/**
 * Classify sync error to determine retry strategy
 */
function classifySyncError(error: unknown): ErrorClassification {
  // Network errors (offline, timeout, DNS)
  if (error instanceof NetworkError) {
    return { type: 'RETRY', shouldIncrement: false }; // Don't increment, just pause
  }

  // API errors
  if (error instanceof ApiError) {
    const status = error.status;
    
    // Auth errors (401, 403) - stop worker, needs re-auth
    if (status === 401 || status === 403) {
      return { type: 'STOP_WORKER', reason: 'Authentication required' };
    }
    
    // 4xx validation errors (400, 422) - increment and eventually dead-letter
    if (status >= 400 && status < 500) {
      return { type: 'RETRY', shouldIncrement: true };
    }
    
    // 5xx server errors - increment and backoff
    if (status >= 500) {
      return { type: 'RETRY', shouldIncrement: true };
    }
  }

  // Unknown errors - retry with increment
  return { type: 'RETRY', shouldIncrement: true };
}
```

### Phase 4: Update Processor to Process Only Ready Items

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: Split processor to accept filtered items and ensure it only processes ready items (don't re-read queue).

**Interface Changes**:

```typescript
export interface SyncQueueProcessor {
  start(): void;
  stop(): void;
  processQueue(): Promise<void>;  // Process all ready items (for backward compatibility)
  processReadyItems(items: QueuedWrite[]): Promise<void>;  // NEW: Process specific items
  isProcessing(): boolean;
  isRunning(): boolean;
}
```

**Implementation**:

```typescript
/**
 * Process specific ready items (called by worker loop with filtered set)
 * This ensures we only process items that passed backoff check
 */
async processReadyItems(readyItems: QueuedWrite[]): Promise<void> {
  if (readyItems.length === 0) {
    return;
  }

  // Prevent concurrent processing
  if (this.processing) {
    if (this.processingPromise) {
      return this.processingPromise;
    }
  }

  this.processing = true;
  this.processingPromise = this.doProcessReadyItems(readyItems)
    .finally(() => {
      this.processing = false;
      this.processingPromise = null;
    });

  return this.processingPromise;
}

private async doProcessReadyItems(readyItems: QueuedWrite[]): Promise<void> {
  // Check if online
  if (!getIsOnline()) {
    console.log('Sync queue processing skipped: device is offline');
    return;
  }

  console.log(`Processing sync queue: ${readyItems.length} ready items`);

  try {
    // Build sync payload from ready items only
    const syncPayload = await this.buildSyncPayload(readyItems);
    
    // Check if payload is empty (all items were compacted away)
    const hasData = 
      (syncPayload.recipes && syncPayload.recipes.length > 0) ||
      (syncPayload.lists && syncPayload.lists.length > 0) ||
      (syncPayload.chores && syncPayload.chores.length > 0);
    
    if (!hasData) {
      // All items were compacted, remove them
      for (const item of readyItems) {
        await syncQueueStorage.remove(item.id);
      }
      return;
    }

    // Call sync endpoint
    const result = await api.post<SyncResult>('/auth/sync', syncPayload);

    // Handle sync result
    await this.handleSyncResult(readyItems, result);

  } catch (error) {
    // Classify error to determine retry strategy
    const classification = classifySyncError(error);
    
    if (classification.type === 'STOP_WORKER') {
      // Stop worker (e.g., auth error)
      this.stop();
      console.error('Sync worker stopped:', classification.reason);
      return;
    }
    
    if (classification.type === 'DEAD_LETTER') {
      // Mark items as permanently failed
      for (const item of readyItems) {
        await syncQueueStorage.markAsFailedPermanent(
          item.id,
          classification.reason
        );
      }
      return;
    }
    
    // RETRY classification
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Sync queue processing failed:', errorMessage);
    
    // Update items based on classification
    for (const item of readyItems) {
      await syncQueueStorage.updateLastAttempt(item.id);
      
      if (classification.shouldIncrement) {
        if (item.attemptCount < MAX_RETRY_ATTEMPTS) {
          await syncQueueStorage.incrementRetry(item.id);
          await syncQueueStorage.updateStatus(item.id, 'RETRYING');
        } else {
          // Max retries reached, mark as permanently failed
          await syncQueueStorage.markAsFailedPermanent(
            item.id,
            `Max retries exceeded: ${errorMessage}`
          );
        }
      } else {
        // Don't increment, just update timestamp (network error)
        await syncQueueStorage.updateStatus(item.id, 'RETRYING');
      }
    }
  }
}

/**
 * Process queue (backward compatibility - filters ready items internally)
 */
async processQueue(): Promise<void> {
  const queue = await syncQueueStorage.getAll();
  const readyItems = this.filterItemsReadyForRetry(queue);
  return this.processReadyItems(readyItems);
}

/**
 * Filter items that are ready for retry (backoff period has passed)
 */
private filterItemsReadyForRetry(queue: QueuedWrite[]): QueuedWrite[] {
  const now = Date.now();
  
  return queue.filter(item => {
    // Skip permanently failed items
    if (item.status === 'FAILED_PERMANENT') {
      return false;
    }
    
    // First attempt (attemptCount === 0) is always ready
    if (item.attemptCount === 0) {
      return true;
    }
    
    // Check if backoff period has passed
    if (!item.lastAttemptAt) {
      // No timestamp, assume ready (shouldn't happen)
      return true;
    }
    
    const lastAttempt = new Date(item.lastAttemptAt).getTime();
    const backoffDelay = calculateBackoffDelay(item.attemptCount);
    const nextAttemptTime = lastAttempt + backoffDelay;
    
    return now >= nextAttemptTime;
  });
}
```

**New Storage Methods**:

```typescript
// In syncQueueStorage.ts
async updateLastAttempt(id: string): Promise<void> {
  this.operationLock = this.operationLock.then(async () => {
    const queue = await readQueue();
    const updated = queue.map(item => {
      if (item.id === id) {
        return { ...item, lastAttemptAt: new Date().toISOString() };
      }
      return item;
    });
    
    await writeQueue(updated);
  });

  await this.operationLock;
}

async updateStatus(id: string, status: QueuedWriteStatus): Promise<void> {
  this.operationLock = this.operationLock.then(async () => {
    const queue = await readQueue();
    const updated = queue.map(item => {
      if (item.id === id) {
        return { ...item, status };
      }
      return item;
    });
    
    await writeQueue(updated);
  });

  await this.operationLock;
}

async markAsFailedPermanent(id: string, error: string): Promise<void> {
  this.operationLock = this.operationLock.then(async () => {
    const queue = await readQueue();
    const updated = queue.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          status: 'FAILED_PERMANENT' as QueuedWriteStatus,
          lastError: error,
          lastAttemptAt: new Date().toISOString(),
        };
      }
      return item;
    });
    
    await writeQueue(updated);
  });

  await this.operationLock;
}
```

### Phase 4.5: Next Attempt Scheduling

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: Compute nextAttemptAt per item and sleep until earliest nextAttemptAt in worker loop.

**Implementation**: Already included in Phase 2 worker loop with `calculateEarliestNextAttempt()` method. This ensures:
- Worker sleeps until the earliest item is ready
- No tight loops when all items are in backoff
- Efficient timing based on actual next attempt times

### Phase 5: Integrate Worker Loop with Network Status

**File**: `mobile/src/common/hooks/useSyncQueue.ts`

**Purpose**: Start/stop worker loop based on network status and app lifecycle. Stop on background, restart on foreground.

**Changes**:

```typescript
export function useSyncQueue(): void {
  const { isOffline } = useNetwork();
  const { isForeground } = useAppLifecycle();
  const processorRef = useRef<ReturnType<typeof getSyncQueueProcessor> | null>(null);
  const lastOfflineStateRef = useRef<boolean | null>(null);
  const lastForegroundStateRef = useRef<boolean>(false);

  // Initialize processor
  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = getSyncQueueProcessor();
    }
  }, []);

  // Start/stop worker loop based on network status
  useEffect(() => {
    if (!processorRef.current) return;

    const wasOffline = lastOfflineStateRef.current;
    const isNowOnline = !isOffline;

    // Track offline state
    lastOfflineStateRef.current = isOffline;

    if (isNowOnline && !processorRef.current.isRunning()) {
      // Network came back online - start worker loop
      console.log('Network came back online, starting sync worker');
      processorRef.current.start();
    } else if (isOffline && processorRef.current.isRunning()) {
      // Network went offline - stop worker loop
      console.log('Network went offline, stopping sync worker');
      processorRef.current.stop();
    }
  }, [isOffline]);

  // Start/stop worker based on app foreground/background
  useEffect(() => {
    if (!processorRef.current) return;

    const wasBackground = !lastForegroundStateRef.current;
    const isNowForeground = isForeground;

    lastForegroundStateRef.current = isForeground;

    if (wasBackground && isNowForeground && !isOffline && !processorRef.current.isRunning()) {
      // App came to foreground and online - start worker
      console.log('App came to foreground, starting sync worker');
      processorRef.current.start();
    } else if (!isNowForeground && processorRef.current.isRunning()) {
      // App went to background - stop worker (RN timers unreliable in background)
      console.log('App went to background, stopping sync worker');
      processorRef.current.stop();
    }
  }, [isForeground, isOffline]);

  // Cleanup: stop worker on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current?.isRunning()) {
        processorRef.current.stop();
      }
    };
  }, []);
}
```

## File Structure

```
mobile/src/common/utils/
├── syncQueueStorage.ts                    # MODIFY: Add lastAttemptAt tracking
└── syncQueueProcessor.ts                  # MODIFY: Add worker loop + backoff

mobile/src/common/hooks/
└── useSyncQueue.ts                        # MODIFY: Start/stop worker loop
```

## Implementation Details

### Backoff Strategy

- **Base Delay**: 1 second (1000ms)
- **Exponential Formula**: `baseDelay * (2 ^ attemptCount)`
- **Max Delay Cap**: 30 seconds (30000ms)
- **Attempt Counts**:
  - 0 attempts: Immediate (0ms delay)
  - 1 attempt: 2 seconds
  - 2 attempts: 4 seconds
  - 3 attempts: 8 seconds (capped at 30s max)

### Worker Loop Behavior

1. **When Online**:
   - Continuously checks queue
   - Processes ready items (backoff period passed)
   - Waits for backoff if all items are in backoff
   - Stops when queue is empty

2. **When Offline**:
   - Stops processing immediately
   - Worker loop stops (hook will restart on reconnect)

3. **On App Foreground**:
   - Starts worker if online and not already running

4. **On App Background**:
   - Stops worker immediately (RN timers unreliable in background)
   - Worker will restart on foreground + online

### Queue Draining Guarantees

- Worker loop continues until queue is empty or all items are permanently failed
- Failed items are retried with exponential backoff
- Items exceeding MAX_RETRY_ATTEMPTS are marked as `FAILED_PERMANENT` (kept in queue for debugging)
- Network errors don't increment retry count (transient, worker pauses)
- Auth errors (401/403) stop worker (needs re-authentication)
- 4xx validation errors increment retry count and eventually dead-letter
- 5xx server errors increment retry count and apply backoff
- Worker only processes ready items (respects backoff delays)
- Worker sleeps until earliest next attempt time (no tight loops)

## Success Criteria

1. ✅ **Worker loop starts on network reconnection**
2. ✅ **Queue drains completely when online**
3. ✅ **Failed items retry with exponential backoff**
4. ✅ **Worker stops when queue is empty**
5. ✅ **Worker handles network disconnections gracefully**
6. ✅ **No tight loops or excessive CPU usage**
7. ✅ **Backoff delays are respected**
8. ✅ **Queue processing is reliable even with transient failures**

## Testing Strategy

### Manual Testing

1. **Queue Draining**:
   - Queue multiple writes offline
   - Go online
   - Verify worker starts and drains queue completely

2. **Backoff Behavior**:
   - Queue write that will fail (invalid data)
   - Verify retry attempts with increasing delays
   - Check console logs for backoff timing

3. **Network Interruption**:
   - Start worker loop
   - Interrupt network mid-processing
   - Verify worker stops
   - Restore network
   - Verify worker resumes and completes queue

4. **App Lifecycle**:
   - Queue writes offline
   - Background app
   - Go online (while backgrounded)
   - Foreground app
   - Verify worker starts and processes queue

### Edge Cases

- Empty queue (worker should stop immediately)
- All items in backoff (worker should wait)
- Network flapping (worker should start/stop appropriately)
- Max retries reached (items should be removed, worker should continue)

## Dependencies

- ✅ `syncQueueStorage.ts` - Queue storage operations
- ✅ `networkStatus.ts` - Network status detection
- ✅ `api.ts` - API client for sync endpoint
- ✅ `NetworkContext` - React context for network state
- ✅ `AppLifecycleContext` - React context for app state

## Implementation Order

1. **Phase 1**: Add exponential backoff utilities
2. **Phase 2**: Implement worker loop infrastructure (with next-attempt scheduling)
3. **Phase 3**: Add retry timestamp tracking, status, and lastError to storage
4. **Phase 3.5**: Add error classification (classifySyncError)
5. **Phase 4**: Update processor to process only ready items (processReadyItems method)
6. **Phase 4.5**: Next attempt scheduling (already in Phase 2 worker loop)
7. **Phase 5**: Integrate worker loop with network status hooks (stop on background)

## Out of Scope

- ❌ UI indicators for sync progress (can be added later)
- ❌ Manual retry triggers (automatic only)
- ❌ Queue size limits UI warnings (log only)
- ❌ Background task scheduling (worker runs in foreground only)
- ❌ Server-side queue persistence (mobile-only queue)