/**
 * Cache Event Bus
 * 
 * Event emitter for cache change notifications to trigger UI updates.
 * Allows repositories to notify UI components when cache changes occur.
 */

import { EventEmitter } from 'events';
import type { SyncEntityType } from './cacheMetadata';

/**
 * Cache event emitter class
 * 
 * Extends EventEmitter to provide typed cache change events.
 */
class CacheEventEmitter extends EventEmitter {
  /**
   * Emit cache change event for an entity type
   * Called after setCached() operations
   * 
   * @param entityType - The entity type that changed
   */
  emitCacheChange(entityType: SyncEntityType): void {
    this.emit(`cache:${entityType}:changed`);
  }
  
  /**
   * Subscribe to cache changes for an entity type
   * Returns unsubscribe function
   * 
   * @param entityType - The entity type to subscribe to
   * @param handler - Callback function to execute when cache changes
   * @returns Unsubscribe function
   */
  onCacheChange(
    entityType: SyncEntityType,
    handler: () => void
  ): () => void {
    this.on(`cache:${entityType}:changed`, handler);
    return () => this.off(`cache:${entityType}:changed`, handler);
  }
}

/**
 * Singleton cache event emitter instance
 * 
 * Use this instance to emit and subscribe to cache change events.
 */
export const cacheEvents = new CacheEventEmitter();
