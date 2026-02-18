import type { Chore } from "../../../../mocks/chores";

export interface ImportantChoresCardProps {
  isTablet: boolean;
  isRtl: boolean;
  choresLoading: boolean;
  chores: Chore[];
  onToggleChore: (choreId: string) => void | Promise<void>;
  onNavigateToChores: () => void;
  onOpenChoresModal: () => void;
}
