/**
 * Guest Storage Helpers
 * 
 * Internal utilities for guest storage operations with envelope-based versioning.
 * These helpers are not exported - they are only used internally by guestStorage.ts.
 * 
 * Envelope format: { version: number, updatedAt: string, data: T[] }
 * - Version defaults to 1 if missing (backward compatible)
 * - Legacy array format is automatically upgraded to envelope on read
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BaseEntity } from '../types/entityMetadata';
import { fromPersistedTimestamps, toPersistedTimestamps } from '../types/entityMetadata';

/**
 * Current storage schema version
 */
const CURRENT_STORAGE_VERSION = 1;

/**
 * Performance monitoring thresholds
 * 
 * These thresholds are based on AsyncStorage performance characteristics:
 * - 100ms: Typical AsyncStorage operations should complete in <100ms for good UX.
 *   Operations exceeding this may indicate storage pressure or device performance issues.
 * - 100 entities: Collections with >100 entities may benefit from pagination or indexing.
 *   This threshold helps identify when to consider migration to SQLite/WatermelonDB.
 * - 100KB: Payloads >100KB may cause UI lag during JSON serialization/deserialization.
 *   Large payloads suggest the need for data compression or chunking strategies.
 * 
 * These constants are used to log performance metrics when operations exceed thresholds.
 */
const PERFORMANCE_THRESHOLD_MS = 100;
const ENTITY_COUNT_THRESHOLD = 100;
const PAYLOAD_SIZE_THRESHOLD_BYTES = 100000;

/**
 * Storage envelope format for versioning and metadata
 */
export interface StorageEnvelope<T> {
  version: number;        // Schema version (defaults to 1)
  updatedAt: string;      // ISO timestamp of last write
  data: T[];              // Array of entities
}

/**
 * Gets current high-resolution timestamp for performance monitoring.
 * Falls back to Date.now() if performance API is not available.
 */
function getPerformanceNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Logs performance metrics if thresholds are exceeded.
 */
function logPerformanceIfNeeded(
  operationName: string,
  startTime: number,
  entityCount: number,
  payloadSize: number
): void {
  const duration = getPerformanceNow() - startTime;
  
  if (duration > PERFORMANCE_THRESHOLD_MS || 
      entityCount > ENTITY_COUNT_THRESHOLD || 
      payloadSize > PAYLOAD_SIZE_THRESHOLD_BYTES) {
    console.log(
      `[guestStorage] ${operationName}: ${entityCount} entities, ${payloadSize} bytes, ${duration.toFixed(2)}ms`
    );
  }
}

/**
 * Logs a warning for slow empty reads (baseline performance check).
 */
function logSlowEmptyRead(operationName: string, startTime: number): void {
  const duration = getPerformanceNow() - startTime;
  if (duration > PERFORMANCE_THRESHOLD_MS) {
    console.warn(`[guestStorage] ${operationName} took ${duration.toFixed(2)}ms (empty)`);
  }
}

/**
 * Creates a default envelope with empty data
 */
function createDefaultEnvelope<T>(): StorageEnvelope<T> {
  return {
    version: CURRENT_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
    data: [],
  };
}

/**
 * Safe JSON parsing with error handling
 * 
 * @param data - Raw string data from storage
 * @param storageKey - Storage key for error context
 * @returns Parsed data or null if parsing fails
 */
function safeParseJSON<T>(data: string | null, storageKey: string): T | null {
  if (!data) {
    return null;
  }
  
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error parsing JSON from ${storageKey}:`, error);
    return null;
  }
}

/**
 * Checks if data is a legacy array format (backward compatibility)
 */
function isLegacyArrayFormat(data: unknown): data is unknown[] {
  return Array.isArray(data);
}

/**
 * Checks if data is an envelope format
 * Version is optional (defaults to 1 if missing)
 */
function isEnvelopeFormat(data: unknown): data is StorageEnvelope<unknown> {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const candidate = data as Record<string, unknown>;
  return (
    (candidate.version === undefined || typeof candidate.version === 'number') &&
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.data)
  );
}

/**
 * Validates and normalizes an array of entities
 * 
 * @template T - Entity type extending BaseEntity
 * @param rawData - Raw parsed data (unknown type)
 * @param storageKey - Storage key for error context
 * @param validator - Type guard function
 * @returns Array of validated and normalized entities
 */
function validateAndNormalizeArray<T extends BaseEntity>(
  rawData: unknown,
  storageKey: string,
  validator: (item: unknown) => item is T
): T[] {
  if (!Array.isArray(rawData)) {
    console.error(`Invalid data format in ${storageKey}: expected array, got ${typeof rawData}`);
    return [];
  }
  
  // Filter out null/invalid items before normalization
  const validItems = rawData.filter((item): item is Record<string, unknown> => 
    item !== null && typeof item === 'object'
  );
  
  // Shallow normalization: convert ISO strings to Date objects (top-level entities only)
  // Type assertion is safe here because:
  // 1. validItems are already filtered to be objects
  // 2. fromPersistedTimestamps preserves object structure
  // 3. Validator will filter out any invalid items in the next step
  const normalized = validItems.map(fromPersistedTimestamps) as unknown as T[];
  
  // Validate each entity has required fields using validator
  const result = normalized.filter(validator);
  
  // Log if any items were filtered out
  if (result.length < normalized.length) {
    const filteredCount = normalized.length - result.length;
    console.warn(`[guestStorage] Filtered out ${filteredCount} invalid entities from ${storageKey}`);
  }
  
  return result;
}

/**
 * Migrates envelope data if version mismatch detected
 * Currently only supports version 1 (no migration needed)
 * 
 * @template T - Entity type extending BaseEntity
 * @param envelope - Envelope to migrate
 * @returns Migrated envelope (or original if no migration needed)
 */
function migrateEnvelopeIfNeeded<T extends BaseEntity>(
  envelope: StorageEnvelope<T>
): StorageEnvelope<T> {
  // Version 1: no migration needed
  if (envelope.version === CURRENT_STORAGE_VERSION) {
    return envelope;
  }
  
  // Future versions: add migration logic here
  if (envelope.version > CURRENT_STORAGE_VERSION) {
    throw new Error(
      `Storage version ${envelope.version} is newer than supported version ${CURRENT_STORAGE_VERSION}. ` +
      `Please update the app to the latest version.`
    );
  }
  
  // For now, just ensure version is set correctly
  return {
    ...envelope,
    version: CURRENT_STORAGE_VERSION,
  };
}

/**
 * Generic typed read helper with envelope support
 * 
 * @template T - Entity type extending BaseEntity
 * @param storageKey - Storage key to read from
 * @param validator - Type guard function to validate entities
 * @returns Promise<StorageEnvelope<T>> - Envelope with version and data, or default envelope on error
 */
export async function readEntityEnvelope<T extends BaseEntity>(
  storageKey: string,
  validator: (item: unknown) => item is T
): Promise<StorageEnvelope<T>> {
  const startTime = getPerformanceNow();
  
  try {
    const data = await AsyncStorage.getItem(storageKey);
    
    if (!data) {
      logSlowEmptyRead(`readEntityEnvelope(${storageKey})`, startTime);
      return createDefaultEnvelope<T>();
    }
    
    const parsed = safeParseJSON<unknown>(data, storageKey);
    
    if (!parsed) {
      // Invalid JSON - return default envelope
      return createDefaultEnvelope<T>();
    }
    
    let envelope: StorageEnvelope<T>;
    
    // Handle legacy array format (backward compatibility)
    if (isLegacyArrayFormat(parsed)) {
      // Upgrade legacy array to envelope format
      const validatedData = validateAndNormalizeArray(parsed, storageKey, validator);
      envelope = {
        version: CURRENT_STORAGE_VERSION,
        updatedAt: new Date().toISOString(),
        data: validatedData,
      };
      
      // Write back the upgraded format (async, don't await to avoid blocking reads)
      // Note: Legacy format upgrade is fire-and-forget to avoid blocking reads.
      // If upgrade fails, legacy format will be upgraded on next read.
      // Multiple concurrent reads may trigger multiple upgrade attempts, but
      // AsyncStorage.setItem is idempotent for the same data.
      // TODO: Consider adding a debounce mechanism for production to reduce redundant writes
      // when multiple concurrent reads trigger upgrade attempts.
      AsyncStorage.setItem(storageKey, JSON.stringify(envelope)).catch((error) => {
        console.warn(`Failed to upgrade legacy format in ${storageKey}:`, error);
      });
    } else if (isEnvelopeFormat(parsed)) {
      // Validate and normalize the data array
      const validatedData = validateAndNormalizeArray(parsed.data, storageKey, validator);
      
      // Ensure version defaults to 1 if missing
      const version = parsed.version ?? CURRENT_STORAGE_VERSION;
      
      envelope = {
        version,
        updatedAt: parsed.updatedAt,
        data: validatedData,
      };
      
      // Migrate if needed
      envelope = migrateEnvelopeIfNeeded(envelope);
    } else {
      // Wrong shape - return default envelope
      // Include data sample for debugging (truncated to first 200 chars)
      const dataSample = JSON.stringify(parsed).substring(0, 200);
      const isTruncated = JSON.stringify(parsed).length > 200;
      console.error(
        `Invalid data format in ${storageKey}: expected envelope or array, got ${typeof parsed}. ` +
        `Data sample: ${dataSample}${isTruncated ? '...' : ''}`
      );
      return createDefaultEnvelope<T>();
    }
    
    // Performance monitoring
    logPerformanceIfNeeded(
      `readEntityEnvelope(${storageKey})`,
      startTime,
      envelope.data.length,
      data.length
    );
    
    return envelope;
  } catch (error) {
    const duration = getPerformanceNow() - startTime;
    console.error(
      `Error reading entity envelope from ${storageKey} (${duration.toFixed(2)}ms):`,
      error
    );
    return createDefaultEnvelope<T>();
  }
}

/**
 * Generic typed write helper with envelope support
 * 
 * @template T - Entity type extending BaseEntity
 * @param storageKey - Storage key to write to
 * @param entities - Array of entities to write
 * @param validator - Type guard function to validate entities before write
 * @throws Error if validation fails or storage operation fails
 */
export async function writeEntityEnvelope<T extends BaseEntity>(
  storageKey: string,
  entities: T[],
  validator: (item: unknown) => item is T
): Promise<void> {
  const startTime = getPerformanceNow();
  
  // Validate input
  if (!Array.isArray(entities)) {
    throw new Error(`Entities must be an array for ${storageKey}`);
  }
  
  // Validate all entities before writing
  const invalidEntities = entities.filter(entity => !validator(entity));
  if (invalidEntities.length > 0) {
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Invalid entities detected in ${storageKey}: ${invalidEntities.length} entities missing required fields. First invalid entity: ${JSON.stringify(invalidEntities[0])}`
      : `Invalid entities detected in ${storageKey}: ${invalidEntities.length} entities missing required fields`;
    throw new Error(errorMessage);
  }
  
  try {
    // Shallow serialization: convert Date objects to ISO strings (top-level entities only)
    const serialized = entities.map(toPersistedTimestamps);
    
    // Create envelope with current version and timestamp
    const envelope: StorageEnvelope<T> = {
      version: CURRENT_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      data: serialized as T[],
    };
    
    const jsonString = JSON.stringify(envelope);
    await AsyncStorage.setItem(storageKey, jsonString);
    
    // Performance monitoring
    logPerformanceIfNeeded(
      `writeEntityEnvelope(${storageKey})`,
      startTime,
      entities.length,
      jsonString.length
    );
  } catch (error) {
    const duration = getPerformanceNow() - startTime;
    console.error(
      `Error writing entity envelope to ${storageKey} (${duration.toFixed(2)}ms):`,
      error
    );
    throw error;
  }
}
