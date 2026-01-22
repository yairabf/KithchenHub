export interface Chore {
  id: string; // Legacy/Display ID for now
  localId: string; // Stable UUID
  name: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  reminder?: string;
  isRecurring?: boolean;
  completed: boolean;
  section: 'today' | 'thisWeek' | 'recurring';
  icon?: string;
}

export const mockChores: Chore[] = [
  { id: '1', localId: '550e8400-e29b-41d4-a716-446655440200', name: 'Wash dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', reminder: '1h', completed: false, section: 'today', icon: '🍽️' },
  { id: '2', localId: '550e8400-e29b-41d4-a716-446655440201', name: 'Fold Mitadm', assignee: 'Dad', dueDate: 'Today', dueTime: '3:00 PM', reminder: '30m', completed: true, section: 'today', icon: '👕' },
  { id: '3', localId: '550e8400-e29b-41d4-a716-446655440202', name: 'Wash Dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', completed: false, section: 'today', icon: '🍽️' },
  { id: '4', localId: '550e8400-e29b-41d4-a716-446655440203', name: 'Fold bltroom', assignee: 'Kids', dueDate: 'Today', dueTime: '1:00 PM', completed: false, section: 'today', icon: '🧹' },
  { id: '5', localId: '550e8400-e29b-41d4-a716-446655440204', name: 'Vacuum Living Room', assignee: 'Kids', dueDate: 'Tomorrow', dueTime: '10:00 AM', completed: false, section: 'thisWeek', icon: '🧹' },
  { id: '6', localId: '550e8400-e29b-41d4-a716-446655440205', name: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '10:00 AM', completed: false, section: 'thisWeek', icon: '👕' },
  { id: '7', localId: '550e8400-e29b-41d4-a716-446655440206', name: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '9:00 AM', completed: false, section: 'thisWeek', icon: '👕' },
  { id: '8', localId: '550e8400-e29b-41d4-a716-446655440207', name: 'Mop Kitchen Floor', assignee: 'Dad', dueDate: 'Wednesday', dueTime: '9:00 AM', completed: false, section: 'thisWeek', icon: '🧽' },
];
