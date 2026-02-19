export interface ChoresScreenProps {
  onOpenChoresModal?: () => void;
  onRegisterAddChoreHandler?: (handler: AddChoreHandler) => void;
}

export type AddChoreHandler = (newChore: {
  title: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | null;
  section: 'today' | 'thisWeek' | 'recurring';
}) => Promise<void> | void;
