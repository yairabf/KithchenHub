export interface Chore {
  id: string;
  name: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  icon?: string;
}

export interface ChoreDetailsModalProps {
  visible: boolean;
  chore: Chore | null;
  onClose: () => void;
  onUpdateAssignee: (choreId: string, assignee: string | undefined) => void;
  onUpdateChore?: (choreId: string, updates: Partial<Chore>) => void;
}
