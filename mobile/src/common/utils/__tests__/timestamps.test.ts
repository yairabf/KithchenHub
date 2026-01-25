/**
 * Timestamp Serialization and Business Logic Tests
 * 
 * Tests for Supabase serialization helpers and service-level timestamp helpers.
 */

import {
  toSupabaseTimestamps,
  fromSupabaseTimestamps,
  withCreatedAt,
  withUpdatedAt,
  markDeleted,
} from '../timestamps';
import { EntityTimestamps } from '../../types/entityMetadata';

describe('toSupabaseTimestamps', () => {
  it('should convert camelCase to snake_case and Date to ISO string', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const result = toSupabaseTimestamps(entity);

    expect(result.created_at).toBe('2026-01-25T12:00:00.000Z');
    expect(result.updated_at).toBe('2026-01-25T13:00:00.000Z');
    expect(result.createdAt).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
    expect(typeof result.created_at).toBe('string');
    expect(typeof result.updated_at).toBe('string');
  });

  it('should handle string timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    const result = toSupabaseTimestamps(entity);

    expect(result.created_at).toBe('2026-01-25T12:00:00.000Z');
    expect(result.updated_at).toBe('2026-01-25T13:00:00.000Z');
  });

  it('should omit deleted_at for active records', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
      // deletedAt is undefined (active record)
    };

    const result = toSupabaseTimestamps(entity);

    expect(result.deleted_at).toBeUndefined();
    expect('deleted_at' in result).toBe(false);
  });

  it('should include deleted_at for deleted records', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      deletedAt: new Date('2026-01-25T14:00:00.000Z'),
    };

    const result = toSupabaseTimestamps(entity);

    expect(result.deleted_at).toBe('2026-01-25T14:00:00.000Z');
  });

  it('should preserve other entity properties', () => {
    interface TestEntity extends EntityTimestamps {
      id: string;
      name: string;
    }

    const entity: TestEntity = {
      id: '123',
      name: 'Test Entity',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    const result = toSupabaseTimestamps(entity);

    expect(result.id).toBe('123');
    expect(result.name).toBe('Test Entity');
    expect(result.created_at).toBe('2026-01-25T12:00:00.000Z');
  });
});

describe('fromSupabaseTimestamps', () => {
  it('should convert snake_case to camelCase and ISO string to Date', () => {
    const entity = {
      created_at: '2026-01-25T12:00:00.000Z',
      updated_at: '2026-01-25T13:00:00.000Z',
    };

    const result = fromSupabaseTimestamps(entity);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect((result.createdAt as Date).toISOString()).toBe('2026-01-25T12:00:00.000Z');
    expect((result.updatedAt as Date).toISOString()).toBe('2026-01-25T13:00:00.000Z');
    expect(result.created_at).toBeUndefined();
    expect(result.updated_at).toBeUndefined();
  });

  it('should handle deleted_at', () => {
    const entity = {
      created_at: '2026-01-25T12:00:00.000Z',
      deleted_at: '2026-01-25T14:00:00.000Z',
    };

    const result = fromSupabaseTimestamps(entity);

    expect(result.deletedAt).toBeInstanceOf(Date);
    expect((result.deletedAt as Date).toISOString()).toBe('2026-01-25T14:00:00.000Z');
  });

  it('should preserve other entity properties', () => {
    interface TestEntity {
      id: string;
      name: string;
      created_at: string;
    }

    const entity: TestEntity = {
      id: '123',
      name: 'Test Entity',
      created_at: '2026-01-25T12:00:00.000Z',
    };

    const result = fromSupabaseTimestamps(entity);

    expect(result.id).toBe('123');
    expect(result.name).toBe('Test Entity');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error for invalid ISO string', () => {
    const entity = {
      created_at: 'not-a-date',
    };

    expect(() => fromSupabaseTimestamps(entity)).toThrow('Invalid ISO 8601 timestamp');
    expect(() => fromSupabaseTimestamps(entity)).toThrow('created_at');
  });
});

describe('toSupabaseTimestamps and fromSupabaseTimestamps round-trip', () => {
  it('should maintain data integrity through conversion', () => {
    interface TestEntity extends EntityTimestamps {
      id: string;
      name: string;
    }

    const original: TestEntity = {
      id: '123',
      name: 'Test Entity',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    // Convert to Supabase format
    const supabaseFormat = toSupabaseTimestamps(original);
    
    // Convert back from Supabase format
    const restored = fromSupabaseTimestamps(supabaseFormat);

    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect((restored.createdAt as Date).getTime()).toBe((original.createdAt as Date).getTime());
    expect((restored.updatedAt as Date).getTime()).toBe((original.updatedAt as Date).getTime());
  });
});

describe('withCreatedAt', () => {
  it('should populate missing createdAt', () => {
    const entity: EntityTimestamps = {
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const result = withCreatedAt(entity);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBe(entity.updatedAt);
  });

  it('should not overwrite existing createdAt', () => {
    const existingDate = new Date('2026-01-25T12:00:00.000Z');
    const entity: EntityTimestamps = {
      createdAt: existingDate,
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const result = withCreatedAt(entity);

    expect(result.createdAt).toBe(existingDate); // Should be same reference
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should use provided timestamp', () => {
    const providedDate = new Date('2026-01-25T10:00:00.000Z');
    const entity: EntityTimestamps = {};

    const result = withCreatedAt(entity, providedDate);

    expect(result.createdAt).toBe(providedDate);
  });

  it('should return new object (immutability)', () => {
    const entity: EntityTimestamps = {};

    const result = withCreatedAt(entity);

    expect(result).not.toBe(entity);
  });
});

describe('withUpdatedAt', () => {
  it('should always update updatedAt', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const result = withUpdatedAt(entity);

    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt).not.toBe(entity.updatedAt);
    expect(result.createdAt).toBe(entity.createdAt);
  });

  it('should overwrite existing updatedAt', () => {
    const oldDate = new Date('2020-01-01T00:00:00.000Z'); // Use a date in the past
    const entity: EntityTimestamps = {
      updatedAt: oldDate,
    };

    const result = withUpdatedAt(entity);

    expect(result.updatedAt).not.toBe(oldDate);
    expect(result.updatedAt).toBeInstanceOf(Date);
    // Verify it's a new Date (should be greater since oldDate is in the past)
    expect((result.updatedAt as Date).getTime()).toBeGreaterThan(oldDate.getTime());
  });

  it('should use provided timestamp', () => {
    const providedDate = new Date('2026-01-25T15:00:00.000Z');
    const entity: EntityTimestamps = {
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const result = withUpdatedAt(entity, providedDate);

    expect(result.updatedAt).toBe(providedDate);
  });

  it('should return new object (immutability)', () => {
    const entity: EntityTimestamps = {};

    const result = withUpdatedAt(entity);

    expect(result).not.toBe(entity);
  });
});

describe('markDeleted', () => {
  it('should set deletedAt and preserve other timestamps', () => {
    const createdAt = new Date('2026-01-25T12:00:00.000Z');
    const updatedAt = new Date('2026-01-25T13:00:00.000Z');
    const entity: EntityTimestamps = {
      createdAt,
      updatedAt,
    };

    const result = markDeleted(entity);

    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(result.createdAt).toBe(createdAt);
    expect(result.updatedAt).toBe(updatedAt);
  });

  it('should be idempotent (can be called multiple times)', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    const result1 = markDeleted(entity);
    const result2 = markDeleted(result1);

    expect(result2.deletedAt).toBeInstanceOf(Date);
    expect(result2.createdAt).toBe(entity.createdAt);
  });

  it('should use provided timestamp', () => {
    const providedDate = new Date('2026-01-25T14:00:00.000Z');
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    const result = markDeleted(entity, providedDate);

    expect(result.deletedAt).toBe(providedDate);
  });

  it('should return new object (immutability)', () => {
    const entity: EntityTimestamps = {};

    const result = markDeleted(entity);

    expect(result).not.toBe(entity);
  });
});

describe('Integration: Factory create timestamp population', () => {
  it('should populate createdAt when entity is created via factory', () => {
    interface TestEntity extends EntityTimestamps {
      id: string;
      name: string;
    }

    const entity: TestEntity = {
      id: '123',
      name: 'Test Entity',
      // createdAt is missing
    };

    const result = withCreatedAt(entity);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.id).toBe('123');
    expect(result.name).toBe('Test Entity');
  });
});

describe('Integration: Service update timestamp changes', () => {
  it('should update updatedAt while preserving createdAt', () => {
    interface TestEntity extends EntityTimestamps {
      id: string;
      name: string;
    }

    const originalCreatedAt = new Date('2026-01-25T12:00:00.000Z');
    const originalUpdatedAt = new Date('2020-01-01T00:00:00.000Z'); // Use a date in the past
    const entity: TestEntity = {
      id: '123',
      name: 'Test Entity',
      createdAt: originalCreatedAt,
      updatedAt: originalUpdatedAt,
    };

    const updated = { ...entity, name: 'Updated Name' };
    const result = withUpdatedAt(updated);

    expect(result.createdAt).toBe(originalCreatedAt);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt).not.toBe(originalUpdatedAt);
    // Verify it's a new Date (should be greater since originalUpdatedAt is in the past)
    expect((result.updatedAt as Date).getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.name).toBe('Updated Name');
  });
});

describe('Integration: Service delete timestamp changes', () => {
  it('should set deletedAt and retain tombstone (createdAt, updatedAt)', () => {
    interface TestEntity extends EntityTimestamps {
      id: string;
      name: string;
    }

    const originalCreatedAt = new Date('2026-01-25T12:00:00.000Z');
    const originalUpdatedAt = new Date('2026-01-25T13:00:00.000Z');
    const entity: TestEntity = {
      id: '123',
      name: 'Test Entity',
      createdAt: originalCreatedAt,
      updatedAt: originalUpdatedAt,
    };

    const result = markDeleted(entity);

    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(result.createdAt).toBe(originalCreatedAt);
    expect(result.updatedAt).toBe(originalUpdatedAt);
    expect(result.id).toBe('123');
    expect(result.name).toBe('Test Entity');
  });
});
