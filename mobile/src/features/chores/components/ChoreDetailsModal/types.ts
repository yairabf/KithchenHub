import { Chore } from '../../../../mocks/chores';

export type { Chore };

export interface ChoreDetailsModalProps {
  visible: boolean;
  chore: Chore | null;
  onClose: () => void;
  onUpdateAssignee: (choreId: string, assignee: string | undefined) => void;
  onUpdateChore?: (choreId: string, updates: Partial<Chore>) => void;
}
