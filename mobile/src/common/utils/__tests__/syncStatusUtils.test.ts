/**
 * Tests for Sync Status Utilities
 * 
 * Tests utility functions for checking entity sync status.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueueStorage, type QueuedWriteStatus } from '../syncQueueStorage';
import { isEntityInQueue, getEntityQueueStatus, isEntityPending, determineIndicatorStatus } from '../syncStatusUtils';
import type { SyncEntityType } from '../cacheMetadata';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

describe('syncStatusUtils', () => {
  let storageState: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    storageState = {};
    
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(storageState[key] || null);
    });
    
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      storageState[key] = value;
      return Promise.resolve(undefined);
    });
  });

  describe('isEntityInQueue', () => {
    beforeEach(async () => {
      // Clear queue before each test
      await syncQueueStorage.clear();
    });

    it('should return true when entity is in queue', async () => {
      const target = { localId: 'local-id-1' };
      const payload = { id: 'local-id-1', name: 'Test Recipe' };
      await syncQueueStorage.enqueue('recipes', 'create', target, payload);

      const result = await isEntityInQueue('recipes', 'local-id-1');
      expect(result).toBe(true);
    });

    it('should return false when entity is not in queue', async () => {
      const result = await isEntityInQueue('recipes', 'local-id-2');
      expect(result).toBe(false);
    });

    it('should return false for different entity type', async () => {
      const target = { localId: 'local-id-1' };
      const payload = { id: 'local-id-1', name: 'Test Recipe' };
      await syncQueueStorage.enqueue('recipes', 'create', target, payload);

      const result = await isEntityInQueue('chores', 'local-id-1');
      expect(result).toBe(false);
    });

    it('should return false for different localId', async () => {
      const target = { localId: 'local-id-1' };
      const payload = { id: 'local-id-1', name: 'Test Recipe' };
      await syncQueueStorage.enqueue('recipes', 'create', target, payload);

      const result = await isEntityInQueue('recipes', 'local-id-999');
      expect(result).toBe(false);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock getAll to throw error
      const originalGetAll = syncQueueStorage.getAll;
      syncQueueStorage.getAll = jest.fn().mockRejectedValueOnce(new Error('Storage error'));

      const result = await isEntityInQueue('recipes', 'local-id-1');
      expect(result).toBe(false);

      // Restore original
      syncQueueStorage.getAll = originalGetAll;
    });
  });

  describe('getEntityQueueStatus', () => {
    beforeEach(async () => {
      // Clear queue before each test
      await syncQueueStorage.clear();
    });

    it('should return PENDING status', async () => {
      const target = { localId: 'local-id-1' };
      const payload = { id: 'local-id-1', name: 'Test Recipe' };
      await syncQueueStorage.enqueue('recipes', 'create', target, payload);

      const result = await getEntityQueueStatus('recipes', 'local-id-1');
      expect(result).toBe('PENDING');
    });

    it('should return RETRYING status', async () => {
      const target = { localId: 'local-id-1' };
      const payload = { id: 'local-id-1', name: 'Test Recipe' };
      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      await syncQueueStorage.updateStatus(queued.id, 'RETRYING');

      const result = await getEntityQueueStatus('recipes', 'local-id-1');
      expect(result).toBe('RETRYING');
    });

    it('should return FAILED_PERMANENT status', async () => {
      const target = { localId: 'local-id-1' };
      const payload = { id: 'local-id-1', name: 'Test Recipe' };
      const queued = await syncQueueStorage.enqueue('recipes', 'create', target, payload);
      await syncQueueStorage.updateStatus(queued.id, 'FAILED_PERMANENT');

      const result = await getEntityQueueStatus('recipes', 'local-id-1');
      expect(result).toBe('FAILED_PERMANENT');
    });

    it('should return null for entity not in queue', async () => {
      const result = await getEntityQueueStatus('recipes', 'non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null for entity not in queue', async () => {
      const result = await getEntityQueueStatus('recipes', 'non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock getAll to throw error
      const originalGetAll = syncQueueStorage.getAll;
      syncQueueStorage.getAll = jest.fn().mockRejectedValueOnce(new Error('Storage error'));

      const result = await getEntityQueueStatus('recipes', 'local-id-1');
      expect(result).toBeNull();

      // Restore original
      syncQueueStorage.getAll = originalGetAll;
    });
  });

  describe('isEntityPending', () => {
    describe.each([
      ['entity with localId === id (pending)', { localId: 'local-123', id: 'local-123' }, true],
      ['entity with localId !== id (confirmed)', { localId: 'local-123', id: 'server-456' }, false],
      ['entity without localId', { id: 'server-456' }, false],
      ['entity with only localId (no id field)', { localId: 'local-123' }, false],
      ['entity with only localId (id is undefined)', { localId: 'local-123', id: undefined }, false],
      ['empty entity', {}, false],
      ['entity with undefined localId', { localId: undefined, id: 'server-456' }, false],
    ])('%s', (description, entity, expected) => {
      it(`should return ${expected}`, () => {
        const result = isEntityPending(entity);
        expect(result).toBe(expected);
      });
    });
  });

  describe('determineIndicatorStatus', () => {
    describe.each([
      ['failed status', { isPending: false, isConfirmed: false, isFailed: true }, 'failed'],
      ['pending status', { isPending: true, isConfirmed: false, isFailed: false }, 'pending'],
      ['confirmed status', { isPending: false, isConfirmed: true, isFailed: false }, 'confirmed'],
      ['failed takes priority over pending', { isPending: true, isConfirmed: false, isFailed: true }, 'failed'],
      ['pending takes priority over confirmed', { isPending: true, isConfirmed: true, isFailed: false }, 'pending'],
    ])('%s', (description, syncStatus, expected) => {
      it(`should return ${expected}`, () => {
        const result = determineIndicatorStatus(syncStatus);
        expect(result).toBe(expected);
      });
    });
  });
});
