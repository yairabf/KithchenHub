/**
 * Shared Entity Metadata Types
 * 
 * This file defines standardized metadata interfaces for all domain entities
 * in the Kitchen Hub app, supporting persistence, caching, and merge operations.
 * 
 * Conventions:
 * - Timestamps: In-memory as `Date`, persisted as ISO string. Types allow `Date | string`.
 * - Soft-delete: `deletedAt` is present only when entity is deleted (tombstone pattern).
 *   Active entities have `deletedAt` omitted/undefined.
 * - All timestamps are optional to support gradual migration and legacy data.
 */

/**
 * Entity timestamp metadata.
 * 
 * In-memory representation uses `Date` objects for easy manipulation.
 * When persisting to storage or sending over network, convert to ISO strings.
 */
export interface EntityTimestamps {
  /**
   * Timestamp when the entity was created.
   * - In-memory: Date object
   * - Persisted: ISO 8601 string (e.g., "2026-01-25T12:34:56.789Z")
   */
  createdAt?: Date | string;

  /**
   * Timestamp when the entity was last updated.
   * - In-memory: Date object
   * - Persisted: ISO 8601 string (e.g., "2026-01-25T12:34:56.789Z")
   */
  updatedAt?: Date | string;

  /**
   * Timestamp when the entity was soft-deleted (tombstone pattern).
   * - When present: entity is considered deleted
   * - When omitted/undefined: entity is active
   * - In-memory: Date object
   * - Persisted: ISO 8601 string (e.g., "2026-01-25T12:34:56.789Z")
   */
  deletedAt?: Date | string;
}

/**
 * Base entity interface combining identity and timestamps.
 * 
 * All domain entities should extend this interface to ensure consistent
 * metadata for persistence operations, conflict resolution, and soft-deletes.
 */
export interface BaseEntity extends EntityTimestamps {
  /**
   * Legacy/Display ID - may be numeric or string-based sequential ID.
   * Used for UI display and backward compatibility.
   */
  id: string;

  /**
   * Stable UUID for tracking entities across systems.
   * This ID never changes and is used for sync, merge, and reference operations.
   */
  localId: string;
}

/**
 * Validates if a string is a valid ISO 8601 timestamp.
 */
function isValidISOString(dateString: string): boolean {
  if (!dateString || dateString.trim().length === 0) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Safely converts a string to Date, throwing descriptive error on invalid input.
 * 
 * @internal Exported for use in timestamp serialization helpers
 */
export function parseTimestampSafely(
  timestamp: string | Date | undefined,
  fieldName: string
): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) {
    // Validate that the Date object is valid
    if (isNaN(timestamp.getTime())) {
      throw new Error(
        `Invalid Date object for ${fieldName}: Date is NaN. ` +
        `Ensure the Date was created with valid input.`
      );
    }
    return timestamp;
  }

  if (!isValidISOString(timestamp)) {
    throw new Error(
      `Invalid ISO 8601 timestamp for ${fieldName}: "${timestamp}". ` +
      `Expected format: YYYY-MM-DDTHH:mm:ss.sssZ (e.g., "2026-01-25T12:34:56.789Z")`
    );
  }

  return new Date(timestamp);
}

/**
 * Type guard to check if an entity is soft-deleted.
 * An entity is deleted if deletedAt contains a valid Date or ISO string.
 */
export function isEntityDeleted(entity: EntityTimestamps): boolean {
  const { deletedAt } = entity;

  // Explicitly check for invalid deletion states
  if (deletedAt === undefined || deletedAt === null || deletedAt === '') {
    return false;
  }

  // If it's a Date, check if it's valid
  if (deletedAt instanceof Date) {
    return !isNaN(deletedAt.getTime());
  }

  // If it's a string, validate it's a proper ISO timestamp
  return typeof deletedAt === 'string' && deletedAt.length > 0;
}

/**
 * Type guard to check if an entity is active (not deleted).
 */
export function isEntityActive(entity: EntityTimestamps): boolean {
  return !isEntityDeleted(entity);
}

/**
 * Helper to convert timestamp fields from Date to ISO string for persistence.
 * Returns a new object with timestamps serialized (immutable).
 * Optimized to avoid unnecessary object spread when no conversion is needed.
 * 
 * @returns Object with timestamp fields as ISO strings (Date → string)
 */
export function toPersistedTimestamps<T extends EntityTimestamps>(entity: T): T {
  // Check if any conversion is needed
  const needsConversion =
    entity.createdAt instanceof Date ||
    entity.updatedAt instanceof Date ||
    entity.deletedAt instanceof Date;

  // Return as-is if no conversion needed (performance optimization)
  if (!needsConversion) {
    return entity;
  }

  // Only spread and convert when necessary
  return {
    ...entity,
    createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
    updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
    deletedAt: entity.deletedAt instanceof Date ? entity.deletedAt.toISOString() : entity.deletedAt,
  };
}

/**
 * Helper to convert timestamp fields from ISO string to Date for in-memory use.
 * Validates timestamp strings and throws descriptive errors for invalid input.
 * 
 * @returns Object with timestamp fields as Date objects (string → Date)
 * @throws {Error} If any timestamp string is invalid ISO 8601 format
 */
export function fromPersistedTimestamps<T extends EntityTimestamps>(entity: T): T {
  return {
    ...entity,
    createdAt: parseTimestampSafely(entity.createdAt, 'createdAt'),
    updatedAt: parseTimestampSafely(entity.updatedAt, 'updatedAt'),
    deletedAt: parseTimestampSafely(entity.deletedAt, 'deletedAt'),
  };
}

/**
 * @deprecated Use toPersistedTimestamps instead
 * @alias toPersistedTimestamps
 */
export const serializeTimestamps = toPersistedTimestamps;

/**
 * @deprecated Use fromPersistedTimestamps instead
 * @alias fromPersistedTimestamps
 */
export const deserializeTimestamps = fromPersistedTimestamps;
