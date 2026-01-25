/**
 * Tests for Sync Queue Processor
 * 
 * Tests payload building, transformation, and conflict handling.
 */

import { api } from '../../../services/api';
import { NetworkError } from '../../../services/api';
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
    (syncQueueStorage.clear as jest.Mock).mockResolvedValue(undefined);
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
});
