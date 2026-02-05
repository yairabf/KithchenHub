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
  updateEntityInCache,
  removeEntityFromCache
} from './cacheAwareRepository';
import { getIsOnline } from '../utils/networkStatus';
import { api } from '../../services/api';
import { normalizeTimestampsFromApi } from '../utils/timestamps';
import { markDeleted, withCreatedAt, withUpdatedAt } from '../utils/timestamps';
import { cacheEvents } from '../utils/cacheEvents';
import { NetworkError } from '../../services/api';
import { syncQueueStorage, type SyncOp } from '../utils/syncQueueStorage';
import * as Crypto from 'expo-crypto';

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
    title: dto.title,
    assignee: dto.assigneeName ?? undefined,
    dueDate: formatDateLabel(dueDate, resolvedSection),
    dueTime: formatTimeLabel(dueDate),
    reminder: undefined,
    isRecurring,
    isCompleted: dto.isCompleted,
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

  constructor(private readonly service: IChoresService) { }

  /**
   * Gets the ID from a chore entity
   */
  private getId(chore: Chore): string {
    return chore.id;
  }

  /**
   * Creates an optimistic chore entity with localId for offline operations.
   * 
   * Generates a temporary UUID as localId and sets initial timestamps.
   * The entity will be updated with server-assigned ID after successful sync.
   * 
   * @param data - Partial chore data from user input
   * @returns Complete Chore entity with generated localId and timestamps
   */
  private createOptimisticChore(data: Partial<Chore>): Chore {
    const localId = Crypto.randomUUID();
    const now = new Date().toISOString();

    return withCreatedAt({
      id: localId,
      localId: localId,
      name: data.name ?? '',
      assignee: data.assignee,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      reminder: data.reminder,
      isRecurring: data.isRecurring ?? false,
      completed: data.completed ?? false,
      section: data.section ?? 'today',
      icon: data.icon ?? DEFAULT_CHORE_ICON,
      createdAt: now,
      updatedAt: now,
    } as Chore);
  }

  /**
   * Ensures localId exists on entity (for updates of existing entities)
   */
  private ensureLocalId(chore: Chore): Chore {
    if (!chore.localId) {
      return { ...chore, localId: chore.id };
    }
    return chore;
  }

  /**
   * Helper method for enqueueing writes to the sync queue.
   * 
   * Extracts localId and serverId from the entity and enqueues the write
   * operation for later sync when network is available.
   * 
   * @param op - Sync operation type (create, update, delete)
   * @param entity - Chore entity to enqueue
   */
  private async enqueueWrite(
    op: SyncOp,
    entity: Chore
  ): Promise<void> {
    const localId = entity.localId ?? entity.id;
    const serverId = entity.id !== localId ? entity.id : undefined;

    await syncQueueStorage.enqueue(
      this.entityType,
      op,
      { localId, serverId },
      entity // Full entity payload
    );
  }

  /**
   * Fetches chores from API (used by cache layer)
   * 
   * Note: This duplicates the API call logic from RemoteChoresService.
   * Once services are refactored, this can be extracted to a shared method.
   */
  private async fetchChoresFromApi(): Promise<Chore[]> {
    console.log('[fetchChoresFromApi] Fetching chores from API...');
    const response = await api.get<ChoreListResponseDto>('/chores');
    console.log('[fetchChoresFromApi] API response:', JSON.stringify(response, null, 2));
    console.log('[fetchChoresFromApi] Response type:', typeof response, 'today:', response.today?.length ?? 0, 'upcoming:', response.upcoming?.length ?? 0);
    const todayChores = response.today.map((chore) => mapChoreDto(chore, 'today'));
    const upcomingChores = response.upcoming.map((chore) => mapChoreDto(chore, 'thisWeek'));

    // Normalize timestamps from API response (server is authority)
    const allChores = [...todayChores, ...upcomingChores];
    const normalized = allChores.map((chore) => normalizeTimestampsFromApi<Chore>(chore));
    console.log('[fetchChoresFromApi] Normalized chores:', normalized.length);
    return normalized;
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
      getIsOnline(),
      false // Don't force refresh on normal findAll
    );
  }

  /**
   * Force refresh from API (bypasses cache)
   * Fetches fresh data from API and updates cache
   */
  async refresh(): Promise<Chore[]> {
    return getCached<Chore>(
      this.entityType,
      () => this.fetchChoresFromApi(),
      (chore) => this.getId(chore),
      getIsOnline(),
      true // Force refresh
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
   * Creates a chore with write-through caching and offline queueing
   * 
   * Critical Write Ordering Rule (Non-negotiable):
   * UI action → Update cache immediately → Emit cache event → Handle sync (enqueue if offline, call service if online)
   */
  async create(chore: Partial<Chore>): Promise<Chore> {
    // Step 1: Create optimistic entity
    const optimisticEntity = this.createOptimisticChore(chore);

    // Step 2: Update cache immediately (write-through) - ALWAYS FIRST
    await addEntityToCache(
      this.entityType,
      optimisticEntity,
      (c) => this.getId(c)
    );

    // Step 3: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);

    // Step 4: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();

    if (isOnline) {
      try {
        const created = await this.service.createChore(chore);

        // CRITICAL: Remove optimistic entity first to prevent duplication
        // The server entity has a new ID, so the cache would treat it as a separate item
        await removeEntityFromCache<Chore>(
          this.entityType,
          optimisticEntity.id,
          (c: Chore) => this.getId(c)
        );

        await addEntityToCache(
          this.entityType,
          created,
          (c) => this.getId(c)
        );
        cacheEvents.emitCacheChange(this.entityType);
        return created;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('create', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('create', optimisticEntity);
      return optimisticEntity;
    }
  }

  /**
   * Updates a chore with write-through caching and offline queueing
   */
  async update(id: string, updates: Partial<Chore>): Promise<Chore> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<Chore>(this.entityType);
    const existing = current.find(c => c.id === id || c.localId === id);

    if (!existing) {
      throw new Error(`Chore with id ${id} not found in cache`);
    }

    // Step 2: Create optimistic updated entity
    const optimisticEntity = this.ensureLocalId(withUpdatedAt({
      ...existing,
      ...updates,
    } as Chore));

    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      this.entityType,
      optimisticEntity,
      (c) => this.getId(c),
      (c) => c.id === id || c.localId === id
    );

    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);

    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();

    if (isOnline) {
      try {
        const updated = await this.service.updateChore(id, updates);
        await updateEntityInCache(
          this.entityType,
          updated,
          (c) => this.getId(c),
          (c) => c.id === id || c.localId === id
        );
        cacheEvents.emitCacheChange(this.entityType);
        return updated;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('update', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('update', optimisticEntity);
      return optimisticEntity;
    }
  }

  /**
   * Deletes a chore (soft-delete) with write-through caching and offline queueing
   */
  async delete(id: string): Promise<void> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<Chore>(this.entityType);
    const existing = current.find(c => c.id === id || c.localId === id);

    if (!existing) {
      return;
    }

    // Step 2: Create optimistic deleted entity
    const optimisticEntity = this.ensureLocalId(markDeleted(existing));

    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      this.entityType,
      optimisticEntity,
      (c) => this.getId(c),
      (c) => c.id === id || c.localId === id
    );

    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);

    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();

    if (isOnline) {
      try {
        await this.service.deleteChore(id);
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('delete', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('delete', optimisticEntity);
    }
  }

  /**
   * Toggles chore completion with write-through caching and offline queueing
   */
  async toggle(id: string): Promise<Chore> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<Chore>(this.entityType);
    const existing = current.find(c => c.id === id || c.localId === id);

    if (!existing) {
      throw new Error(`Chore with id ${id} not found in cache`);
    }

    // Step 2: Create optimistic toggled entity
    const optimisticEntity = this.ensureLocalId(withUpdatedAt({
      ...existing,
      isCompleted: !existing.isCompleted,
    } as Chore));

    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      this.entityType,
      optimisticEntity,
      (c) => this.getId(c),
      (c) => c.id === id || c.localId === id
    );

    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);

    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();

    if (isOnline) {
      try {
        const updated = await this.service.toggleChore(id);
        await updateEntityInCache(
          this.entityType,
          updated,
          (c) => this.getId(c),
          (c) => c.id === id || c.localId === id
        );
        cacheEvents.emitCacheChange(this.entityType);
        return updated;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('update', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('update', optimisticEntity);
      return optimisticEntity;
    }
  }

  /**
   * Invalidate cache (force refresh on next read)
   */
  async invalidateCache(): Promise<void> {
    await invalidateCache(this.entityType);
  }
}
