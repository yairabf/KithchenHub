import AsyncStorage from '@react-native-async-storage/async-storage';
import { readEntityEnvelope, writeEntityEnvelope, type StorageEnvelope } from './guestStorageHelpers';
import type { BaseEntity } from '../types/entityMetadata';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Test entity type
interface TestEntity extends BaseEntity {
  name: string;
  value: number;
}

// Validator for test entity
function validateTestEntity(item: unknown): item is TestEntity {
  if (!item || typeof item !== 'object') {
    return false;
  }
  
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.localId === 'string' &&
    candidate.localId.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.value === 'number'
  );
}

describe('guestStorageHelpers', () => {
  const STORAGE_KEY = '@test_storage_key';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('readEntityEnvelope', () => {
    describe.each([
      { scenario: 'empty storage', storageValue: null },
      { scenario: 'invalid JSON', storageValue: 'invalid json' },
      { scenario: 'wrong shape', storageValue: JSON.stringify({ not: 'an envelope', or: 'an array' }) },
    ])('should return default envelope when $scenario', ({ storageValue }) => {
      it('returns default envelope with version 1 and empty data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

        expect(result).toMatchObject({
          version: 1,
          data: [],
        });
        expect(result.updatedAt).toBeDefined();
        expect(typeof result.updatedAt).toBe('string');
      });
    });

    it('should read valid envelope format', async () => {
      const envelope: StorageEnvelope<TestEntity> = {
        version: 1,
        updatedAt: '2026-01-25T12:00:00.000Z',
        data: [
          { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

      const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

      expect(result.version).toBe(1);
      expect(result.updatedAt).toBe('2026-01-25T12:00:00.000Z');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Entity',
        value: 42,
      });
    });

    it('should upgrade legacy array format to envelope', async () => {
      const legacyArray: TestEntity[] = [
        { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(legacyArray));

      const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

      expect(result.version).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Entity',
        value: 42,
      });
      expect(result.updatedAt).toBeDefined();
      
      // Should attempt to upgrade the format (async, don't await)
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const upgradeCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(upgradeCall[0]).toBe(STORAGE_KEY);
      const upgradedEnvelope = JSON.parse(upgradeCall[1]);
      expect(upgradedEnvelope.version).toBe(1);
      expect(upgradedEnvelope.data).toHaveLength(1);
    });

    it('should handle envelope with empty data array', async () => {
      const envelope: StorageEnvelope<TestEntity> = {
        version: 1,
        updatedAt: '2026-01-25T12:00:00.000Z',
        data: [],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

      const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

      expect(result.version).toBe(1);
      expect(result.updatedAt).toBe('2026-01-25T12:00:00.000Z');
      expect(result.data).toHaveLength(0);
    });

    it('should filter out invalid entities', async () => {
      const envelope: StorageEnvelope<unknown> = {
        version: 1,
        updatedAt: '2026-01-25T12:00:00.000Z',
        data: [
          { id: '1', localId: 'uuid-1', name: 'Valid Entity', value: 42 },
          { id: '2', localId: '', name: 'Invalid Entity', value: 0 }, // missing localId
          { id: '3', name: 'Invalid Entity 2', value: 0 }, // missing localId
          null,
          { id: '4', localId: 'uuid-4', name: 'Valid Entity 2', value: 100 },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

      const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Valid Entity');
      expect(result.data[1].name).toBe('Valid Entity 2');
    });

    describe.each([
      {
        description: 'missing version field (defaults to 1)',
        envelope: {
          updatedAt: '2026-01-25T12:00:00.000Z',
          data: [{ id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 }],
        },
        expectedVersion: 1,
      },
      {
        description: 'explicit version 1',
        envelope: {
          version: 1,
          updatedAt: '2026-01-25T12:00:00.000Z',
          data: [{ id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 }],
        },
        expectedVersion: 1,
      },
    ])('should handle envelope with $description', ({ envelope, expectedVersion }) => {
      it('returns envelope with correct version and data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

        const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

        expect(result.version).toBe(expectedVersion);
        expect(result.updatedAt).toBe('2026-01-25T12:00:00.000Z');
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          id: '1',
          localId: 'uuid-1',
          name: 'Test Entity',
          value: 42,
        });
      });
    });

    it('should return default envelope on storage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

      expect(result).toMatchObject({
        version: 1,
        data: [],
      });
    });

    describe('migration scenarios', () => {
      it('should handle envelope with version 1 (no migration needed)', async () => {
        const envelope: StorageEnvelope<TestEntity> = {
          version: 1,
          updatedAt: '2026-01-25T12:00:00.000Z',
          data: [
            { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
          ],
        };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(envelope));

        const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

        expect(result.version).toBe(1);
        expect(result.data).toHaveLength(1);
      });

      it('should return default envelope for future versions (version > 1) and log error', async () => {
        const futureVersionEnvelope = {
          version: 2,
          updatedAt: '2026-01-25T12:00:00.000Z',
          data: [
            { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
          ],
        };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(futureVersionEnvelope));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

        // Migration error is caught and default envelope is returned (graceful degradation)
        expect(result).toMatchObject({
          version: 1,
          data: [],
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error reading entity envelope'),
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('writeEntityEnvelope', () => {
    it('should write valid entities as envelope', async () => {
      const entities: TestEntity[] = [
        { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
      ];

      await writeEntityEnvelope(STORAGE_KEY, entities, validateTestEntity);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"version":1')
      );
      
      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.version).toBe(1);
      expect(writtenData.updatedAt).toBeDefined();
      expect(typeof writtenData.updatedAt).toBe('string');
      expect(writtenData.data).toHaveLength(1);
      expect(writtenData.data[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Entity',
        value: 42,
      });
    });

    it('should throw error when entities are invalid', async () => {
      const invalidEntities: TestEntity[] = [
        { id: '1', localId: '', name: 'Invalid Entity', value: 42 }, // missing localId
      ];

      await expect(
        writeEntityEnvelope(STORAGE_KEY, invalidEntities, validateTestEntity)
      ).rejects.toThrow('Invalid entities detected');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should throw error when input is not an array', async () => {
      const notAnArray = 'not an array' as unknown as TestEntity[];

      await expect(
        writeEntityEnvelope(STORAGE_KEY, notAnArray, validateTestEntity)
      ).rejects.toThrow('Entities must be an array');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should set updatedAt timestamp when writing', async () => {
      const entities: TestEntity[] = [
        { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
      ];
      const beforeWrite = new Date().toISOString();

      await writeEntityEnvelope(STORAGE_KEY, entities, validateTestEntity);

      const afterWrite = new Date().toISOString();
      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.updatedAt).toBeDefined();
      expect(writtenData.updatedAt >= beforeWrite).toBe(true);
      expect(writtenData.updatedAt <= afterWrite).toBe(true);
    });

    it('should throw error when storage operation fails', async () => {
      const entities: TestEntity[] = [
        { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
      ];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(
        writeEntityEnvelope(STORAGE_KEY, entities, validateTestEntity)
      ).rejects.toThrow('Storage error');
    });

    it('should write multiple valid entities', async () => {
      const entities: TestEntity[] = [
        { id: '1', localId: 'uuid-1', name: 'Entity 1', value: 42 },
        { id: '2', localId: 'uuid-2', name: 'Entity 2', value: 100 },
      ];

      await writeEntityEnvelope(STORAGE_KEY, entities, validateTestEntity);

      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.data).toHaveLength(2);
      expect(writtenData.data[0].name).toBe('Entity 1');
      expect(writtenData.data[1].name).toBe('Entity 2');
    });
  });

  describe('round-trip persistence', () => {
    it('should save and retrieve entities correctly with envelope format', async () => {
      const entities: TestEntity[] = [
        { id: '1', localId: 'uuid-1', name: 'Test Entity', value: 42 },
      ];

      // Write
      await writeEntityEnvelope(STORAGE_KEY, entities, validateTestEntity);
      const writtenEnvelope = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);

      // Read
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(writtenEnvelope));
      const result = await readEntityEnvelope(STORAGE_KEY, validateTestEntity);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Entity',
        value: 42,
      });
    });
  });
});
