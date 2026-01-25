/**
 * Timestamp Serialization and Business Logic Helpers
 * 
 * This file contains transport/persistence concerns for timestamp handling:
 * - Supabase serialization (camelCase ↔ snake_case column mapping)
 * - Service-level business logic helpers (auto-populate timestamps, soft-delete)
 * 
 * Note: Basic serialization helpers (Date ↔ ISO string) are in entityMetadata.ts
 */

import { EntityTimestamps } from '../types/entityMetadata';
import { parseTimestampSafely } from '../types/entityMetadata';

/**
 * Converts entity timestamps from camelCase to snake_case for Supabase persistence.
 * Also converts Date objects to ISO strings.
 * 
 * @param entity - Entity with camelCase timestamp fields
 * @returns Object with snake_case timestamp fields as ISO strings
 * @remarks
 * - Maps createdAt → created_at
 * - Maps updatedAt → updated_at
 * - Maps deletedAt → deleted_at (omitted if undefined/null for active records)
 * - Converts Date objects to ISO strings
 * - Omit deleted_at entirely for active records (not null)
 */
export function toSupabaseTimestamps<T extends EntityTimestamps>(entity: T): Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
} {
  const result: Record<string, unknown> = { ...entity };
  
  // Convert and map createdAt → created_at
  if (entity.createdAt !== undefined && entity.createdAt !== null) {
    result.created_at = entity.createdAt instanceof Date 
      ? entity.createdAt.toISOString() 
      : entity.createdAt;
  }
  
  // Convert and map updatedAt → updated_at
  if (entity.updatedAt !== undefined && entity.updatedAt !== null) {
    result.updated_at = entity.updatedAt instanceof Date 
      ? entity.updatedAt.toISOString() 
      : entity.updatedAt;
  }
  
  // Convert and map deletedAt → deleted_at (only if present - omit for active records)
  if (entity.deletedAt !== undefined && entity.deletedAt !== null && entity.deletedAt !== '') {
    result.deleted_at = entity.deletedAt instanceof Date 
      ? entity.deletedAt.toISOString() 
      : entity.deletedAt;
  }
  
  // Remove camelCase fields
  delete result.createdAt;
  delete result.updatedAt;
  delete result.deletedAt;
  
  return result as Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
  };
}

/**
 * Converts entity timestamps from snake_case to camelCase for in-memory use.
 * Also converts ISO strings to Date objects.
 * 
 * @param entity - Entity with snake_case timestamp fields
 * @returns Object with camelCase timestamp fields as Date objects
 * @remarks
 * - Maps created_at → createdAt
 * - Maps updated_at → updatedAt
 * - Maps deleted_at → deletedAt
 * - Converts ISO strings to Date objects
 * - Validates ISO strings using parseTimestampSafely
 * @throws {Error} If any timestamp string is invalid ISO 8601 format
 */
export function fromSupabaseTimestamps<T extends { created_at?: string; updated_at?: string; deleted_at?: string }>(
  entity: T
): Omit<T, 'created_at' | 'updated_at' | 'deleted_at'> & EntityTimestamps {
  const result: Record<string, unknown> = { ...entity };
  
  // Convert and map created_at → createdAt
  if (entity.created_at !== undefined && entity.created_at !== null) {
    result.createdAt = parseTimestampSafely(entity.created_at, 'created_at');
  }
  
  // Convert and map updated_at → updatedAt
  if (entity.updated_at !== undefined && entity.updated_at !== null) {
    result.updatedAt = parseTimestampSafely(entity.updated_at, 'updated_at');
  }
  
  // Convert and map deleted_at → deletedAt
  if (entity.deleted_at !== undefined && entity.deleted_at !== null && entity.deleted_at !== '') {
    result.deletedAt = parseTimestampSafely(entity.deleted_at, 'deleted_at');
  }
  
  // Remove snake_case fields
  delete result.created_at;
  delete result.updated_at;
  delete result.deleted_at;
  
  return result as Omit<T, 'created_at' | 'updated_at' | 'deleted_at'> & EntityTimestamps;
}

/**
 * Business Logic Helper: Auto-populates createdAt if missing.
 * 
 * This applies a business rule: entities should have createdAt populated on creation.
 * Does NOT modify existing createdAt if already present.
 * 
 * @param entity - Entity to populate createdAt for
 * @param timestamp - Optional timestamp to use (defaults to current time)
 * @returns New object with createdAt populated (immutable)
 */
export function withCreatedAt<T extends EntityTimestamps>(
  entity: T,
  timestamp?: Date
): T {
  if (!entity || typeof entity !== 'object') {
    throw new Error('withCreatedAt: entity must be a valid object');
  }
  
  // Don't overwrite existing createdAt
  if (entity.createdAt !== undefined && entity.createdAt !== null) {
    return entity;
  }
  
  return {
    ...entity,
    createdAt: timestamp || new Date(),
  };
}

/**
 * Business Logic Helper: Always updates updatedAt to current time.
 * 
 * This applies a business rule: updatedAt should always be set on modification.
 * Always overwrites updatedAt, even if already present.
 * 
 * @param entity - Entity to update updatedAt for
 * @param timestamp - Optional timestamp to use (defaults to current time)
 * @returns New object with updatedAt updated (immutable)
 */
export function withUpdatedAt<T extends EntityTimestamps>(
  entity: T,
  timestamp?: Date
): T {
  if (!entity || typeof entity !== 'object') {
    throw new Error('withUpdatedAt: entity must be a valid object');
  }
  
  return {
    ...entity,
    updatedAt: timestamp || new Date(),
  };
}

/**
 * Business Logic Helper: Marks entity as soft-deleted by setting deletedAt.
 * 
 * This applies a business rule: soft-delete preserves tombstone (createdAt, updatedAt).
 * Sets deletedAt to current time and preserves all other fields.
 * 
 * @param entity - Entity to mark as deleted
 * @param timestamp - Optional timestamp to use (defaults to current time)
 * @returns New object with deletedAt set (immutable)
 */
export function markDeleted<T extends EntityTimestamps>(
  entity: T,
  timestamp?: Date
): T {
  if (!entity || typeof entity !== 'object') {
    throw new Error('markDeleted: entity must be a valid object');
  }
  
  return {
    ...entity,
    deletedAt: timestamp || new Date(),
  };
}

/**
 * Normalizes timestamp fields from API responses.
 * Handles both camelCase and snake_case formats, converting strings to Date objects.
 * 
 * This utility centralizes the logic for normalizing API responses that may come
 * in different formats (camelCase with Date objects, camelCase with strings, or snake_case).
 * 
 * @param item - API response item that may have timestamps in various formats
 * @returns Object with normalized camelCase Date timestamp fields
 * @remarks
 * - Checks if item already has camelCase timestamps (createdAt, updatedAt, deletedAt)
 * - If camelCase: converts string timestamps to Date objects if needed
 * - If snake_case: uses fromSupabaseTimestamps helper
 * - Returns properly typed entity with Date objects
 */
export function normalizeTimestampsFromApi<T extends EntityTimestamps>(
  item: unknown
): T {
  if (!item || typeof item !== 'object') {
    throw new Error('normalizeTimestampsFromApi: item must be a valid object');
  }

  const itemRecord = item as Record<string, unknown>;

  // Check if already camelCase (some APIs might transform)
  if (itemRecord.createdAt || itemRecord.updatedAt || itemRecord.deletedAt) {
    return {
      ...itemRecord,
      createdAt: normalizeTimestampField(itemRecord.createdAt),
      updatedAt: normalizeTimestampField(itemRecord.updatedAt),
      deletedAt: normalizeTimestampField(itemRecord.deletedAt),
    } as T;
  }

  // Has snake_case, use helper
  return fromSupabaseTimestamps(itemRecord as { created_at?: string; updated_at?: string; deleted_at?: string }) as T;
}

/**
 * Normalizes a single timestamp field value to a Date object.
 * 
 * @param value - Timestamp value (Date, string, or undefined)
 * @returns Date object or undefined
 */
function normalizeTimestampField(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}
