import { api } from '../../../services/api';
import { mockChores, type Chore } from '../../../mocks/chores';
import type { DataMode } from '../../../common/types/dataModes';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';
import { withUpdatedAt, markDeleted, withCreatedAtAndUpdatedAt, toSupabaseTimestamps, normalizeTimestampsFromApi } from '../../../common/utils/timestamps';
import { findEntityIndex, updateEntityInStorage } from '../../../common/utils/entityOperations';
import { guestStorage } from '../../../common/utils/guestStorage';
import { createChore } from '../utils/choreFactory';
import { addEntityToCache, updateEntityInCache } from '../../../common/repositories/cacheAwareRepository';

/**
 * Provides chore data sources (mock vs remote) for the chores feature.
 */
export interface IChoresService {
  getChores(): Promise<Chore[]>;
  // CRUD methods
  createChore(chore: Partial<Chore>): Promise<Chore>;
  updateChore(choreId: string, updates: Partial<Chore>): Promise<Chore>;
  deleteChore(choreId: string): Promise<void>;
  toggleChore(choreId: string): Promise<Chore>;
}

type ChoreDto = {
  id: string;
  title: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  dueDate?: string | Date | null;
  isCompleted: boolean;
  completedAt?: string | Date | null;
  repeat?: string | null;
};

type ChoreListResponseDto = {
  today: ChoreDto[];
  upcoming: ChoreDto[];
};

const DEFAULT_CHORE_ICON = '🧹';

const parseDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Parses a frontend dueDate string (e.g., "Today", "Tomorrow", or date string) into an ISO date string.
 * Returns undefined if the date cannot be parsed.
 */
const parseDueDateString = (dueDate?: string, dueTime?: string): string | undefined => {
  if (!dueDate) return undefined;

  try {
    const dueDateLower = dueDate.toLowerCase();
    let baseDate = new Date();

    if (dueDateLower === 'today') {
      baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);
    } else if (dueDateLower === 'tomorrow') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      baseDate.setHours(0, 0, 0, 0);
    } else {
      // Try to parse as a date string
      const parsed = new Date(dueDate);
      if (Number.isNaN(parsed.getTime())) {
        // If it's a weekday name, find the next occurrence
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = weekdays.indexOf(dueDateLower);
        if (targetDay !== -1) {
          const today = new Date().getDay();
          const daysToAdd = targetDay >= today ? targetDay - today : 7 - today + targetDay;
          baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + daysToAdd);
          baseDate.setHours(0, 0, 0, 0);
        } else {
          return undefined;
        }
      } else {
        baseDate = parsed;
      }
    }

    // Parse time if provided
    if (dueTime) {
      const timeMatch = dueTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        baseDate.setHours(hours, minutes, 0, 0);
      }
    }

    return baseDate.toISOString();
  } catch (error) {
    console.error('Error parsing dueDate string:', error);
    return undefined;
  }
};

/**
 * Maps frontend isRecurring boolean to backend repeat string.
 * Returns undefined if not recurring.
 */
const mapIsRecurringToRepeat = (isRecurring?: boolean): string | undefined => {
  // For now, we use a simple mapping. In the future, this could be more sophisticated
  // (e.g., daily, weekly, monthly based on chore configuration)
  return isRecurring ? 'daily' : undefined;
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
  // CRITICAL FIX: If the chore is in the 'today' bucket from the backend, keep it there.
  // Only use 'recurring' section if it's NOT today.
  const resolvedSection: Chore['section'] = section === 'today' ? 'today' : (isRecurring ? 'recurring' : section);

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
    originalDate: dueDate,
  };
};

export class LocalChoresService implements IChoresService {
  async getChores(): Promise<Chore[]> {
    // Read from real guest storage, return empty array if no data exists
    const guestChores = await guestStorage.getChores();
    return guestChores.length > 0 ? guestChores : [...mockChores];
  }

  async createChore(chore: Partial<Chore>): Promise<Chore> {
    if (!chore.title) {
      throw new Error('Chore must have a title');
    }

    const newChore = createChore({
      title: chore.title,
      icon: chore.icon || DEFAULT_CHORE_ICON,
      assignee: chore.assignee,
      dueDate: chore.dueDate || 'Today',
      dueTime: chore.dueTime,
      section: chore.section || 'today',
    });

    const existingChores = await guestStorage.getChores();
    await guestStorage.saveChores([...existingChores, newChore]);
    return newChore;
  }

  async updateChore(choreId: string, updates: Partial<Chore>): Promise<Chore> {
    const existingChores = await guestStorage.getChores();
    const choreIndex = findEntityIndex(existingChores, choreId, 'Chore');

    return updateEntityInStorage(
      existingChores,
      choreIndex,
      (chore) => withUpdatedAt({ ...chore, ...updates }),
      guestStorage.saveChores
    );
  }

  async deleteChore(choreId: string): Promise<void> {
    const existingChores = await guestStorage.getChores();
    const choreIndex = findEntityIndex(existingChores, choreId, 'Chore');

    await updateEntityInStorage(
      existingChores,
      choreIndex,
      (chore) => withUpdatedAt(markDeleted(chore)),
      guestStorage.saveChores
    );
  }

  async toggleChore(choreId: string): Promise<Chore> {
    const existingChores = await guestStorage.getChores();
    const choreIndex = findEntityIndex(existingChores, choreId, 'Chore');

    return updateEntityInStorage(
      existingChores,
      choreIndex,
      (chore) => withUpdatedAt({ ...chore, isCompleted: !chore.isCompleted }),
      guestStorage.saveChores
    );
  }
}

/**
 * Remote chores service for signed-in users.
 * 
 * This service should only be instantiated for signed-in users.
 * Service factory (createChoresService) prevents guest mode from creating this service.
 * 
 * Defense-in-depth: All methods make API calls which require authentication.
 * Guest users cannot provide valid JWT tokens, so API calls will fail at the backend.
 */
export class RemoteChoresService implements IChoresService {
  async getChores(): Promise<Chore[]> {
    const response = await api.get<ChoreListResponseDto>('/chores');
    const todayChores = response.today.map((chore) => mapChoreDto(chore, 'today'));
    const upcomingChores = response.upcoming.map((chore) => mapChoreDto(chore, 'thisWeek'));

    // Normalize timestamps from API response (server is authority)
    const allChores = [...todayChores, ...upcomingChores];
    return allChores.map((chore) => normalizeTimestampsFromApi<Chore>(chore));
  }

  async createChore(chore: Partial<Chore>): Promise<Chore> {
    if (!chore.title) {
      throw new Error('Chore must have a title');
    }

    // Apply timestamp for optimistic UI and offline queue
    const withTimestamps = withCreatedAtAndUpdatedAt(chore as Chore);
    const payload = toSupabaseTimestamps(withTimestamps);
    // Map to backend DTO format
    const dto = {
      title: payload.title || chore.title,
      assigneeId: undefined, // Would need to map assignee name to ID
      dueDate: parseDueDateString(chore.dueDate || 'Today', chore.dueTime), // CRITICAL FIX: Parse due date
      repeat: undefined,
    };
    const response = await api.post<{ id: string }>('/chores', dto);
    // Server is authority: fetch the created chore to get server timestamps
    // Note: API returns only { id }, so we fetch the full entity to get server-assigned timestamps
    // This ensures we have the complete entity with correct timestamps from the server
    const created = await this.getChores().then(chores => chores.find(c => c.id === response.id));
    if (!created) {
      throw new Error(`Failed to retrieve created chore with id: ${response.id}`);
    }

    // Write-through cache update: add new entity to cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await addEntityToCache('chores', created, (c) => c.id);

    return created;
  }

  async updateChore(choreId: string, updates: Partial<Chore>): Promise<Chore> {
    // Get existing chore first
    const existing = await this.getChores().then(chores =>
      chores.find(c => c.id === choreId)
    );
    if (!existing) {
      throw new Error(`Chore not found: ${choreId}`);
    }

    // Apply timestamp for optimistic UI and offline queue
    const updated = { ...existing, ...updates };
    const withTimestamps = withUpdatedAt(updated);
    const payload = toSupabaseTimestamps(withTimestamps);
    // Map to backend DTO format
    const dto: {
      title?: string;
      assigneeId?: string;
      dueDate?: string;
      repeat?: string;
    } = {};

    if (updates.title !== undefined) {
      dto.title = updates.title;
    }
    if (updates.dueDate !== undefined || updates.dueTime !== undefined) {
      dto.dueDate = parseDueDateString(updates.dueDate ?? updated.dueDate, updates.dueTime ?? updated.dueTime);
    }
    if (updates.isRecurring !== undefined) {
      dto.repeat = mapIsRecurringToRepeat(updates.isRecurring);
    }
    // Note: assigneeId mapping requires user lookup - left as undefined for now
    await api.patch(`/chores/${choreId}`, dto);
    // Server is authority: fetch the updated chore to get server timestamps
    const updatedChore = await this.getChores().then(chores => chores.find(c => c.id === choreId));
    if (!updatedChore) {
      throw new Error(`Failed to retrieve updated chore with id: ${choreId}`);
    }

    // Write-through cache update: update entity in cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('chores', updatedChore, (c) => c.id, (c) => c.id === choreId);

    return updatedChore;
  }

  async deleteChore(choreId: string): Promise<void> {
    // Get existing chore
    const existing = await this.getChores().then(chores =>
      chores.find(c => c.id === choreId)
    );
    if (!existing) {
      throw new Error(`Chore not found: ${choreId}`);
    }

    // Apply timestamp for optimistic UI and offline queue
    const deleted = markDeleted(existing);
    const withTimestamps = withUpdatedAt(deleted);
    const payload = toSupabaseTimestamps(withTimestamps);

    // Use DELETE as expected by backend
    await api.delete(`/chores/${choreId}`);

    // Write-through cache update: update entity in cache with deleted timestamp
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('chores', withTimestamps, (c) => c.id, (c) => c.id === choreId);
  }

  async toggleChore(choreId: string): Promise<Chore> {
    // Get existing chore
    const existing = await this.getChores().then(chores =>
      chores.find(c => c.id === choreId)
    );
    if (!existing) {
      throw new Error(`Chore not found: ${choreId}`);
    }

    // Apply timestamp for optimistic UI and offline queue
    const updated = {
      ...existing,
      isCompleted: !existing.isCompleted
    };
    const withTimestamps = withUpdatedAt(updated);
    const payload = toSupabaseTimestamps(withTimestamps);

    await api.patch(`/chores/${choreId}/status`, {
      isCompleted: !existing.isCompleted
    });
    // Server is authority: fetch the updated chore to get server timestamps
    const updatedChore = await this.getChores().then(chores => chores.find(c => c.id === choreId));
    if (!updatedChore) {
      throw new Error(`Failed to retrieve updated chore with id: ${choreId}`);
    }

    // Write-through cache update: update entity in cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('chores', updatedChore, (c) => c.id, (c) => c.id === choreId);

    return updatedChore;
  }
}

/**
 * Creates a chores service based on the data mode
 * 
 * @param mode - The data mode ('guest' | 'signed-in')
 * @param entityType - The type of entity being accessed (for validation)
 * @returns The appropriate chores service implementation
 * @throws Error if the mode and service type are incompatible
 * 
 * @remarks
 * Note: Conflict resolution (sync application) should be called in the sync pipeline/repository layer,
 * NOT inside Remote*Service methods. This keeps services focused on transport.
 */
export const createChoresService = (
  mode: 'guest' | 'signed-in',
  entityType: 'chores' = 'chores'
): IChoresService => {
  // Validate service compatibility
  const serviceType = mode === 'guest' ? 'local' : 'remote';
  validateServiceCompatibility(serviceType, mode);

  return mode === 'guest' ? new LocalChoresService() : new RemoteChoresService();
};

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use createChoresService with mode parameter instead
 */
export const createChoresServiceLegacy = (isMockEnabled: boolean): IChoresService => {
  const mode = isMockEnabled ? 'guest' : 'signed-in';
  return createChoresService(mode);
};
