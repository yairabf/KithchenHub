/**
 * Cache Event Bus
 * 
 * Event emitter for cache change notifications to trigger UI updates.
 * Allows repositories to notify UI components when cache changes occur.
 * 
 * Uses a custom EventEmitter implementation compatible with React Native
 * (Node.js 'events' module is not available in React Native).
 */

import type { SyncEntityType } from './cacheMetadata';

/**
 * Simple EventEmitter implementation for React Native
 * 
 * Provides the same API as Node.js EventEmitter but works in React Native.
 */
class EventEmitter {
  private listeners: Map<string, Set<() => void>> = new Map();

  /**
   * Subscribe to an event
   * 
   * @param eventName - The event name to listen to
   * @param handler - Callback function to execute when event is emitted
   */
  on(eventName: string, handler: () => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   * 
   * @param eventName - The event name to unsubscribe from
   * @param handler - The callback function to remove
   */
  off(eventName: string, handler: () => void): void {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Emit an event, calling all registered handlers
   * 
   * @param eventName - The event name to emit
   */
  emit(eventName: string): void {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      // Create a copy of the handlers set to avoid issues if handlers modify during iteration
      const handlersCopy = Array.from(handlers);
      handlersCopy.forEach((handler) => {
        try {
          handler();
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if no event name provided
   * 
   * @param eventName - Optional event name to remove listeners from
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for a specific event
   * 
   * @param eventName - The event name to check
   * @returns Number of listeners for the event
   */
  listenerCount(eventName: string): number {
    const handlers = this.listeners.get(eventName);
    return handlers ? handlers.size : 0;
  }
}

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
