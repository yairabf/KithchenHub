import type { LayoutChangeEvent } from 'react-native';
import type { Chore } from '../../../../mocks/chores';

export interface ChoresSectionProps {
  title: string;
  chores: Chore[];
  indicatorColor?: 'primary' | 'secondary';
  isWebRtl?: boolean;
  renderChoreCard: (chore: Chore) => React.ReactNode;
  testID?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
}
