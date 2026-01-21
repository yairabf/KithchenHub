export interface Chore {
  id: string;
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
  { id: '1', name: 'Wash dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', reminder: '1h', completed: false, section: 'today', icon: '🍽️' },
  { id: '2', name: 'Fold Mitadm', assignee: 'Dad', dueDate: 'Today', dueTime: '3:00 PM', reminder: '30m', completed: true, section: 'today', icon: '👕' },
  { id: '3', name: 'Wash Dishes', assignee: 'Mom', dueDate: 'Today', dueTime: '6:00 PM', completed: false, section: 'today', icon: '🍽️' },
  { id: '4', name: 'Fold bltroom', assignee: 'Kids', dueDate: 'Today', dueTime: '1:00 PM', completed: false, section: 'today', icon: '🧹' },
  { id: '5', name: 'Vacuum Living Room', assignee: 'Kids', dueDate: 'Tomorrow', dueTime: '10:00 AM', completed: false, section: 'thisWeek', icon: '🧹' },
  { id: '6', name: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '10:00 AM', completed: false, section: 'thisWeek', icon: '👕' },
  { id: '7', name: 'Fold Laundry', assignee: 'All', dueDate: 'Tomorrow', dueTime: '9:00 AM', completed: false, section: 'thisWeek', icon: '👕' },
  { id: '8', name: 'Mop Kitchen Floor', assignee: 'Dad', dueDate: 'Wednesday', dueTime: '9:00 AM', completed: false, section: 'thisWeek', icon: '🧽' },
];
