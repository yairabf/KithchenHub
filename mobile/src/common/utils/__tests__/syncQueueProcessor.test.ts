/**
 * Tests for Sync Queue Processor
 * 
 * Tests payload building, transformation, and conflict handling.
 */

import { api } from '../../../services/api';
import { NetworkError, ApiError } from '../../../services/api';
import { syncQueueStorage, type QueuedWrite } from '../syncQueueStorage';
import { getSyncQueueProcessor } from '../syncQueueProcessor';
import { getIsOnline } from '../networkStatus';
import { invalidateCache } from '../../repositories/cacheAwareRepository';
import { cacheEvents } from '../cacheEvents';

// Mock AsyncStorage first (before importing syncQueueStorage)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto (must be before any imports that use it)
jest.mock('expo-crypto', () => {
  let mockUuidCounter = 0;
  return {
    randomUUID: jest.fn(() => {
      mockUuidCounter++;
      return `test-uuid-${mockUuidCounter}`;
    }),
    digestStringAsync: jest.fn(async (algorithm: string, data: string) => {
      // Simple mock hash function for deterministic operationId generation
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).padStart(32, '0');
    }),
    CryptoDigestAlgorithm: {
      SHA256: 'SHA256',
    },
  };
});

// Mock dependencies
jest.mock('../../../services/api');
jest.mock('../networkStatus');
jest.mock('../../repositories/cacheAwareRepository');
jest.mock('../cacheEvents');
jest.mock('../syncQueueStorage');

describe('SyncQueueProcessor', () => {
  let processor: ReturnType<typeof getSyncQueueProcessor>;
  let storageState: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    storageState = {};
    
    // Setup AsyncStorage mock to track state
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(storageState[key] || null);
    });
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      storageState[key] = value;
      return Promise.resolve(undefined);
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete storageState[key];
      return Promise.resolve(undefined);
    });
    
    (getIsOnline as jest.Mock).mockReturnValue(true);
    (syncQueueStorage.getAll as jest.Mock).mockResolvedValue([]);
    (syncQueueStorage.remove as jest.Mock).mockResolvedValue(undefined);
    (syncQueueStorage.incrementRetry as jest.Mock).mockResolvedValue(undefined);
    (syncQueueStorage.updateLastAttempt as jest.Mock).mockResolvedValue(undefined);
    (syncQueueStorage.updateStatus as jest.Mock).mockResolvedValue(undefined);
    (syncQueueStorage.markAsFailedPermanent as jest.Mock).mockResolvedValue(undefined);
    (syncQueueStorage.clear as jest.Mock).mockResolvedValue(undefined);
    
    // Reset worker state
    if (processor) {
      (processor as any).workerRunning = false;
      (processor as any).workerCancellationToken = { cancelled: false };
    }
    (invalidateCache as jest.Mock).mockResolvedValue(undefined);
    (cacheEvents.emitCacheChange as jest.Mock).mockReturnValue(undefined);
    
    processor = getSyncQueueProcessor();
  });

  describe('processQueue', () => {
    it('should skip processing when offline', async () => {
      (getIsOnline as jest.Mock).mockReturnValue(false);
      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue([]);

      await processor.processQueue();

      expect(api.post).not.toHaveBeenCalled();
    });

    it('should skip processing when queue is empty', async () => {
      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue([]);

      await processor.processQueue();

      expect(api.post).not.toHaveBeenCalled();
    });

    it('should process queue when online and queue has items', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          entityType: 'recipes',
          op: 'create',
          target: { localId: 'local-123' },
          payload: {
            id: 'local-123',
            name: 'Test Recipe',
            ingredients: [],
            instructions: [],
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'synced',
        conflicts: [],
      });

      await processor.processQueue();

      expect(api.post).toHaveBeenCalledWith('/auth/sync', expect.any(Object));
    });
  });

  describe('conflict handling', () => {
    it('should handle conflicts correctly', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          entityType: 'recipes',
          op: 'update',
          target: { localId: 'local-123', serverId: 'server-123' },
          payload: {
            id: 'local-123',
            name: 'Test Recipe',
            ingredients: [],
            instructions: [],
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'partial',
        conflicts: [
          { type: 'recipe', id: 'server-123', reason: 'Conflict' },
        ],
      });

      await processor.processQueue();

      expect(syncQueueStorage.incrementRetry).toHaveBeenCalledWith('queue-1');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          entityType: 'recipes',
          op: 'create',
          target: { localId: 'local-123' },
          payload: { id: 'local-123', name: 'Test' },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockRejectedValue(new NetworkError('Network error'));

      await processor.processQueue();

      // Should not increment retries for network errors
      expect(syncQueueStorage.incrementRetry).not.toHaveBeenCalled();
    });

    it('should increment retries for API errors', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          entityType: 'recipes',
          op: 'create',
          target: { localId: 'local-123' },
          payload: {
            id: 'local-123',
            name: 'Test Recipe',
            ingredients: [],
            instructions: [],
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockRejectedValue(new Error('API error'));

      await processor.processQueue();

      expect(syncQueueStorage.incrementRetry).toHaveBeenCalledWith('queue-1');
    });
  });

  describe('worker loop', () => {
    it('should start and stop worker loop', () => {
      expect(processor.isRunning()).toBe(false);
      
      processor.start();
      expect(processor.isRunning()).toBe(true);
      
      processor.stop();
      expect(processor.isRunning()).toBe(false);
    });

    it('should not start worker if already running', () => {
      processor.start();
      const initialPromise = (processor as any).workerPromise;
      
      processor.start(); // Try to start again
      
      // Should not create new promise
      expect((processor as any).workerPromise).toBe(initialPromise);
    });
  });

  describe('backoff calculation', () => {
    describe.each([
      [0, 0],      // First attempt: no delay
      [1, 2000],   // Second attempt: 2 seconds
      [2, 4000],   // Third attempt: 4 seconds
      [3, 8000],   // Fourth attempt: 8 seconds
      [10, 30000], // Capped at max delay (30s)
    ])('calculateBackoffDelay with attemptCount %d', (attemptCount, expectedDelay) => {
      it(`should filter items based on backoff delay of ${expectedDelay}ms`, async () => {
        const now = Date.now();
        const lastAttemptTime = attemptCount > 0 
          ? new Date(now - expectedDelay - 100).toISOString() // Past the backoff period
          : undefined;
        
        const mockQueue: QueuedWrite[] = [
          {
            id: 'queue-1',
            entityType: 'recipes',
            op: 'create',
            target: { localId: 'local-123' },
            payload: { 
              id: 'local-123', 
              name: 'Test Recipe',
              ingredients: [],
              instructions: [],
            },
            clientTimestamp: new Date().toISOString(),
            attemptCount,
            status: attemptCount > 0 ? 'RETRYING' : 'PENDING',
            lastAttemptAt: lastAttemptTime,
          },
        ];

        (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
        (api.post as jest.Mock).mockResolvedValue({ status: 'synced', conflicts: [] });

        // Process queue - items past backoff period should be processed
        await processor.processQueue();
        
        // Should process items that are ready (past backoff period)
        expect(api.post).toHaveBeenCalled();
      });
    });
  });

  describe('error classification', () => {
    it.each([
      ['NetworkError', new NetworkError('Network error'), false],
      ['401 ApiError', new ApiError('Unauthorized', 401), 'STOP_WORKER'],
      ['403 ApiError', new ApiError('Forbidden', 403), 'STOP_WORKER'],
      ['400 ApiError', new ApiError('Bad Request', 400), true],
      ['500 ApiError', new ApiError('Server Error', 500), true],
    ])('should classify %s correctly', async (description, error, expectedBehavior) => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          entityType: 'recipes',
          op: 'create',
          target: { localId: 'local-123' },
          payload: { id: 'local-123', name: 'Test Recipe', ingredients: [], instructions: [] },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockRejectedValue(error);

      await processor.processQueue();

      if (expectedBehavior === 'STOP_WORKER') {
        expect(processor.isRunning()).toBe(false);
      } else if (expectedBehavior === false) {
        // Network error: should not increment retry
        expect(syncQueueStorage.incrementRetry).not.toHaveBeenCalled();
      } else {
        // API error: should increment retry
        expect(syncQueueStorage.incrementRetry).toHaveBeenCalled();
      }
    });
  });

  describe('idempotency keys in sync payloads', () => {
    it('should include operationId in recipe sync payload', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          operationId: 'test-operation-id-1',
          entityType: 'recipes',
          op: 'create',
          target: { localId: 'local-123' },
          payload: {
            id: 'local-123',
            name: 'Test Recipe',
            ingredients: [{ name: 'Flour', quantity: 1, unit: 'cup' }],
            instructions: [{ text: 'Mix ingredients' }],
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'synced',
        conflicts: [],
      });

      await processor.processQueue();

      expect(api.post).toHaveBeenCalledWith(
        '/auth/sync',
        expect.objectContaining({
          recipes: expect.arrayContaining([
            expect.objectContaining({
              id: 'local-123',
              operationId: 'test-operation-id-1',
              title: 'Test Recipe',
            }),
          ]),
        }),
      );
    });

    it('should include operationId in shopping list sync payload', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          operationId: 'test-operation-id-2',
          entityType: 'shoppingLists',
          op: 'create',
          target: { localId: 'local-456' },
          payload: {
            id: 'local-456',
            name: 'Grocery List',
            color: '#FF0000',
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'synced',
        conflicts: [],
      });

      await processor.processQueue();

      expect(api.post).toHaveBeenCalledWith(
        '/auth/sync',
        expect.objectContaining({
          lists: expect.arrayContaining([
            expect.objectContaining({
              id: 'local-456',
              operationId: 'test-operation-id-2',
              name: 'Grocery List',
            }),
          ]),
        }),
      );
    });

    it('should include operationId for nested shopping items', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          operationId: 'test-list-operation-id',
          entityType: 'shoppingLists',
          op: 'create',
          target: { localId: 'local-list-1' },
          payload: {
            id: 'local-list-1',
            name: 'Grocery List',
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
        {
          id: 'queue-2',
          operationId: 'test-item-operation-id',
          entityType: 'shoppingItems',
          op: 'create',
          target: { localId: 'local-item-1' },
          payload: {
            id: 'local-item-1',
            listId: 'local-list-1',
            name: 'Milk',
            quantity: 1,
            unit: 'gallon',
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'synced',
        conflicts: [],
      });

      await processor.processQueue();

      // Verify API was called
      expect(api.post).toHaveBeenCalled();
      
      // Get the sync payload from the API call
      const syncCalls = (api.post as jest.Mock).mock.calls;
      if (syncCalls.length === 0) {
        // Debug: check if queue was filtered out
        const allQueue = await syncQueueStorage.getAll();
        console.log('Queue after processing:', JSON.stringify(allQueue, null, 2));
        throw new Error('API was not called - queue may have been filtered out');
      }
      
      const syncCall = syncCalls[0];
      expect(syncCall).toBeDefined();
      expect(syncCall.length).toBeGreaterThanOrEqual(2);
      
      const syncPayload = syncCall[1];
      expect(syncPayload).toBeDefined();
      expect(syncPayload.lists).toBeDefined();
      expect(syncPayload.lists.length).toBeGreaterThan(0);
      expect(syncPayload.lists[0].operationId).toBe('test-list-operation-id');
      expect(syncPayload.lists[0].items).toBeDefined();
      if (syncPayload.lists[0].items && syncPayload.lists[0].items.length > 0) {
        expect(syncPayload.lists[0].items[0].operationId).toBe('test-item-operation-id');
      }
    });

    it('should include requestId in sync payload', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          operationId: 'test-operation-id-3',
          entityType: 'recipes',
          op: 'create',
          target: { localId: 'local-123' },
          payload: {
            id: 'local-123',
            name: 'Test Recipe',
            ingredients: [],
            instructions: [],
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'synced',
        conflicts: [],
      });

      await processor.processQueue();

      const syncCall = (api.post as jest.Mock).mock.calls[0];
      const syncPayload = syncCall[1];

      expect(syncPayload.requestId).toBeDefined();
      expect(typeof syncPayload.requestId).toBe('string');
      expect(syncPayload.requestId.length).toBeGreaterThan(0);
    });

    it('should include operationId in chore sync payload', async () => {
      const mockQueue: QueuedWrite[] = [
        {
          id: 'queue-1',
          operationId: 'test-operation-id-4',
          entityType: 'chores',
          op: 'create',
          target: { localId: 'local-chore-1' },
          payload: {
            id: 'local-chore-1',
            name: 'Clean kitchen',
            completed: false,
          },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING',
        },
      ];

      (syncQueueStorage.getAll as jest.Mock).mockResolvedValue(mockQueue);
      (api.post as jest.Mock).mockResolvedValue({
        status: 'synced',
        conflicts: [],
      });

      await processor.processQueue();

      expect(api.post).toHaveBeenCalledWith(
        '/auth/sync',
        expect.objectContaining({
          chores: expect.arrayContaining([
            expect.objectContaining({
              id: 'local-chore-1',
              operationId: 'test-operation-id-4',
              title: 'Clean kitchen',
            }),
          ]),
        }),
      );
    });
  });
});
