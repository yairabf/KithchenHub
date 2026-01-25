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
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

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
});
