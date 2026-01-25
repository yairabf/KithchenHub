/**
 * Cache-Aware Chore Repository
 * 
 * Wraps RemoteChoresService with cache-first read strategies and write-through caching.
 * Provides immediate cache returns for reads and background refresh for stale data.
 */

import type { Chore } from '../../mocks/chores';
import type { IChoresService } from '../../features/chores/services/choresService';
import type { ICacheAwareRepository } from './baseCacheAwareRepository';
import { EntityTimestamps } from '../types/entityMetadata';
import { 
  getCached, 
  invalidateCache,
  readCachedEntitiesForUpdate,
  addEntityToCache,
  updateEntityInCache
} from './cacheAwareRepository';
import { getIsOnline } from '../utils/networkStatus';
import { api } from '../../services/api';
import { normalizeTimestampsFromApi } from '../utils/timestamps';
import { markDeleted } from '../utils/timestamps';

/**
 * DTO types for API responses (matches RemoteChoresService)
 */
type ChoreDto = {
  id: string;
  title: string;
  assigneeName?: string | null;
  dueDate?: string | Date | null;
  isCompleted: boolean;
  repeat?: string | null;
};

type ChoreListResponseDto = {
  today: ChoreDto[];
  upcoming: ChoreDto[];
};

const DEFAULT_CHORE_ICON = '🧹';

/**
 * Helper functions (duplicated from RemoteChoresService for now)
 */
const parseDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateLabel = (date: Date | null, section: Chore['section']): string => {
  if (!date) {
    return section === 'today' ? 'Today' : 'Upcoming';
  }

  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  if (isSameDay) {
    return 'Today';
  }

  return date.toLocaleDateString();
};

const formatTimeLabel = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const mapChoreDto = (dto: ChoreDto, section: Chore['section']): Chore => {
  const dueDate = parseDate(dto.dueDate);
  const isRecurring = Boolean(dto.repeat);
  const resolvedSection: Chore['section'] = isRecurring ? 'recurring' : section;

  return {
    id: dto.id,
    localId: dto.id,
    name: dto.title,
    assignee: dto.assigneeName ?? undefined,
    dueDate: formatDateLabel(dueDate, resolvedSection),
    dueTime: formatTimeLabel(dueDate),
    reminder: undefined,
    isRecurring,
    completed: dto.isCompleted,
    section: resolvedSection,
    icon: DEFAULT_CHORE_ICON,
  };
};

/**
 * Cache-aware repository for chores
 * 
 * Implements cache-first read strategy with background refresh and write-through caching.
 */
export class CacheAwareChoreRepository implements ICacheAwareRepository<Chore> {
  private readonly entityType = 'chores' as const;
  
  constructor(private readonly service: IChoresService) {}
  
  /**
   * Gets the ID from a chore entity
   */
  private getId(chore: Chore): string {
    return chore.id;
  }
  
  /**
   * Fetches chores from API (used by cache layer)
   * 
   * Note: This duplicates the API call logic from RemoteChoresService.
   * Once services are refactored, this can be extracted to a shared method.
   */
  private async fetchChoresFromApi(): Promise<Chore[]> {
    const response = await api.get<ChoreListResponseDto>('/chores');
    const todayChores = response.today.map((chore) => mapChoreDto(chore, 'today'));
    const upcomingChores = response.upcoming.map((chore) => mapChoreDto(chore, 'thisWeek'));

    // Normalize timestamps from API response (server is authority)
    const allChores = [...todayChores, ...upcomingChores];
    return allChores.map((chore) => normalizeTimestampsFromApi<Chore>(chore));
  }
  
  /**
   * Cache-first read with background refresh
   * Returns cached data immediately, refreshes in background if stale
   */
  async findAll(): Promise<Chore[]> {
    return getCached<Chore>(
      this.entityType,
      () => this.fetchChoresFromApi(),
      (chore) => this.getId(chore),
      getIsOnline()
    );
  }
  
  /**
   * Find single chore by ID (reads directly from cache, no network fetch)
   * 
   * Optimized to read directly from cache without triggering findAll(),
   * which may cause unnecessary network requests.
   * 
   * @param id - Chore ID to find
   * @returns Chore if found, null otherwise
   */
  async findById(id: string): Promise<Chore | null> {
    const chores = await readCachedEntitiesForUpdate<Chore>(this.entityType);
    return chores.find(c => c.id === id || c.localId === id) ?? null;
  }
  
  /**
   * Creates a chore with write-through caching
   * 
   * Implements write-through caching:
   * 1. Creates chore on server via service
   * 2. Reads current cache
   * 3. Adds created chore to cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param chore - Partial chore data to create
   * @returns The created chore with server timestamps
   * @throws {Error} If service call fails
   */
  async create(chore: Partial<Chore>): Promise<Chore> {
    // 1. Call service to create on server
    const created = await this.service.createChore(chore);
    
    // 2. Update cache (with error handling)
    await addEntityToCache(
      this.entityType,
      created,
      (c) => this.getId(c)
    );
    
    return created;
  }
  
  /**
   * Updates a chore with write-through caching
   * 
   * Implements write-through caching:
   * 1. Updates chore on server via service
   * 2. Reads current cache
   * 3. Updates chore in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Chore ID to update
   * @param updates - Partial chore data to update
   * @returns The updated chore with server timestamps
   * @throws {Error} If service call fails
   */
  async update(id: string, updates: Partial<Chore>): Promise<Chore> {
    // 1. Call service to update on server
    const updated = await this.service.updateChore(id, updates);
    
    // 2. Update cache (with error handling)
    await updateEntityInCache(
      this.entityType,
      updated,
      (c) => this.getId(c),
      (c) => c.id === id || c.localId === id
    );
    
    return updated;
  }
  
  /**
   * Deletes a chore (soft-delete) with write-through caching
   * 
   * Implements write-through caching:
   * 1. Deletes chore on server via service (soft-delete)
   * 2. Reads current cache
   * 3. Marks chore as deleted in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Chore ID to delete
   * @throws {Error} If service call fails
   */
  async delete(id: string): Promise<void> {
    // 1. Call service to delete on server
    await this.service.deleteChore(id);
    
    // 2. Read current cache and mark as deleted
    try {
      const current = await readCachedEntitiesForUpdate<Chore>(this.entityType);
      const chore = current.find(c => c.id === id || c.localId === id);
      if (chore) {
        const deleted = markDeleted(chore);
        await updateEntityInCache(
          this.entityType,
          deleted,
          (c) => this.getId(c),
          (c) => c.id === id || c.localId === id
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to update cache after delete for ${this.entityType}:`, errorMessage);
      // Don't throw - server operation succeeded
      try {
        await invalidateCache(this.entityType);
      } catch (invalidateError) {
        // Ignore invalidation errors
        console.error(`Failed to invalidate cache after delete error:`, invalidateError);
      }
    }
  }
  
  /**
   * Toggles chore completion with write-through caching
   * 
   * Implements write-through caching:
   * 1. Toggles chore on server via service
   * 2. Reads current cache
   * 3. Updates chore in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Chore ID to toggle
   * @returns The updated chore with server timestamps
   * @throws {Error} If service call fails
   */
  async toggle(id: string): Promise<Chore> {
    // 1. Call service to toggle on server
    const updated = await this.service.toggleChore(id);
    
    // 2. Update cache (with error handling)
    await updateEntityInCache(
      this.entityType,
      updated,
      (c) => this.getId(c),
      (c) => c.id === id || c.localId === id
    );
    
    return updated;
  }
  
  /**
   * Invalidate cache (force refresh on next read)
   */
  async invalidateCache(): Promise<void> {
    await invalidateCache(this.entityType);
  }
}
