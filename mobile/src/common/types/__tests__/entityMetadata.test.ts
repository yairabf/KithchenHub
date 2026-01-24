/**
 * Entity Metadata Tests
 * 
 * Tests for shared entity metadata interfaces, type guards, and helper functions.
 */

import {
  EntityTimestamps,
  BaseEntity,
  isEntityDeleted,
  isEntityActive,
  serializeTimestamps,
  deserializeTimestamps,
} from '../entityMetadata';

describe('EntityTimestamps', () => {
  it('should allow Date objects for timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow string timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    expect(typeof entity.createdAt).toBe('string');
    expect(typeof entity.updatedAt).toBe('string');
  });

  it('should allow mixed Date and string timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(typeof entity.updatedAt).toBe('string');
  });

  it('should allow all timestamp fields to be optional', () => {
    const entity: EntityTimestamps = {};

    expect(entity.createdAt).toBeUndefined();
    expect(entity.updatedAt).toBeUndefined();
    expect(entity.deletedAt).toBeUndefined();
  });
});

describe('BaseEntity', () => {
  it('should include id and localId fields', () => {
    const entity: BaseEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
    };

    expect(entity.id).toBe('123');
    expect(entity.localId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should extend EntityTimestamps', () => {
    const entity: BaseEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });
});

describe('isEntityDeleted', () => {
  it('should return true when deletedAt is a Date', () => {
    const entity: EntityTimestamps = {
      deletedAt: new Date('2026-01-25T14:00:00.000Z'),
    };

    expect(isEntityDeleted(entity)).toBe(true);
  });

  it('should return true when deletedAt is a string', () => {
    const entity: EntityTimestamps = {
      deletedAt: '2026-01-25T14:00:00.000Z',
    };

    expect(isEntityDeleted(entity)).toBe(true);
  });

  it('should return false when deletedAt is undefined', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    expect(isEntityDeleted(entity)).toBe(false);
  });

  it('should return false when deletedAt is null', () => {
    const entity: EntityTimestamps = {
      deletedAt: null as any,
    };

    expect(isEntityDeleted(entity)).toBe(false);
  });
});

describe('isEntityActive', () => {
  it('should return true when deletedAt is undefined', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    expect(isEntityActive(entity)).toBe(true);
  });

  it('should return false when deletedAt is a Date', () => {
    const entity: EntityTimestamps = {
      deletedAt: new Date('2026-01-25T14:00:00.000Z'),
    };

    expect(isEntityActive(entity)).toBe(false);
  });

  it('should return false when deletedAt is a string', () => {
    const entity: EntityTimestamps = {
      deletedAt: '2026-01-25T14:00:00.000Z',
    };

    expect(isEntityActive(entity)).toBe(false);
  });
});

describe('serializeTimestamps', () => {
  it('should convert Date timestamps to ISO strings', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    const serialized = serializeTimestamps(entity);

    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
    expect(serialized.updatedAt).toBe('2026-01-25T13:00:00.000Z');
  });

  it('should preserve string timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    const serialized = serializeTimestamps(entity);

    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
    expect(serialized.updatedAt).toBe('2026-01-25T13:00:00.000Z');
  });

  it('should handle mixed Date and string timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    const serialized = serializeTimestamps(entity);

    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
    expect(serialized.updatedAt).toBe('2026-01-25T13:00:00.000Z');
  });

  it('should handle deletedAt timestamp', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      deletedAt: new Date('2026-01-25T14:00:00.000Z'),
    };

    const serialized = serializeTimestamps(entity);

    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
    expect(serialized.deletedAt).toBe('2026-01-25T14:00:00.000Z');
  });

  it('should preserve undefined timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    const serialized = serializeTimestamps(entity);

    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
    expect(serialized.updatedAt).toBeUndefined();
    expect(serialized.deletedAt).toBeUndefined();
  });

  it('should preserve other entity properties', () => {
    interface TestEntity extends BaseEntity {
      name: string;
      value: number;
    }

    const entity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      value: 42,
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
    };

    const serialized = serializeTimestamps(entity);

    expect(serialized.id).toBe('123');
    expect(serialized.localId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(serialized.name).toBe('Test Entity');
    expect(serialized.value).toBe(42);
    expect(serialized.createdAt).toBe('2026-01-25T12:00:00.000Z');
  });
});

describe('deserializeTimestamps', () => {
  it('should convert ISO string timestamps to Date objects', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    const deserialized = deserializeTimestamps(entity);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.updatedAt).toBeInstanceOf(Date);
    expect((deserialized.createdAt as Date).toISOString()).toBe('2026-01-25T12:00:00.000Z');
    expect((deserialized.updatedAt as Date).toISOString()).toBe('2026-01-25T13:00:00.000Z');
  });

  it('should preserve Date timestamps', () => {
    const createdDate = new Date('2026-01-25T12:00:00.000Z');
    const updatedDate = new Date('2026-01-25T13:00:00.000Z');
    
    const entity: EntityTimestamps = {
      createdAt: createdDate,
      updatedAt: updatedDate,
    };

    const deserialized = deserializeTimestamps(entity);

    expect(deserialized.createdAt).toBe(createdDate);
    expect(deserialized.updatedAt).toBe(updatedDate);
  });

  it('should handle mixed string and Date timestamps', () => {
    const updatedDate = new Date('2026-01-25T13:00:00.000Z');
    
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: updatedDate,
    };

    const deserialized = deserializeTimestamps(entity);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.updatedAt).toBe(updatedDate);
  });

  it('should handle deletedAt timestamp', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      deletedAt: '2026-01-25T14:00:00.000Z',
    };

    const deserialized = deserializeTimestamps(entity);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.deletedAt).toBeInstanceOf(Date);
    expect((deserialized.deletedAt as Date).toISOString()).toBe('2026-01-25T14:00:00.000Z');
  });

  it('should preserve undefined timestamps', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
    };

    const deserialized = deserializeTimestamps(entity);

    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.updatedAt).toBeUndefined();
    expect(deserialized.deletedAt).toBeUndefined();
  });

  it('should preserve other entity properties', () => {
    interface TestEntity extends BaseEntity {
      name: string;
      value: number;
    }

    const entity: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      value: 42,
      createdAt: '2026-01-25T12:00:00.000Z',
    };

    const deserialized = deserializeTimestamps(entity);

    expect(deserialized.id).toBe('123');
    expect(deserialized.localId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(deserialized.name).toBe('Test Entity');
    expect(deserialized.value).toBe(42);
    expect(deserialized.createdAt).toBeInstanceOf(Date);
  });
});

describe('serializeTimestamps and deserializeTimestamps round-trip', () => {
  it('should maintain data integrity through serialization and deserialization', () => {
    interface TestEntity extends BaseEntity {
      name: string;
    }

    const original: TestEntity = {
      id: '123',
      localId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Entity',
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: new Date('2026-01-25T13:00:00.000Z'),
    };

    // Serialize (for persistence)
    const serialized = serializeTimestamps(original);
    
    // Deserialize (when loading from storage)
    const deserialized = deserializeTimestamps(serialized);

    expect(deserialized.id).toBe(original.id);
    expect(deserialized.localId).toBe(original.localId);
    expect(deserialized.name).toBe(original.name);
    expect((deserialized.createdAt as Date).getTime()).toBe((original.createdAt as Date).getTime());
    expect((deserialized.updatedAt as Date).getTime()).toBe((original.updatedAt as Date).getTime());
  });
});

describe('deserializeTimestamps - error handling', () => {
  it('should throw error for invalid ISO string', () => {
    const entity: EntityTimestamps = {
      createdAt: 'not-a-date',
    };

    expect(() => deserializeTimestamps(entity)).toThrow('Invalid ISO 8601 timestamp');
    expect(() => deserializeTimestamps(entity)).toThrow('createdAt');
  });

  it('should throw error for partial date string (missing time)', () => {
    const entity: EntityTimestamps = {
      updatedAt: '2026-01-25',
    };

    expect(() => deserializeTimestamps(entity)).toThrow('Invalid ISO 8601 timestamp');
    expect(() => deserializeTimestamps(entity)).toThrow('updatedAt');
  });

  it('should handle empty string as undefined', () => {
    const entity: EntityTimestamps = {
      createdAt: '',
    };

    const result = deserializeTimestamps(entity);
    expect(result.createdAt).toBeUndefined();
  });

  it('should throw error for malformed ISO string', () => {
    const entity: EntityTimestamps = {
      deletedAt: '2026-13-45T99:99:99.999Z', // Invalid month, day, hours
    };

    expect(() => deserializeTimestamps(entity)).toThrow('Invalid ISO 8601 timestamp');
  });

  it('should throw error for Date object with NaN timestamp', () => {
    const invalidDate = new Date('invalid');
    const entity: EntityTimestamps = {
      createdAt: invalidDate,
    };

    expect(() => deserializeTimestamps(entity)).toThrow('Invalid Date object');
    expect(() => deserializeTimestamps(entity)).toThrow('Date is NaN');
  });
});

describe('isEntityDeleted - edge cases', () => {
  it('should return false for empty string deletedAt', () => {
    const entity: EntityTimestamps = {
      deletedAt: '',
    };

    expect(isEntityDeleted(entity)).toBe(false);
  });

  it('should return false for invalid Date object', () => {
    const entity: EntityTimestamps = {
      deletedAt: new Date('invalid'),
    };

    expect(isEntityDeleted(entity)).toBe(false);
  });

  it('should return true for valid Date object', () => {
    const entity: EntityTimestamps = {
      deletedAt: new Date('2026-01-25T14:00:00.000Z'),
    };

    expect(isEntityDeleted(entity)).toBe(true);
  });

  it('should return true for non-empty string (truthy)', () => {
    const entity: EntityTimestamps = {
      deletedAt: '2026-01-25T14:00:00.000Z',
    };

    expect(isEntityDeleted(entity)).toBe(true);
  });
});

describe('serializeTimestamps - performance optimization', () => {
  it('should return same object reference when no conversion needed', () => {
    const entity: EntityTimestamps = {
      createdAt: '2026-01-25T12:00:00.000Z',
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    const result = serializeTimestamps(entity);
    
    // Should be the same reference (performance optimization)
    expect(result).toBe(entity);
  });

  it('should return new object when conversion is needed', () => {
    const entity: EntityTimestamps = {
      createdAt: new Date('2026-01-25T12:00:00.000Z'),
      updatedAt: '2026-01-25T13:00:00.000Z',
    };

    const result = serializeTimestamps(entity);
    
    // Should be a different reference (conversion happened)
    expect(result).not.toBe(entity);
    expect(result.createdAt).toBe('2026-01-25T12:00:00.000Z');
  });
});
