/**
 * Data Mode Validation Utilities
 * 
 * This module provides runtime validation functions to prevent cross-mode data leakage:
 * - Entity mode validation
 * - Service operation validation
 * - Mode compatibility checks
 * 
 * These validations enforce guardrails at runtime to catch mode mismatches.
 */

import type { DataMode, EntityWithMode } from '../types/dataModes';
import { validateEntityMode } from '../types/dataModes';

/**
 * Validates that an entity has the expected mode
 * This is a wrapper around validateEntityMode for convenience
 * 
 * @param entity - The entity to validate
 * @param expectedMode - The expected data mode
 * @throws Error if the entity mode doesn't match
 */
export function validateEntityModeMatch<T extends { mode?: string }>(
  entity: T,
  expectedMode: DataMode
): asserts entity is T & EntityWithMode {
  validateEntityMode(entity, expectedMode);
}

/**
 * Validates that a service operation is allowed for the given entity mode
 * 
 * @param operation - The operation being performed ('read' or 'write')
 * @param entityMode - The mode of the entity
 * @throws Error if the operation is not allowed for the mode
 */
export function validateServiceOperation(
  operation: 'read' | 'write',
  entityMode: DataMode
): void {
  if (entityMode === 'public-catalog' && operation === 'write') {
    throw new Error('Public catalog entities are read-only. Write operations are not allowed.');
  }
}

/**
 * Validates that a service type is compatible with the entity mode
 * 
 * @param serviceType - The type of service ('local' | 'remote' | 'catalog')
 * @param entityMode - The mode of the entity
 * @throws Error if the service type is not compatible with the mode
 */
export function validateServiceCompatibility(
  serviceType: 'local' | 'remote' | 'catalog',
  entityMode: DataMode
): void {
  if (entityMode === 'guest' && serviceType === 'remote') {
    throw new Error(
      'Guest entities cannot use remote service. Use local service for guest mode.'
    );
  }
  
  if (entityMode === 'signed-in' && serviceType === 'local') {
    // Note: This is a warning, not an error, as signed-in users may use local cache
    // But we should prefer remote service for signed-in users
    console.warn(
      'Signed-in entities should use remote service. Local service is for caching only.'
    );
  }
  
  if (entityMode === 'public-catalog' && serviceType !== 'catalog') {
    throw new Error(
      'Public catalog entities must use catalog service. Other service types are not allowed.'
    );
  }
  
  // Catalog service can only be used with public-catalog mode
  if (serviceType === 'catalog' && entityMode !== 'public-catalog') {
    throw new Error(
      `Catalog service can only be used with public-catalog mode, but entity is in ${entityMode} mode.`
    );
  }
}

/**
 * Validates that an entity can be migrated from one mode to another
 * 
 * @param sourceMode - The current mode of the entity
 * @param targetMode - The target mode for migration
 * @throws Error if the migration is not allowed
 */
export function validateModeMigration(
  sourceMode: DataMode,
  targetMode: DataMode
): void {
  // Only allow migration from guest to signed-in
  if (sourceMode === 'guest' && targetMode === 'signed-in') {
    return; // Valid migration
  }
  
  // Disallow all other migrations
  if (sourceMode === targetMode) {
    throw new Error(`Entity is already in ${targetMode} mode. No migration needed.`);
  }
  
  if (sourceMode === 'signed-in' && targetMode === 'guest') {
    throw new Error('Cannot migrate from signed-in to guest mode. This would lose cloud sync.');
  }
  
  if (sourceMode === 'public-catalog') {
    throw new Error('Cannot migrate public catalog entities. They are read-only.');
  }
  
  if (targetMode === 'public-catalog') {
    throw new Error('Cannot migrate to public catalog mode. It is read-only.');
  }
  
  throw new Error(
    `Invalid migration from ${sourceMode} to ${targetMode}. Only guest to signed-in is allowed.`
  );
}

/**
 * Validates that an array of entities all have the same mode
 * 
 * @param entities - Array of entities to validate
 * @param expectedMode - The expected mode for all entities
 * @throws Error if any entity has a different mode
 */
export function validateEntitiesMode<T extends { mode?: string }>(
  entities: T[],
  expectedMode: DataMode
): asserts entities is (T & EntityWithMode)[] {
  entities.forEach((entity, index) => {
    try {
      validateEntityMode(entity, expectedMode);
    } catch (error) {
      throw new Error(
        `Entity at index ${index} has mode ${entity.mode ?? 'undefined'}, expected ${expectedMode}`
      );
    }
  });
}

/**
 * Validates that a user can access entities in a specific mode
 * 
 * @param userMode - The mode determined from the user's authentication state
 * @param entityMode - The mode of the entity being accessed
 * @throws Error if the user cannot access entities in that mode
 */
export function validateUserAccessToMode(
  userMode: 'guest' | 'signed-in',
  entityMode: DataMode
): void {
  // Public catalog is accessible to all users
  if (entityMode === 'public-catalog') {
    return;
  }
  
  // Users can only access entities in their own mode
  if (userMode !== entityMode) {
    throw new Error(
      `User in ${userMode} mode cannot access ${entityMode} entities.`
    );
  }
}

/**
 * Validates that a guest user is not attempting to use signed-in features
 * 
 * @param userMode - The mode determined from the user's authentication state
 * @param feature - The feature being accessed
 * @throws Error if a guest user tries to use signed-in-only features
 */
export function validateGuestFeatureAccess(
  userMode: 'guest' | 'signed-in',
  feature: 'household-sharing' | 'cloud-sync' | 'cross-device'
): void {
  if (userMode === 'guest' && feature !== 'cloud-sync') {
    throw new Error(
      `Guest users cannot access ${feature}. Please sign in to use this feature.`
    );
  }
}
