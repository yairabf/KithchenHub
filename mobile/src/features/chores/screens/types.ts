export interface ChoresScreenProps {
  onOpenChoresModal?: () => void;
  onRegisterAddChoreHandler?: (handler: AddChoreHandler) => void;
}

export type AddChoreHandler = (newChore: {
  name: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  section: 'today' | 'thisWeek';
}) => void;
