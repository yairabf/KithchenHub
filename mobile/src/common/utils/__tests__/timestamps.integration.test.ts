/**
 * Timestamp Integration Tests
 * 
 * End-to-end tests for timestamp handling across the persistence layer:
 * - Insert populates createdAt/updatedAt
 * - Update changes updatedAt
 * - Delete sets deletedAt and retains tombstone
 * - AsyncStorage round-trip serialization
 * - Supabase round-trip serialization
 */

import {
  withCreatedAt,
  withUpdatedAt,
  markDeleted,
  toSupabaseTimestamps,
  fromSupabaseTimestamps,
} from '../timestamps';
import {
  toPersistedTimestamps,
  fromPersistedTimestamps,
  EntityTimestamps,
  BaseEntity,
} from '../../types/entityMetadata';

// Mock AsyncStorage for round-trip tests
const mockAsyncStorage: Record<string, string> = {};

const mockAsyncStorageAPI = {
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStorage[key];
    return Promise.resolve();
  }),
};

// Test entity type
interface TestEntity extends BaseEntity {
  name: string;
  value?: number;
}

describe('Integration: Insert populates createdAt/updatedAt', () => {
  describe.each([
    [
      'populate createdAt when entity is created without timestamps',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
      } as TestEntity,
      (result: TestEntity) => {
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeUndefined();
        expect(result.deletedAt).toBeUndefined();
        expect(result.name).toBe('Test Entity');
      },
    ],
    [
      'not overwrite existing createdAt',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
      } as TestEntity,
      (result: TestEntity, original: TestEntity) => {
        expect(result.createdAt).toBe(original.createdAt);
        expect(result.updatedAt).toBeUndefined();
      },
    ],
    [
      'not set updatedAt on creation',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
      } as TestEntity,
      (result: TestEntity) => {
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeUndefined();
      },
    ],
  ])('should %s', (description, entity, assertion) => {
    it(`should ${description}`, () => {
      const withTimestamps = withCreatedAt(entity);
      assertion(withTimestamps, entity);
    });
  });
});

describe('Integration: Update changes updatedAt', () => {
  describe.each([
    [
      'update updatedAt while preserving createdAt',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
        updatedAt: new Date('2026-01-25T13:00:00.000Z'),
      } as TestEntity,
      { name: 'Updated Name' },
      (result: TestEntity, original: TestEntity) => {
        expect(result.createdAt).toBe(original.createdAt);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.updatedAt).not.toBe(original.updatedAt);
        expect((result.updatedAt as Date).getTime()).toBeGreaterThan((original.updatedAt as Date).getTime());
        expect(result.name).toBe('Updated Name');
      },
    ],
    [
      'set updatedAt even if it was previously undefined',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
      } as TestEntity,
      { name: 'Updated Name' },
      (result: TestEntity, original: TestEntity) => {
        expect(result.createdAt).toBe(original.createdAt);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeDefined();
      },
    ],
  ])('should %s', (description, entity, updates, assertion) => {
    it(`should ${description}`, () => {
      const updated = { ...entity, ...updates };
      const withTimestamps = withUpdatedAt(updated);
      assertion(withTimestamps, entity);
    });
  });
});

describe('Integration: Delete sets deletedAt and retains tombstone', () => {
  describe.each([
    [
      'set deletedAt and preserve createdAt and updatedAt',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
        updatedAt: new Date('2026-01-25T13:00:00.000Z'),
      } as TestEntity,
      (result: TestEntity, original: TestEntity) => {
        expect(result.deletedAt).toBeInstanceOf(Date);
        expect(result.createdAt).toBe(original.createdAt);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.updatedAt).not.toBe(original.updatedAt);
        expect((result.updatedAt as Date).getTime()).toBeGreaterThan((original.updatedAt as Date).getTime());
        expect(result.name).toBe('Test Entity');
        expect(result.id).toBe('123');
      },
    ],
    [
      'preserve all entity properties when marking as deleted',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        value: 42,
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
      } as TestEntity,
      (result: TestEntity, original: TestEntity) => {
        expect(result.id).toBe(original.id);
        expect(result.localId).toBe(original.localId);
        expect(result.name).toBe(original.name);
        expect(result.value).toBe(original.value);
        expect(result.deletedAt).toBeDefined();
      },
    ],
  ])('should %s', (description, entity, assertion) => {
    it(`should ${description}`, () => {
      const deleted = markDeleted(entity);
      const withTimestamps = withUpdatedAt(deleted);
      assertion(withTimestamps, entity);
    });
  });
});

describe('Integration: AsyncStorage round-trip', () => {
  beforeEach(() => {
    mockAsyncStorageAPI.getItem.mockClear();
    mockAsyncStorageAPI.setItem.mockClear();
    Object.keys(mockAsyncStorage).forEach(key => delete mockAsyncStorage[key]);
  });

  it('should preserve timestamps through serialization and deserialization', async () => {
    const originalEntity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    // Serialize for storage
    const serialized = toPersistedTimestamps(originalEntity);
    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
    expect(serialized.updatedAt).toBe('2026-01-25T13:00:00.000Z');

    // Store in mock AsyncStorage
    const storageKey = '@test_entity';
    await mockAsyncStorageAPI.setItem(storageKey, JSON.stringify(serialized));

    // Read from storage
    const stored = await mockAsyncStorageAPI.getItem(storageKey);
    expect(stored).not.toBeNull();

    // Deserialize
    const parsed = JSON.parse(stored!);
    const deserialized = fromPersistedTimestamps(parsed);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.updatedAt).toBeInstanceOf(Date);
    expect((deserialized.createdAt as Date).toISOString()).toBe('2026-01-25T12:00:00.000Z');
    expect((deserialized.updatedAt as Date).toISOString()).toBe('2026-01-25T13:00:00.000Z');
    expect(deserialized.id).toBe('123');
    expect(deserialized.name).toBe('Test Entity');
  });

  it('should handle deletedAt in round-trip', async () => {
    const originalEntity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      deletedAt: new Date('2026-01-25T14:00:00.000Z'),
    };

    // Serialize
    const serialized = toPersistedTimestamps(originalEntity);
    expect(serialized.deletedAt).toBe('2026-01-25T14:00:00.000Z');

    // Store and retrieve
    const storageKey = '@test_entity';
    await mockAsyncStorageAPI.setItem(storageKey, JSON.stringify(serialized));
    const stored = await mockAsyncStorageAPI.getItem(storageKey);
    const parsed = JSON.parse(stored!);

    // Deserialize
    const deserialized = fromPersistedTimestamps(parsed);

    expect(deserialized.deletedAt).toBeInstanceOf(Date);
    expect((deserialized.deletedAt as Date).toISOString()).toBe('2026-01-25T14:00:00.000Z');
  });
});

describe('Integration: Supabase round-trip', () => {
  it('should convert to snake_case and back to camelCase', () => {
    const originalEntity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    // Convert to Supabase format
    const supabaseFormat = toSupabaseTimestamps(originalEntity);

    expect(supabaseFormat.created_at).toBe('2026-01-25T12:00:00.000Z');
    expect(supabaseFormat.updated_at).toBe('2026-01-25T13:00:00.000Z');
    // Verify camelCase fields are removed
    expect('createdAt' in supabaseFormat).toBe(false);
    expect('updatedAt' in supabaseFormat).toBe(false);
    // Type assertion to access entity properties (name is preserved in supabase format)
    const supabaseEntity = supabaseFormat as unknown as TestEntity;
    expect(supabaseEntity.name).toBe('Test Entity');

    // Convert back from Supabase format
    const restored = fromSupabaseTimestamps(supabaseFormat);

    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.updatedAt).toBeInstanceOf(Date);
    expect((restored.createdAt as Date).toISOString()).toBe('2026-01-25T12:00:00.000Z');
    expect((restored.updatedAt as Date).toISOString()).toBe('2026-01-25T13:00:00.000Z');
    const restoredEntity = restored as TestEntity & EntityTimestamps;
    expect('created_at' in restoredEntity).toBe(false);
    expect('updated_at' in restoredEntity).toBe(false);
  });

  describe.each([
    [
      'omit deleted_at for active records',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
        // deletedAt is undefined (active record)
      } as TestEntity,
      (result: ReturnType<typeof toSupabaseTimestamps>) => {
        expect(result.deleted_at).toBeUndefined();
        expect('deleted_at' in result).toBe(false);
      },
    ],
    [
      'include deleted_at for deleted records',
      {
        id: '123',
        localId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
        deletedAt: new Date('2026-01-25T14:00:00.000Z'),
      } as TestEntity,
      (result: ReturnType<typeof toSupabaseTimestamps>) => {
        expect(result.deleted_at).toBe('2026-01-25T14:00:00.000Z');
      },
    ],
  ])('should %s in Supabase format', (description, entity, assertion) => {
    it(`should ${description}`, () => {
      const supabaseFormat = toSupabaseTimestamps(entity);
      assertion(supabaseFormat);
    });
  });

  it('should preserve all entity properties through Supabase round-trip', () => {
    const originalEntity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      value: 42,
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const supabaseFormat = toSupabaseTimestamps(originalEntity);
    const restored = fromSupabaseTimestamps(supabaseFormat);
    const restoredEntity = restored as TestEntity & EntityTimestamps;

    expect(restoredEntity.id).toBe('123');
    expect(restoredEntity.localId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(restoredEntity.name).toBe('Test Entity');
    expect(restoredEntity.value).toBe(42);
    expect(restoredEntity.createdAt).toBeInstanceOf(Date);
    expect(restoredEntity.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Integration: Complete CRUD flow with timestamps', () => {
  it('should handle full create-update-delete flow with proper timestamps', async () => {
    // Create
    const newEntity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'New Entity',
    };
    const created = withCreatedAt(newEntity);
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeUndefined();

    const createdAt = created.createdAt as Date;

    // Small delay to ensure updatedAt is different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update
    const updated = { ...created, name: 'Updated Entity' };
    const withUpdateTimestamp = withUpdatedAt(updated);
    expect(withUpdateTimestamp.createdAt).toBe(createdAt);
    expect(withUpdateTimestamp.updatedAt).toBeDefined();
    expect((withUpdateTimestamp.updatedAt as Date).getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
    expect(withUpdateTimestamp.name).toBe('Updated Entity');

    const updatedAt = withUpdateTimestamp.updatedAt as Date;

    // Small delay to ensure delete timestamp is different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Delete
    const deleted = markDeleted(withUpdateTimestamp);
    const withDeleteTimestamp = withUpdatedAt(deleted);
    expect(withDeleteTimestamp.createdAt).toBe(createdAt);
    expect(withDeleteTimestamp.updatedAt).toBeDefined();
    expect((withDeleteTimestamp.updatedAt as Date).getTime()).toBeGreaterThanOrEqual(updatedAt.getTime());
    expect(withDeleteTimestamp.deletedAt).toBeDefined();
    expect((withDeleteTimestamp.deletedAt as Date).getTime()).toBeGreaterThanOrEqual(updatedAt.getTime());
    expect(withDeleteTimestamp.name).toBe('Updated Entity');
  });
});
