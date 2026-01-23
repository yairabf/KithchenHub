import { api } from '../../../services/api';
import { mockChores, type Chore } from '../../../mocks/chores';

/**
 * Provides chore data sources (mock vs remote) for the chores feature.
 */
export interface IChoresService {
  getChores(): Promise<Chore[]>;
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
    return [...mockChores];
  }
}

export class RemoteChoresService implements IChoresService {
  async getChores(): Promise<Chore[]> {
    const response = await api.get<ChoreListResponseDto>('/chores');
    const todayChores = response.today.map((chore) => mapChoreDto(chore, 'today'));
    const upcomingChores = response.upcoming.map((chore) => mapChoreDto(chore, 'thisWeek'));

    return [...todayChores, ...upcomingChores];
  }
}

export const createChoresService = (isMockEnabled: boolean): IChoresService => {
  return isMockEnabled ? new LocalChoresService() : new RemoteChoresService();
};
