export interface Chore {
  id: string;
  name: string;
  completed: boolean;
  assignee?: string;
}

export interface ChoreTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface ChoresQuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddChore?: (chore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => void;
}
