import { api } from '../../../services/api';
import { mockChores, type Chore } from '../../../mocks/chores';
import type { DataMode } from '../../../common/types/dataModes';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';
import { withUpdatedAt, markDeleted, withCreatedAt, toSupabaseTimestamps, normalizeTimestampsFromApi } from '../../../common/utils/timestamps';
import { findEntityIndex, updateEntityInStorage } from '../../../common/utils/entityOperations';
import { guestStorage } from '../../../common/utils/guestStorage';
import { createChore } from '../utils/choreFactory';

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

export class LocalChoresService implements IChoresService {
  async getChores(): Promise<Chore[]> {
    // Read from real guest storage, return empty array if no data exists
    const guestChores = await guestStorage.getChores();
    return guestChores.length > 0 ? guestChores : [...mockChores];
  }

  async createChore(chore: Partial<Chore>): Promise<Chore> {
    if (!chore.name) {
      throw new Error('Chore must have a name');
    }
    
    const newChore = createChore({
      name: chore.name,
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
      (chore) => withUpdatedAt({ ...chore, completed: !chore.completed }),
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
    if (!chore.name) {
      throw new Error('Chore must have a name');
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const withTimestamps = withCreatedAt(chore as Chore);
    const payload = toSupabaseTimestamps(withTimestamps);
    // Map to backend DTO format
    const dto = {
      title: payload.name || chore.name,
      assigneeId: undefined, // Would need to map assignee name to ID
      dueDate: undefined, // Would need to parse dueDate string
      repeat: undefined,
    };
    const response = await api.post<{ id: string }>('/chores', dto);
    // Server is authority: fetch the created chore to get server timestamps
    const created = await this.getChores().then(chores => chores.find(c => c.id === response.id));
    if (!created) {
      throw new Error(`Failed to retrieve created chore with id: ${response.id}`);
    }
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
    const dto = {
      title: payload.name || updates.name,
      assigneeId: undefined, // Would need to map assignee name to ID
      dueDate: undefined, // Would need to parse dueDate string
    };
    await api.patch(`/chores/${choreId}`, dto);
    // Server is authority: fetch the updated chore to get server timestamps
    const updatedChore = await this.getChores().then(chores => chores.find(c => c.id === choreId));
    if (!updatedChore) {
      throw new Error(`Failed to retrieve updated chore with id: ${choreId}`);
    }
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
    
    // Use PATCH instead of DELETE with body (more compatible)
    await api.patch(`/chores/${choreId}`, { deleted_at: payload.deleted_at });
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
      completed: !existing.completed 
    };
    const withTimestamps = withUpdatedAt(updated);
    const payload = toSupabaseTimestamps(withTimestamps);
    
    await api.patch(`/chores/${choreId}`, { 
      is_completed: !existing.completed,
      updated_at: payload.updated_at 
    });
    // Server is authority: fetch the updated chore to get server timestamps
    const updatedChore = await this.getChores().then(chores => chores.find(c => c.id === choreId));
    if (!updatedChore) {
      throw new Error(`Failed to retrieve updated chore with id: ${choreId}`);
    }
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
  // Public catalog cannot use chores service
  if (mode === 'public-catalog') {
    throw new Error('Public catalog cannot use chores service.');
  }
  
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
