/**
 * Base Cache-Aware Repository Interface
 * 
 * Defines the interface and base class for cache-aware repositories that wrap
 * remote services with cache-first read strategies and write-through caching.
 */

import type { EntityTimestamps } from '../types/entityMetadata';
import type { SyncEntityType } from '../utils/cacheMetadata';

/**
 * Base interface for cache-aware repositories
 * 
 * Provides cache-first read operations with background refresh and
 * write-through caching for all CRUD operations.
 */
export interface ICacheAwareRepository<T extends EntityTimestamps> {
  /**
   * Cache-first read with background refresh
   * Returns cached data immediately, refreshes in background if stale
   */
  findAll(): Promise<T[]>;
  
  /**
   * Find single entity by ID (reads from cache first)
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Create entity with write-through caching
   */
  create(entity: Partial<T>): Promise<T>;
  
  /**
   * Update entity with write-through caching
   */
  update(id: string, updates: Partial<T>): Promise<T>;
  
  /**
   * Delete entity (soft-delete) with write-through caching
   */
  delete(id: string): Promise<void>;
  
  /**
   * Invalidate cache (force refresh on next read)
   */
  invalidateCache(): Promise<void>;
}
