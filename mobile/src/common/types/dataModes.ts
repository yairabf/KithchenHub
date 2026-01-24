/**
 * Data Modes Type Definitions
 * 
 * This module defines discriminated union types for three explicit data modes:
 * - Guest Mode: Local-only data for unauthenticated users
 * - Signed-In Mode: Cloud-synced household data
 * - Public Catalog Mode: Read-only reference data accessible to all users
 * 
 * These types enforce compile-time safety to prevent cross-mode data leakage.
 */

/**
 * Base type for all data modes
 */
export type DataMode = 'guest' | 'signed-in' | 'public-catalog';

/**
 * Guest Mode Entity Base
 * 
 * Guest entities are stored locally and never synced to cloud.
 * They have no household association and use local-only IDs.
 */
export interface GuestEntityBase {
  mode: 'guest';
  localId: string; // Stable UUID for local storage
  // Explicitly no householdId, no cloud sync fields
}

/**
 * Signed-In Mode Entity Base
 * 
 * Signed-in entities are cloud-synced and household-scoped.
 * They require authentication and have cloud IDs.
 */
export interface SignedInEntityBase {
  mode: 'signed-in';
  id: string; // Cloud ID from backend
  householdId: string; // Required for household scoping
  // Cloud sync fields (updatedAt, createdAt may be added)
}

/**
 * Public Catalog Entity Base
 * 
 * Public catalog entities are read-only and shared across all users.
 * They have no ownership and are always API-backed.
 */
export interface PublicCatalogEntityBase {
  mode: 'public-catalog';
  id: string; // Catalog ID (read-only)
  // No ownership, no householdId, no localId
}

/**
 * Type guard to check if an entity is a Guest entity
 */
export function isGuestEntity<T extends { mode?: string }>(
  entity: T
): entity is T & GuestEntityBase {
  return entity.mode === 'guest';
}

/**
 * Type guard to check if an entity is a Signed-In entity
 */
export function isSignedInEntity<T extends { mode?: string }>(
  entity: T
): entity is T & SignedInEntityBase {
  return entity.mode === 'signed-in';
}

/**
 * Type guard to check if an entity is a Public Catalog entity
 */
export function isPublicCatalogEntity<T extends { mode?: string }>(
  entity: T
): entity is T & PublicCatalogEntityBase {
  return entity.mode === 'public-catalog';
}

/**
 * Discriminated union for any entity with a mode
 */
export type EntityWithMode = GuestEntityBase | SignedInEntityBase | PublicCatalogEntityBase;

/**
 * Helper type to extract the mode from an entity
 */
export type ExtractMode<T extends EntityWithMode> = T['mode'];

/**
 * Helper type to create a guest version of an entity type
 */
export type GuestEntity<T> = T & GuestEntityBase;

/**
 * Helper type to create a signed-in version of an entity type
 */
export type SignedInEntity<T> = T & SignedInEntityBase;

/**
 * Helper type to create a public catalog version of an entity type
 */
export type PublicCatalogEntity<T> = T & PublicCatalogEntityBase;

/**
 * Discriminated union for entities that can be either guest or signed-in
 * (excludes public catalog as it's always read-only)
 */
export type UserOwnedEntity = GuestEntityBase | SignedInEntityBase;

/**
 * Type guard to check if an entity is user-owned (guest or signed-in)
 */
export function isUserOwnedEntity<T extends { mode?: string }>(
  entity: T
): entity is T & UserOwnedEntity {
  return entity.mode === 'guest' || entity.mode === 'signed-in';
}

/**
 * Validates that an entity has the expected mode
 * Throws an error if the mode doesn't match
 */
export function validateEntityMode<T extends { mode?: string }>(
  entity: T,
  expectedMode: DataMode
): asserts entity is T & { mode: DataMode } {
  if (entity.mode !== expectedMode) {
    throw new Error(
      `Entity mode mismatch: expected ${expectedMode}, got ${entity.mode ?? 'undefined'}`
    );
  }
}

/**
 * Determines the data mode based on user authentication state
 */
export function determineUserDataMode(user: { isGuest: boolean } | null): 'guest' | 'signed-in' {
  if (!user || user.isGuest) {
    return 'guest';
  }
  return 'signed-in';
}
