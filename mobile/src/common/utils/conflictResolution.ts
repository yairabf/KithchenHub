import { EntityTimestamps, isEntityDeleted, parseTimestampSafely } from '../types/entityMetadata';

// Re-export normalizeToUtc for convenience
export { normalizeToUtc } from './timestamps';

type ConflictWinner = 'local' | 'remote';

const TIMESTAMP_FIELDS = new Set(['createdAt', 'updatedAt', 'deletedAt']);

const preserveLocalOnlyFields = <T extends EntityTimestamps>(winner: T, local: T): T => {
  const preserved: Record<string, unknown> = {};

  Object.keys(local).forEach((key) => {
    if (TIMESTAMP_FIELDS.has(key)) {
      return;
    }
    if (key === 'localId' || key.startsWith('local')) {
      preserved[key] = (local as Record<string, unknown>)[key];
      return;
    }
    if (!(key in (winner as Record<string, unknown>))) {
      preserved[key] = (local as Record<string, unknown>)[key];
    }
  });

  return { ...winner, ...preserved };
};

/**
 * Compares two timestamps and returns the most recent one.
 * Normalizes both to Date objects using parseTimestampSafely() before comparison.
 * Handles both Date objects and ISO strings (in-memory vs persisted/transport).
 * 
 * **Timezone Policy**: All timestamps are compared in UTC.
 * ISO strings are parsed as UTC (no timezone conversion).
 * Date objects are already in UTC internally.
 *
 * @param timestamp1 - First timestamp (Date or ISO string)
 * @param timestamp2 - Second timestamp (Date or ISO string)
 * @returns -1 if first is newer, 0 if equal, 1 if second is newer
 * @throws Error if timestamp strings are invalid ISO 8601 format
 * 
 * @example
 * ```typescript
 * // All compare correctly in UTC
 * compareTimestamps('2026-01-25T10:00:00.000Z', '2026-01-25T15:00:00.000+05:00'); // 0 (same UTC time)
 * ```
 */
export function compareTimestamps(
  timestamp1: Date | string | undefined,
  timestamp2: Date | string | undefined
): number {
  // Normalize to UTC for consistent comparison
  // parseTimestampSafely() handles UTC normalization for ISO strings and provides error handling
  // ISO strings with timezone offsets (e.g., '+05:00') are correctly parsed to UTC
  const normalized1 = parseTimestampSafely(timestamp1, 'timestamp1');
  const normalized2 = parseTimestampSafely(timestamp2, 'timestamp2');

  if (!normalized1 && !normalized2) {
    return 0;
  }
  if (!normalized1) {
    return 1;
  }
  if (!normalized2) {
    return -1;
  }

  const time1 = normalized1.getTime();
  const time2 = normalized2.getTime();

  if (time1 === time2) {
    return 0;
  }

  return time1 > time2 ? -1 : 1;
}

/**
 * Determines which entity should win in a conflict based on updatedAt.
 * 
 * Uses Last-Write-Wins (LWW) strategy: the entity with the most recent updatedAt wins.
 * When timestamps are equal, remote wins (deterministic tie-breaker, server is authoritative).
 * 
 * @param local - Local entity
 * @param remote - Remote entity
 * @returns 'local' if local is newer, 'remote' if remote is newer or equal (tie-breaker)
 * 
 * @example
 * ```typescript
 * const local = { id: '1', updatedAt: new Date('2026-01-25T10:00:00Z') };
 * const remote = { id: '1', updatedAt: new Date('2026-01-25T12:00:00Z') };
 * const winner = determineConflictWinner(local, remote);
 * // winner === 'remote' (remote is newer)
 * ```
 */
export function determineConflictWinner<T extends EntityTimestamps>(
  local: T,
  remote: T
): ConflictWinner {
  const comparison = compareTimestamps(local.updatedAt, remote.updatedAt);
  if (comparison === -1) {
    return 'local';
  }
  // Equal or remote newer → remote wins (deterministic tie-breaker)
  return 'remote';
}

/**
 * Merges two entities using Last-Write-Wins (LWW) strategy.
 * 
 * Winner record wins wholesale (entire entity from winner, not partial field mixing).
 * Preserves local-only fields (e.g., localId, client-only flags) from local side.
 * Preserves metadata (createdAt, updatedAt, deletedAt) from winning side.
 * 
 * @param local - Local entity to merge
 * @param remote - Remote entity to merge
 * @returns Merged entity with winner's data and preserved local-only fields
 * 
 * @example
 * ```typescript
 * const local = { id: '1', name: 'Local', localId: 'keep-this', updatedAt: older };
 * const remote = { id: '1', name: 'Remote', localId: 'remote-id', updatedAt: newer };
 * const result = mergeEntitiesLWW(local, remote);
 * // result.name === 'Remote' (remote wins)
 * // result.localId === 'keep-this' (local-only field preserved)
 * ```
 */
export function mergeEntitiesLWW<T extends EntityTimestamps>(
  local: T,
  remote: T
): T {
  const winner = determineConflictWinner(local, remote);
  const winnerEntity = winner === 'local' ? local : remote;
  // When remote wins, preserve local-only fields; when local wins, use as-is
  const merged = winner === 'local' ? winnerEntity : preserveLocalOnlyFields(winnerEntity, local);

  return merged as T;
}

/**
 * Checks if an entity should be treated as deleted based on deletedAt tombstone.
 * 
 * Resurrection Policy: Delete always wins unless recreate (new entity with new ID).
 * This function simply checks if the entity has a deletedAt tombstone.
 * The merge logic enforces that once deleted, always deleted (regardless of timestamp ordering).
 * 
 * @param entity - Entity to check for deletion
 * @returns true if entity has deletedAt tombstone, false otherwise
 */
export function shouldTreatAsDeleted<T extends EntityTimestamps>(
  entity: T
): boolean {
  return isEntityDeleted(entity);
}

/**
 * Merges entities with tombstone awareness.
 * 
 * Resurrection Policy: Delete always wins unless recreate (new entity with new ID).
 * Once an entity is deleted (has deletedAt), it stays deleted regardless of timestamp ordering.
 * Resurrection only occurs if a new entity is created with a new ID (handled by array merge logic).
 * 
 * @param local - Local entity to merge
 * @param remote - Remote entity to merge
 * @returns Merged entity, or null if both sides agree on deletion
 * 
 * @example
 * ```typescript
 * // Local deleted, remote updated → delete wins
 * const local = { id: '1', deletedAt: new Date('2026-01-25T10:00:00Z') };
 * const remote = { id: '1', updatedAt: new Date('2026-01-25T12:00:00Z') };
 * const result = mergeEntitiesWithTombstones(local, remote);
 * // result.deletedAt is defined (delete wins)
 * ```
 */
export function mergeEntitiesWithTombstones<T extends EntityTimestamps>(
  local: T,
  remote: T
): T | null {
  const localDeleted = shouldTreatAsDeleted(local);
  const remoteDeleted = shouldTreatAsDeleted(remote);

  // Both deleted → agree on deletion
  if (localDeleted && remoteDeleted) {
    return null;
  }

  // Delete always wins regardless of timestamp ordering
  if (localDeleted) {
    return preserveLocalOnlyFields(local, local);
  }

  if (remoteDeleted) {
    return preserveLocalOnlyFields(remote, local);
  }

  // Neither deleted → use LWW for conflict resolution
  return mergeEntitiesLWW(local, remote);
}

/**
 * Merges two arrays of entities using LWW + tombstone rules.
 * 
 * Handles additions, updates, and deletions:
 * - New entities (only in one side) are always added (additions never removed)
 * - Existing entities (in both) are merged using LWW + tombstone rules
 * - Deleted entities are filtered out from the result
 * 
 * Time complexity: O(n + m) where n = local.length, m = remote.length
 * Space complexity: O(n + m) for Map and Set data structures
 * Uses Map for O(1) lookup of remote entities by ID.
 * 
 * @param local - Array of local entities
 * @param remote - Array of remote entities
 * @param getId - Function to extract entity ID for matching. Must return unique, non-empty strings.
 *   Duplicate IDs in the same array will cause undefined behavior (last one wins in Map).
 * @returns Merged array with conflicts resolved and deletions filtered out
 * @throws Error if getId returns empty string for any entity
 * 
 * @example
 * ```typescript
 * const local = [{ id: '1', name: 'Local', updatedAt: older }];
 * const remote = [{ id: '1', name: 'Remote', updatedAt: newer }];
 * const merged = mergeEntityArrays(local, remote, (e) => e.id);
 * // merged[0].name === 'Remote' (remote wins due to newer timestamp)
 * ```
 */
export function mergeEntityArrays<T extends EntityTimestamps>(
  local: T[],
  remote: T[],
  getId: (entity: T) => string
): T[] {
  // Handle empty arrays early
  if (local.length === 0 && remote.length === 0) {
    return [];
  }

  const remoteMap = new Map<string, T>();
  remote.forEach((entity) => {
    const id = getId(entity);
    if (!id) {
      throw new Error('mergeEntityArrays: getId must return a non-empty string');
    }
    remoteMap.set(id, entity);
  });

  const merged: T[] = [];
  const seenIds = new Set<string>();

  for (const localEntity of local) {
    const entityId = getId(localEntity);
    if (!entityId) {
      throw new Error('mergeEntityArrays: getId must return a non-empty string');
    }
    const remoteEntity = remoteMap.get(entityId);
    seenIds.add(entityId);

    if (!remoteEntity) {
      if (!isEntityDeleted(localEntity)) {
        merged.push(localEntity);
      }
      continue;
    }

    const resolved = mergeEntitiesWithTombstones(localEntity, remoteEntity);
    if (resolved && !isEntityDeleted(resolved)) {
      merged.push(resolved);
    }
  }

  for (const remoteEntity of remote) {
    const entityId = getId(remoteEntity);
    if (!entityId) {
      throw new Error('mergeEntityArrays: getId must return a non-empty string');
    }
    if (seenIds.has(entityId)) {
      continue;
    }

    if (!isEntityDeleted(remoteEntity)) {
      merged.push(remoteEntity);
    }
  }

  return merged;
}
