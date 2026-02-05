import type { BaseEntity } from '../../common/types/entityMetadata';

export interface Chore extends BaseEntity {
  title: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  reminder?: string;
  isRecurring?: boolean;
  isCompleted: boolean;
  section: 'today' | 'thisWeek' | 'recurring';
  icon?: string;
  originalDate?: Date | null;
}

export const mockChores: Chore[] = [
  { id: '1', localId: '550e8400-e29b-41d4-a716-446655440200', title: 'Wash dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', reminder: '1h', isCompleted: false, section: 'today', icon: '🍽️' },
  { id: '2', localId: '550e8400-e29b-41d4-a716-446655440201', title: 'Fold Mitadm', assignee: 'Dad', dueDate: 'Today', dueTime: '3:00 PM', reminder: '30m', isCompleted: true, section: 'today', icon: '👕' },
  { id: '3', localId: '550e8400-e29b-41d4-a716-446655440202', title: 'Wash Dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', isCompleted: false, section: 'today', icon: '🍽️' },
  { id: '4', localId: '550e8400-e29b-41d4-a716-446655440203', title: 'Fold bltroom', assignee: 'Kids', dueDate: 'Today', dueTime: '1:00 PM', isCompleted: false, section: 'today', icon: '🧹' },
  { id: '5', localId: '550e8400-e29b-41d4-a716-446655440204', title: 'Vacuum Living Room', assignee: 'Kids', dueDate: 'Tomorrow', dueTime: '10:00 AM', isCompleted: false, section: 'thisWeek', icon: '🧹' },
  { id: '6', localId: '550e8400-e29b-41d4-a716-446655440205', title: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '10:00 AM', isCompleted: false, section: 'thisWeek', icon: '👕' },
  { id: '7', localId: '550e8400-e29b-41d4-a716-446655440206', title: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '9:00 AM', isCompleted: false, section: 'thisWeek', icon: '👕' },
  { id: '8', localId: '550e8400-e29b-41d4-a716-446655440207', title: 'Mop Kitchen Floor', assignee: 'Dad', dueDate: 'Wednesday', dueTime: '9:00 AM', isCompleted: false, section: 'thisWeek', icon: '🧽' },
];

export { mockChoresDB } from './choreTemplates';
