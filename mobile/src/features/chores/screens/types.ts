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
  section: 'today' | 'thisWeek';
}) => Promise<void> | void;
