/**
 * useSyncStatus Hook Tests
 * 
 * Tests for the useSyncStatus React hooks that provide sync queue statistics and entity sync status.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncQueueStatus, useEntitySyncStatus, useEntitySyncStatusWithEntity } from '../useSyncStatus';
import { syncQueueStorage, type QueuedWrite } from '../../utils/syncQueueStorage';
import { getSyncQueueProcessor } from '../../utils/syncQueueProcessor';
import { cacheEvents } from '../../utils/cacheEvents';
import type { SyncEntityType } from '../../utils/cacheMetadata';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../utils/syncQueueStorage', () => ({
  syncQueueStorage: {
    getAll: jest.fn(),
  },
}));

jest.mock('../../utils/syncQueueProcessor', () => ({
  getSyncQueueProcessor: jest.fn(),
}));

jest.mock('../../utils/cacheEvents', () => ({
  cacheEvents: {
    onCacheChange: jest.fn(),
  },
}));

const mockSyncQueueStorage = syncQueueStorage as jest.Mocked<typeof syncQueueStorage>;
const mockGetSyncQueueProcessor = getSyncQueueProcessor as jest.MockedFunction<typeof getSyncQueueProcessor>;
const mockCacheEvents = cacheEvents as jest.Mocked<typeof cacheEvents>;

describe('useSyncQueueStatus', () => {
  let mockProcessor: {
    isProcessing: jest.Mock;
  };
  let cacheChangeHandlers: Map<SyncEntityType, () => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    cacheChangeHandlers = new Map();

    mockProcessor = {
      isProcessing: jest.fn().mockReturnValue(false),
    };

    mockGetSyncQueueProcessor.mockReturnValue(mockProcessor as any);

    mockSyncQueueStorage.getAll.mockResolvedValue([]);

    mockCacheEvents.onCacheChange = jest.fn((entityType: SyncEntityType, handler: () => void) => {
      cacheChangeHandlers.set(entityType, handler);
      return jest.fn(); // Return unsubscribe function
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should return zero counts initially', async () => {
      const { result } = renderHook(() => useSyncQueueStatus());

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(0);
        expect(result.current.retryingCount).toBe(0);
        expect(result.current.failedCount).toBe(0);
        expect(result.current.totalPending).toBe(0);
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('queue statistics', () => {
    describe.each([
      ['pending items', [{ status: 'PENDING' }, { status: 'PENDING' }], 2, 0, 0, 2],
      ['retrying items', [{ status: 'RETRYING' }, { status: 'RETRYING' }], 0, 2, 0, 2],
      ['failed items', [{ status: 'FAILED_PERMANENT' }], 0, 0, 1, 0],
      ['mixed statuses', [
        { status: 'PENDING' },
        { status: 'RETRYING' },
        { status: 'FAILED_PERMANENT' },
      ], 1, 1, 1, 2],
    ])('%s', (description, queueItems, expectedPending, expectedRetrying, expectedFailed, expectedTotal) => {
      it(`should calculate correct counts`, async () => {
        mockSyncQueueStorage.getAll.mockResolvedValue(queueItems as QueuedWrite[]);

        const { result } = renderHook(() => useSyncQueueStatus());

        await waitFor(() => {
          expect(result.current.pendingCount).toBe(expectedPending);
          expect(result.current.retryingCount).toBe(expectedRetrying);
          expect(result.current.failedCount).toBe(expectedFailed);
          expect(result.current.totalPending).toBe(expectedTotal);
        });
      });
    });
  });

  describe('polling', () => {
    it('should poll queue status every 2 seconds', async () => {
      mockSyncQueueStorage.getAll.mockResolvedValue([]);

      renderHook(() => useSyncQueueStatus());

      await waitFor(() => {
        expect(mockSyncQueueStorage.getAll).toHaveBeenCalled();
      });

      const initialCallCount = mockSyncQueueStorage.getAll.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockSyncQueueStorage.getAll.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('cache event updates', () => {
    it('should update when cache events fire', async () => {
      mockSyncQueueStorage.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useSyncQueueStatus());

      await waitFor(() => {
        expect(result.current.totalPending).toBe(0);
      });

      // Simulate queue change
      mockSyncQueueStorage.getAll.mockResolvedValue([
        { status: 'PENDING' } as QueuedWrite,
      ]);

      // Fire cache event
      const handler = cacheChangeHandlers.get('recipes');
      act(() => {
        handler?.();
      });

      await waitFor(() => {
        expect(result.current.totalPending).toBe(1);
      });
    });
  });

  describe('processing state', () => {
    it('should reflect processor processing state', async () => {
      mockSyncQueueStorage.getAll.mockResolvedValue([]);
      mockProcessor.isProcessing.mockReturnValue(true);

      const { result } = renderHook(() => useSyncQueueStatus());

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });
    });
  });
});

describe('useEntitySyncStatus', () => {
  let cacheChangeHandlers: Map<SyncEntityType, () => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheChangeHandlers = new Map();

    mockSyncQueueStorage.getAll.mockResolvedValue([]);

    mockCacheEvents.onCacheChange = jest.fn((entityType: SyncEntityType, handler: () => void) => {
      cacheChangeHandlers.set(entityType, handler);
      return jest.fn();
    });
  });

  describe.each([
    ['entity in queue with PENDING', 'recipes', 'entity-1', 'local-1', [{ entityType: 'recipes', target: { localId: 'local-1' }, status: 'PENDING' }], true, false, false, 'PENDING'],
    ['entity in queue with RETRYING', 'recipes', 'entity-1', 'local-1', [{ entityType: 'recipes', target: { localId: 'local-1' }, status: 'RETRYING' }], true, false, false, 'RETRYING'],
    ['entity in queue with FAILED_PERMANENT', 'recipes', 'entity-1', 'local-1', [{ entityType: 'recipes', target: { localId: 'local-1' }, status: 'FAILED_PERMANENT' }], false, false, true, 'FAILED_PERMANENT'],
    ['entity not in queue', 'recipes', 'entity-1', 'local-1', [], false, true, false, undefined],
  ])('%s', (description, entityType, entityId, localId, queueItems, expectedPending, expectedConfirmed, expectedFailed, expectedStatus) => {
    it(`should return correct status flags`, async () => {
      mockSyncQueueStorage.getAll.mockResolvedValue(queueItems as QueuedWrite[]);

      const { result } = renderHook(() =>
        useEntitySyncStatus(entityType as SyncEntityType, entityId, localId)
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(expectedPending);
        expect(result.current.isConfirmed).toBe(expectedConfirmed);
        expect(result.current.isFailed).toBe(expectedFailed);
        if (expectedStatus) {
          expect(result.current.queueStatus).toBe(expectedStatus);
        }
      });
    });
  });

  describe('cache event updates', () => {
    it('should update when cache events fire', async () => {
      mockSyncQueueStorage.getAll.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useEntitySyncStatus('recipes', 'entity-1', 'local-1')
      );

      await waitFor(() => {
        expect(result.current.isConfirmed).toBe(true);
      });

      // Add entity to queue
      mockSyncQueueStorage.getAll.mockResolvedValue([
        { entityType: 'recipes', target: { localId: 'local-1' }, status: 'PENDING' } as QueuedWrite,
      ]);

      // Fire cache event
      const handler = cacheChangeHandlers.get('recipes');
      act(() => {
        handler?.();
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });
    });
  });
});

describe('useEntitySyncStatusWithEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncQueueStorage.getAll.mockResolvedValue([]);

    mockCacheEvents.onCacheChange = jest.fn((_entityType, _handler) => jest.fn()) as any;
  });

  describe.each([
    ['entity in queue (queue status takes priority)', { id: 'server-1', localId: 'local-1' }, [{ entityType: 'recipes', target: { localId: 'local-1' }, status: 'PENDING' }], true, false, false],
    ['entity pending (localId === id)', { id: 'local-1', localId: 'local-1' }, [], true, false, false],
    ['entity confirmed (localId !== id, not in queue)', { id: 'server-1', localId: 'local-1' }, [], false, true, false],
    ['entity failed in queue', { id: 'server-1', localId: 'local-1' }, [{ entityType: 'recipes', target: { localId: 'local-1' }, status: 'FAILED_PERMANENT' }], false, false, true],
  ])('%s', (description, entity, queueItems, expectedPending, expectedConfirmed, expectedFailed) => {
    it(`should return correct status`, async () => {
      mockSyncQueueStorage.getAll.mockResolvedValue(queueItems as QueuedWrite[]);

      const { result } = renderHook(() =>
        useEntitySyncStatusWithEntity('recipes', entity)
      );

      await waitFor(() => {
        expect(result.current.isPending).toBe(expectedPending);
        expect(result.current.isConfirmed).toBe(expectedConfirmed);
        expect(result.current.isFailed).toBe(expectedFailed);
      });
    });
  });
});
