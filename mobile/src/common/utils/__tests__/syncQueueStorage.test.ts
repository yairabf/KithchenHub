/**
 * Tests for Sync Queue Storage
 * 
 * Tests queue operations, compaction rules, and concurrent access handling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueueStorage, type QueuedWrite, type QueueTargetId, type QueuedWriteStatus } from '../syncQueueStorage';
import { syncQueueStorage as newSyncQueueStorage } from '../syncQueue/storage';
import type { SyncEntityType } from '../cacheMetadata';
import * as Crypto from 'expo-crypto';
import { getSignedInCacheKey } from '../../storage/dataModeStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).substr(2, 9)}`),
  digestStringAsync: jest.fn(async (algorithm: string, data: string) => {
    // Simple mock hash function for deterministic operationId generation
    // In real implementation, this would use SHA-256
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to hex string (32 chars for SHA-256)
    return Math.abs(hash).toString(16).padStart(32, '0');
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

describe('SyncQueueStorage', () => {
  // Track AsyncStorage state manually since the mock doesn't persist
  let storageState: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    storageState = {};
    
    // Mock AsyncStorage to track state
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
    
    // Reset UUID mock to generate unique IDs
    let uuidCounter = 0;
    (Crypto.randomUUID as jest.Mock).mockImplementation(() => `test-uuid-${uuidCounter++}`);
  });

  describe('enqueue', () => {
    it.each([
      ['create', 'create'],
      ['update', 'update'],
      ['delete', 'delete'],
    ])('should enqueue %s operation', async (description, op) => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      await syncQueueStorage.enqueue('recipes', op as 'create' | 'update' | 'delete', target, payload);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(callArgs[1]);
      expect(savedQueue).toHaveLength(1);
      expect(savedQueue[0].op).toBe(op);
      expect(savedQueue[0].target.localId).toBe('local-123');
    });

    describe('operationId generation', () => {
      it('should generate operationId for new queue items', async () => {
        const target: QueueTargetId = { localId: 'local-123' };
        const payload = { id: 'local-123', name: 'Test' };

        const queuedWrite = await syncQueueStorage.enqueue('recipes', 'create', target, payload);

        expect(queuedWrite.operationId).toBeDefined();
        expect(typeof queuedWrite.operationId).toBe('string');
        expect(queuedWrite.operationId.length).toBeGreaterThan(0);
      });

      it('should generate unique operationId for each enqueue call', async () => {
        const target: QueueTargetId = { localId: 'local-123' };
        const payload = { id: 'local-123', name: 'Test' };

        const write1 = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
        const write2 = await syncQueueStorage.enqueue('recipes', 'create', target, payload);

        expect(write1.operationId).not.toBe(write2.operationId);
      });

      it('should preserve operationId through compaction', async () => {
        const target: QueueTargetId = { localId: 'local-123' };
        const payload1 = { id: 'local-123', name: 'Test 1' };
        const payload2 = { id: 'local-123', name: 'Test 2' };

        // Enqueue create operation
        const createWrite = await syncQueueStorage.enqueue('recipes', 'create', target, payload1);
        const createOperationId = createWrite.operationId;

        // Wait to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));

        // Enqueue update operation (should merge with create)
        await syncQueueStorage.enqueue('recipes', 'update', target, payload2);

        const queue = await syncQueueStorage.getAll();
        expect(queue).toHaveLength(1);
        // The surviving item should have the original create operationId
        expect(queue[0].operationId).toBe(createOperationId);
        expect(queue[0].op).toBe('create'); // Merged to create
      });
    });
  });

  describe('compaction rules', () => {
    it.each([
      ['create + update merges to create', 'create', 'update', 'create'],
      ['update + update merges to latest update', 'update', 'update', 'update'],
      ['create + delete drops both', 'create', 'delete', null],
    ])('%s', async (description, op1, op2, expectedOp) => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload1 = { id: 'local-123', name: 'Test 1' };
      const payload2 = { id: 'local-123', name: 'Test 2' };

      // Enqueue first operation
      await syncQueueStorage.enqueue('recipes', op1 as 'create' | 'update' | 'delete', target, payload1);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Enqueue second operation
      await syncQueueStorage.enqueue('recipes', op2 as 'create' | 'update' | 'delete', target, payload2);

      const queue = await syncQueueStorage.getAll();
      
      if (expectedOp === null) {
        // Both should be dropped
        expect(queue).toHaveLength(0);
      } else {
        expect(queue).toHaveLength(1);
        expect(queue[0].op).toBe(expectedOp);
      }
    });

    describe('operationId persistence through compaction', () => {
      it.each([
        ['create + update', 'create', 'update', 'create'],
        ['update + update', 'update', 'update', 'update'],
        ['delete + delete', 'delete', 'delete', 'delete'],
      ])('should preserve operationId from first operation when %s', async (description, op1, op2, expectedOp) => {
        const target: QueueTargetId = { localId: 'local-123' };
        const payload1 = { id: 'local-123', name: 'Test 1' };
        const payload2 = { id: 'local-123', name: 'Test 2' };

        // Enqueue first operation
        const firstWrite = await syncQueueStorage.enqueue('recipes', op1 as 'create' | 'update' | 'delete', target, payload1);
        const firstOperationId = firstWrite.operationId;

        // Wait to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));

        // Enqueue second operation
        await syncQueueStorage.enqueue('recipes', op2 as 'create' | 'update' | 'delete', target, payload2);

        const queue = await syncQueueStorage.getAll();
        
        if (expectedOp === 'delete' && op1 === 'create' && op2 === 'delete') {
          // create + delete drops both
          expect(queue).toHaveLength(0);
        } else {
          expect(queue).toHaveLength(1);
          expect(queue[0].op).toBe(expectedOp);
          // OperationId should be from the first operation (surviving item)
          expect(queue[0].operationId).toBe(firstOperationId);
        }
      });
    });

    it('should handle delete + update (keeps delete)', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload1 = { id: 'local-123', name: 'Test' };
      const payload2 = { id: 'local-123', name: 'Updated' };

      await syncQueueStorage.enqueue('recipes', 'delete', target, payload1);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await syncQueueStorage.enqueue('recipes', 'update', target, payload2);

      const queue = await syncQueueStorage.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].op).toBe('delete');
    });
  });

  describe('getAll', () => {
    it('should return empty array when queue is empty', async () => {
      const queue = await syncQueueStorage.getAll();
      expect(queue).toEqual([]);
    });

    it('should return all queued writes sorted by timestamp', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      const queue = await syncQueueStorage.getAll();

      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0].target.localId).toBe('local-123');
    });
  });

  describe('getByEntityType', () => {
    it('should filter by entity type', async () => {
      const target1: QueueTargetId = { localId: 'local-1' };
      const target2: QueueTargetId = { localId: 'local-2' };

      await syncQueueStorage.enqueue('recipes', 'create', target1, { id: 'local-1' });
      await syncQueueStorage.enqueue('chores', 'create', target2, { id: 'local-2' });

      const recipes = await syncQueueStorage.getByEntityType('recipes');
      expect(recipes).toHaveLength(1);
      expect(recipes[0].entityType).toBe('recipes');
    });
  });

  describe('remove', () => {
    it('should remove queued write by ID', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      await syncQueueStorage.remove(queued.id);

      const queue = await syncQueueStorage.getAll();
      expect(queue.find(item => item.id === queued.id)).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all queued writes', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      await syncQueueStorage.clear();

      const queue = await syncQueueStorage.getAll();
      expect(queue).toHaveLength(0);
    });
  });

  describe('incrementRetry', () => {
    it('should increment attempt count and update status', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      expect(queued.attemptCount).toBe(0);
      expect(queued.status).toBe('PENDING');

      await syncQueueStorage.incrementRetry(queued.id);
      
      const queue = await syncQueueStorage.getAll();
      const updated = queue.find(item => item.id === queued.id);
      expect(updated?.attemptCount).toBe(1);
      expect(updated?.status).toBe('RETRYING');
      expect(updated?.lastAttemptAt).toBeDefined();
    });
  });

  describe('updateLastAttempt', () => {
    it('should update lastAttemptAt timestamp', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      expect(queued.lastAttemptAt).toBeUndefined();

      await syncQueueStorage.updateLastAttempt(queued.id);
      
      const queue = await syncQueueStorage.getAll();
      const updated = queue.find(item => item.id === queued.id);
      expect(updated?.lastAttemptAt).toBeDefined();
      expect(new Date(updated!.lastAttemptAt!).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('updateStatus', () => {
    it.each([
      ['PENDING', 'PENDING'],
      ['RETRYING', 'RETRYING'],
      ['FAILED_PERMANENT', 'FAILED_PERMANENT'],
    ])('should update status to %s', async (description, status) => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };

      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      expect(queued.status).toBe('PENDING');

      await syncQueueStorage.updateStatus(queued.id, status as QueuedWriteStatus);
      
      const queue = await syncQueueStorage.getAll();
      const updated = queue.find(item => item.id === queued.id);
      expect(updated?.status).toBe(status);
    });
  });

  describe('markAsFailedPermanent', () => {
    it('should mark item as permanently failed with error message', async () => {
      const target: QueueTargetId = { localId: 'local-123' };
      const payload = { id: 'local-123', name: 'Test' };
      const errorMessage = 'Max retries exceeded: Test error';

      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      expect(queued.status).toBe('PENDING');
      expect(queued.lastError).toBeUndefined();

      await syncQueueStorage.markAsFailedPermanent(queued.id, errorMessage);
      
      const queue = await syncQueueStorage.getAll();
      const updated = queue.find(item => item.id === queued.id);
      expect(updated?.status).toBe('FAILED_PERMANENT');
      expect(updated?.lastError).toBe(errorMessage);
      expect(updated?.lastAttemptAt).toBeDefined();
    });
  });

  describe('status migration', () => {
    it('should migrate old items without status to PENDING', async () => {
      // Manually create old-format item in storage
      const oldItem = {
        id: 'old-item',
        entityType: 'recipes' as SyncEntityType,
        op: 'create' as const,
        target: { localId: 'local-123' },
        payload: { id: 'local-123', name: 'Test' },
        clientTimestamp: new Date().toISOString(),
        attemptCount: 0,
        // No status field (old format)
      };

      const storageKey = getSignedInCacheKey('sync_queue');
      storageState[storageKey] = JSON.stringify([oldItem]);

      const queue = await syncQueueStorage.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].status).toBe('PENDING');
    });

    it('should validate and fix invalid status values', async () => {
      // Manually create item with invalid status
      const invalidItem = {
        id: 'invalid-item',
        entityType: 'recipes' as SyncEntityType,
        op: 'create' as const,
        target: { localId: 'local-123' },
        payload: { id: 'local-123', name: 'Test' },
        clientTimestamp: new Date().toISOString(),
        attemptCount: 0,
        status: 'INVALID_STATUS', // Invalid status
      };

      const storageKey = getSignedInCacheKey('sync_queue');
      storageState[storageKey] = JSON.stringify([invalidItem]);

      const queue = await syncQueueStorage.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].status).toBe('PENDING'); // Should default to PENDING
    });
  });

  describe('migration - deterministic operationId for old items', () => {
    it('should generate deterministic operationId for items without operationId', async () => {
      // Simulate old queue item without operationId
      const oldItem: QueuedWrite = {
        id: 'old-queue-id',
        entityType: 'recipes',
        op: 'create',
        target: { localId: 'local-123' },
        payload: { id: 'local-123', name: 'Test' },
        clientTimestamp: '2024-01-01T00:00:00.000Z',
        attemptCount: 0,
        status: 'PENDING',
        operationId: '', // Missing operationId (old format)
      };

      // Remove operationId to simulate old format
      const { operationId, ...oldItemWithoutOperationId } = oldItem;

      // Store old format item
      storageState[getSignedInCacheKey('sync_queue')] = JSON.stringify([oldItemWithoutOperationId]);

      // Read queue (should trigger migration)
      const queue = await syncQueueStorage.getAll();

      expect(queue).toHaveLength(1);
      expect(queue[0].operationId).toBeDefined();
      expect(typeof queue[0].operationId).toBe('string');
      expect(queue[0].operationId.length).toBeGreaterThan(0);

      // Same old item should get same deterministic operationId
      const queue2 = await syncQueueStorage.getAll();
      expect(queue2[0].operationId).toBe(queue[0].operationId);
    });
  });

  describe('schema versioning', () => {
    type VersioningScenario = {
      description: string;
      item: any;
      expectedVersion: number;
      expectedStatus: QueuedWriteStatus;
      expectErrorSubstring?: string;
    };

    const scenarios: VersioningScenario[] = [
      {
        description: 'legacy item without version or status',
        item: {
          id: 'legacy-item',
          entityType: 'recipes' as SyncEntityType,
          op: 'create' as const,
          target: { localId: 'local-123' },
          payload: { id: 'local-123', name: 'Legacy Test' },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          // No status or version fields (old format)
        },
        expectedVersion: 1,
        expectedStatus: 'PENDING',
      },
      {
        description: 'future-version item is retained but marked non-processable',
        item: {
          id: 'future-item',
          entityType: 'recipes' as SyncEntityType,
          op: 'create' as const,
          target: { localId: 'local-999' },
          payload: { id: 'local-999', name: 'Future Test' },
          clientTimestamp: new Date().toISOString(),
          attemptCount: 0,
          status: 'PENDING' as QueuedWriteStatus,
          version: 999,
        },
        expectedVersion: 999,
        expectedStatus: 'FAILED_PERMANENT',
        expectErrorSubstring: 'Unsupported queue storage version',
      },
    ];

    it.each(scenarios)('should handle schema versioning for %s', async scenario => {
      const storageKey = getSignedInCacheKey('sync_queue');
      storageState[storageKey] = JSON.stringify([scenario.item]);

      const queue = await newSyncQueueStorage.getAll();
      expect(queue).toHaveLength(1);

      const [migrated] = queue as Array<QueuedWrite & { version?: number }>;
      expect(migrated.version).toBe(scenario.expectedVersion);
      expect(migrated.status).toBe(scenario.expectedStatus);

      if (scenario.expectErrorSubstring) {
        expect(typeof migrated.lastError).toBe('string');
        expect(migrated.lastError).toContain(scenario.expectErrorSubstring);
      }

      if (!scenario.item.version) {
        const persisted = JSON.parse(storageState[storageKey]) as Array<
          QueuedWrite & { version?: number }
        >;
        expect(persisted).toHaveLength(1);
        expect(persisted[0].version).toBe(scenario.expectedVersion);
      }
    });
  });
});
