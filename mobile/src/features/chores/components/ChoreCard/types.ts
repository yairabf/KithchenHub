import type { Chore } from '../../../../mocks/chores';

export interface ChoreCardProps {
  chore: Chore;
  bgColor: string;
  isWebRtl?: boolean;
  onToggle: (id: string) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (id: string) => void;
}
